# filebox
Easy file management, just as it should be.
features:
- File upload to s3 with presigned URLs
- File download from s3 with presigned URLs
- Cloud watch for metrics and logging
- IA to analyse the file
- Dynamodb for metadata storage
- Serverless & lambda for backend
- React + vite + shadcn for frontend
- Typescript for typesafety
- URL shortening for easy sharing
- fuzzy search on files

requirements
- use multipart upload for files over -100mb

flow
- call /api/upload to get a presigned URL for upload (pass the file metadata in the body)
- register the file metadata in dynamodb with a unique id
- upload the file to s3 using the presigned URL
- trigger a lambda function to get file metadata and update the dynamodb record (integrity check)
