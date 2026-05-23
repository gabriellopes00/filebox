import { parseHttpResponse } from '@/utils/parse-http-response.js'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { randomUUID } from 'node:crypto'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { File } from '@/models/file.js'
import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import {
  CreateMultipartUploadCommand,
  PutObjectCommand,
  UploadPartCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type {
  GetUploadUrlsParams,
  GetUploadUrlsResult
} from '@filebox/shared/http-contracts/get-upload-url.js'
import { generateFileKey, getFileExtension } from '@filebox/shared/utils/file.js'
import { s3Client } from '@/lib/s3-client.js'
import { type FileStatus, MULTIPART_THRESHOLD, PART_SIZE } from '@filebox/shared/data/file-data.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<GetUploadUrlsParams>(event)

  const singleFiles: { data: File; uploadUrl: string; clientRef: string }[] = []
  const multipartFiles: {
    data: File
    partSize: number
    parts: { partNumber: number; uploadUrl: string }[]
    clientRef: string
  }[] = []

  for (const { clientRef, filename, contentType, size, checksum } of body.files) {
    const fileId = randomUUID()
    const status: FileStatus = 'pending'

    const fileExtension = getFileExtension(filename)
    const fileKey = generateFileKey(fileId, fileExtension)

    const file = new File({
      id: fileId,
      name: filename,
      size,
      contentType,
      checksum,
      status,
      key: fileKey,
      source: 'upload'
    })

    if (size < MULTIPART_THRESHOLD) {
      const base64Checksum = Buffer.from(checksum, 'hex').toString('base64')
      const uploadUrl = await getSignedUrl(
        s3Client,
        new PutObjectCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file.key,
          ContentType: contentType,
          ContentLength: size,
          ChecksumSHA256: base64Checksum
        }),
        {
          expiresIn: 60 * 5,
          unhoistableHeaders: new Set(['x-amz-checksum-sha256'])
        }
      )

      singleFiles.push({ data: file, uploadUrl, clientRef })
      continue
    }

    const multipart = await s3Client.send(
      new CreateMultipartUploadCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: file.key,
        ContentType: contentType
      })
    )

    file.uploadId = multipart.UploadId

    const partUrlsPromises = []

    const totalParts = Math.ceil(size / PART_SIZE) // TODO: validate if totalParts is less than s3 limit (10k parts)
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      partUrlsPromises.push(
        getSignedUrl(
          s3Client,
          new UploadPartCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: file.key,
            UploadId: multipart.UploadId!,
            PartNumber: partNumber
          }),
          { expiresIn: 60 * 60 }
        )
      )
    }

    const parts = (await Promise.all(partUrlsPromises)).map((uploadUrl, index) => ({
      partNumber: index + 1,
      uploadUrl
    }))

    multipartFiles.push({
      clientRef,
      data: file,
      partSize: PART_SIZE,
      parts
    })
  }

  const ttl = Math.floor(Date.now() / 1000) + 60 * 5
  const batchWriteItems = [...singleFiles, ...multipartFiles].map(({ data }) => ({
    PutRequest: { Item: { ...data, ttl } }
  }))
  const insertCommand = new BatchWriteCommand({ RequestItems: { FileboxFiles: batchWriteItems } })
  await dynamoDbClient.send(insertCommand)

  const responseBody: GetUploadUrlsResult = {
    uploads: {
      single: singleFiles.map(({ uploadUrl, clientRef, data }) => {
        return { fileKey: data.key, clientRef, uploadUrl }
      }),
      multipart: multipartFiles.map(({ clientRef, partSize, parts, data }) => {
        return { clientRef, partSize, parts, fileId: data.id }
      })
    }
  }

  return parseHttpResponse<GetUploadUrlsResult>(200, responseBody)
}
