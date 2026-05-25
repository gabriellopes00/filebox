import { dynamoDbClient } from '@/lib/dynamo-db-client.js'
import { s3Client } from '@/lib/s3-client.js'
import { parseHttpEvent } from '@/utils/parse-http-event.js'
import { parseHttpResponse } from '@/utils/parse-http-response.js'
import { BatchGetCommand, BatchWriteCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { AbortMultipartUploadCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import type { FileIdsParams } from '@filebox/shared/http-contracts/file-id-params.js'
import type { File } from '@/models/file.js'

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = parseHttpEvent<FileIdsParams>(event)
  const { fileIds } = body

  const { Responses } = await dynamoDbClient.send(
    new BatchGetCommand({ RequestItems: { FileboxFiles: { Keys: fileIds.map((id) => ({ id })) } } })
  )

  const files = (Responses?.FileboxFiles ?? []) as File[]

  const availableFiles = files.filter((file) => file.status === 'available')
  const pendingMpuFiles = files.filter((file) => file.status === 'pending' && file.uploadId)
  const pendingFiles = files.filter((file) => file.status === 'pending' && !file.uploadId)

  if (availableFiles.length > 0) {
    await softDeleteAvailableFiles(availableFiles)
  }

  const abortedMpuFiles = pendingMpuFiles.length > 0 ? await abortMpus(pendingMpuFiles) : []

  const dynamoOnlyDeletes = [...pendingFiles, ...abortedMpuFiles]
  if (dynamoOnlyDeletes.length > 0) {
    await dynamoDbClient.send(
      new BatchWriteCommand({
        RequestItems: {
          FileboxFiles: dynamoOnlyDeletes.map((file) => ({
            DeleteRequest: { Key: { id: file.id } }
          }))
        }
      })
    )
  }

  return parseHttpResponse(204)
}

async function softDeleteAvailableFiles(availableFiles: File[]): Promise<void> {
  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: availableFiles.map((file) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id: file.id },
          UpdateExpression: 'SET #status = :status',
          ConditionExpression: 'attribute_exists(id) AND #status = :available',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'deleting', ':available': 'available' }
        }
      }))
    })
  )

  const result = await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: process.env.BUCKET_NAME,
      Delete: { Objects: availableFiles.map((file) => ({ Key: file.key })), Quiet: false }
    })
  )

  if (!result.Errors || result.Errors.length === 0) return

  const failedKeys = new Set(result.Errors.map((error) => error.Key!))
  const failedFiles = availableFiles.filter((file) => failedKeys.has(file.key))

  await dynamoDbClient.send(
    new TransactWriteCommand({
      TransactItems: failedFiles.map((file) => ({
        Update: {
          TableName: 'FileboxFiles',
          Key: { id: file.id },
          UpdateExpression: 'SET #status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'delete_failed' }
        }
      }))
    })
  )

  throw new Error(`Failed to delete files with keys: ${[...failedKeys].join(', ')}`)
}

async function abortMpus(pendingMpuFiles: File[]): Promise<File[]> {
  const results = await Promise.allSettled(
    pendingMpuFiles.map((file) =>
      s3Client.send(
        new AbortMultipartUploadCommand({
          Bucket: process.env.BUCKET_NAME,
          Key: file.key,
          UploadId: file.uploadId
        })
      )
    )
  )

  return pendingMpuFiles.filter((_, index) => results[index]!.status === 'fulfilled')
}
