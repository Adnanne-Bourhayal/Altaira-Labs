export type DirectUploadReceipt = {
  bucket: string
  objectKey: string
  filename: string
  contentType: string
  sizeBytes: number
  assetType?: string
}

type PreparedUpload = {
  method?: string
  uploadUrl?: string
  bucket?: string
  objectKey?: string
  headers?: Record<string, string>
  error?: string
  message?: string
}

export async function uploadFileDirectly(
  file: File,
  prepareEndpoint: string,
  assetType?: string,
): Promise<DirectUploadReceipt | null> {
  const contentType = file.type || "application/octet-stream"
  const prepareResponse = await fetch(prepareEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType,
      sizeBytes: file.size,
      assetType,
    }),
  })

  if (prepareResponse.status === 501) {
    return null
  }

  const prepared = (await prepareResponse.json().catch(() => ({}))) as PreparedUpload
  if (!prepareResponse.ok) {
    throw new Error(prepared.message || prepared.error || "Could not prepare secure file upload.")
  }
  if (!prepared.uploadUrl || !prepared.bucket || !prepared.objectKey) {
    throw new Error("Secure upload preparation returned an incomplete response.")
  }

  const uploadResponse = await fetch(prepared.uploadUrl, {
    method: prepared.method || "PUT",
    headers: prepared.headers || { "Content-Type": contentType },
    body: file,
  })

  if (!uploadResponse.ok) {
    throw new Error("The file could not be transferred to secure storage.")
  }

  return {
    bucket: prepared.bucket,
    objectKey: prepared.objectKey,
    filename: file.name,
    contentType,
    sizeBytes: file.size,
    assetType,
  }
}
