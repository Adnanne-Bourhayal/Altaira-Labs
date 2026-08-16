package com.altaira.backend.service;

import com.altaira.backend.dto.media.CreateUploadUrlRequest;
import com.altaira.backend.dto.media.PreparePrivateUploadRequest;
import com.altaira.backend.dto.media.UploadUrlResponse;
import com.altaira.backend.security.ClientAccessContext;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Owns the private S3 object boundary used by onboarding and project assets.
 * It validates tenant-scoped keys and file metadata before issuing short-lived
 * presigned uploads or opening a stored object; it never exposes AWS credentials.
 */
@Service
public class MediaUploadUrlService {

    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";
    private static final String S3_STORAGE_PREFIX = "s3://";
    private static final Set<String> ALLOWED_FOLDERS = Set.of("branding", "legal", "multimedia");
    private static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "app", "bat", "cmd", "com", "dll", "dmg", "exe", "html", "htm", "jar",
            "js", "mjs", "msi", "php", "ps1", "scr", "sh", "vbs"
    );

    private final boolean enabled;
    private final String region;
    private final String privateBucket;
    private final String publicBucket;
    private final String publicBaseUrl;
    private final long presignTtlSeconds;
    private final long maxFileSizeBytes;
    private final S3Client s3Client;
    private final S3Presigner presigner;

    @Autowired
    public MediaUploadUrlService(
            @Value("${altaira.media.s3.enabled:false}") boolean enabled,
            @Value("${altaira.media.s3.region:}") String region,
            @Value("${altaira.media.s3.private-bucket:}") String privateBucket,
            @Value("${altaira.media.s3.public-bucket:}") String publicBucket,
            @Value("${altaira.media.s3.public-base-url:}") String publicBaseUrl,
            @Value("${altaira.media.s3.presign-ttl-seconds:900}") long presignTtlSeconds,
            @Value("${altaira.onboarding.max-file-size-bytes:15728640}") long maxFileSizeBytes
    ) {
        this.enabled = enabled;
        this.region = trimToNull(region);
        this.privateBucket = trimToNull(privateBucket);
        this.publicBucket = trimToNull(publicBucket);
        this.publicBaseUrl = trimToNull(publicBaseUrl);
        this.presignTtlSeconds = Math.max(60, Math.min(presignTtlSeconds, 3600));
        this.maxFileSizeBytes = Math.max(1, maxFileSizeBytes);

        if (enabled && (this.region == null || this.privateBucket == null)) {
            throw new IllegalStateException("S3 uploads are enabled but region or private bucket is missing");
        }

        if (enabled) {
            Region awsRegion = Region.of(this.region);
            this.s3Client = S3Client.builder().region(awsRegion).build();
            this.presigner = S3Presigner.builder().region(awsRegion).build();
        } else {
            this.s3Client = null;
            this.presigner = null;
        }
    }

    MediaUploadUrlService(
            boolean enabled,
            String region,
            String privateBucket,
            String publicBucket,
            String publicBaseUrl,
            long presignTtlSeconds
    ) {
        this(enabled, region, privateBucket, publicBucket, publicBaseUrl, presignTtlSeconds, 15_728_640L);
    }

    MediaUploadUrlService(
            boolean enabled,
            String region,
            String privateBucket,
            String publicBucket,
            String publicBaseUrl,
            long presignTtlSeconds,
            long maxFileSizeBytes,
            S3Client s3Client,
            S3Presigner presigner
    ) {
        this.enabled = enabled;
        this.region = trimToNull(region);
        this.privateBucket = trimToNull(privateBucket);
        this.publicBucket = trimToNull(publicBucket);
        this.publicBaseUrl = trimToNull(publicBaseUrl);
        this.presignTtlSeconds = Math.max(60, Math.min(presignTtlSeconds, 3600));
        this.maxFileSizeBytes = Math.max(1, maxFileSizeBytes);

        if (enabled && (this.region == null || this.privateBucket == null || s3Client == null || presigner == null)) {
            throw new IllegalStateException("S3 uploads are enabled but configuration or clients are missing");
        }

        this.s3Client = enabled ? s3Client : null;
        this.presigner = enabled ? presigner : null;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public UploadUrlResponse createClientUploadUrl(ClientAccessContext context, CreateUploadUrlRequest request) {
        String folder = normalizeFolder(request.getFolder());
        return createUploadUrl(
                context.client().getId(),
                folder,
                request.getServiceKey(),
                "general",
                UUID.randomUUID(),
                request.getFilename(),
                request.getContentType(),
                null
        );
    }

    public UploadUrlResponse createContextUploadUrl(
            UUID clientId,
            String folder,
            String serviceKey,
            String contextType,
            UUID contextId,
            PreparePrivateUploadRequest request
    ) {
        validateFileSize(request.getSizeBytes());
        return createUploadUrl(
                clientId,
                normalizeFolder(folder),
                serviceKey,
                contextType,
                contextId,
                request.getFilename(),
                request.getContentType(),
                request.getSizeBytes()
        );
    }

    public VerifiedS3Object verifyCompletedUpload(
            UUID clientId,
            String folder,
            String serviceKey,
            String contextType,
            UUID contextId,
            String bucket,
            String objectKey,
            String filename,
            String expectedContentType,
            long expectedSizeBytes
    ) {
        requireEnabled();
        validateFileSize(expectedSizeBytes);

        String normalizedBucket = trimToNull(bucket);
        String normalizedKey = trimToNull(objectKey);
        String normalizedFilename = sanitizeFilename(filename);
        String normalizedContentType = normalizeContentType(expectedContentType);
        String normalizedFolder = normalizeFolder(folder);

        ensureAllowedBucket(normalizedBucket);
        if (!normalizedBucket.equals(bucketForFolder(normalizedFolder))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "S3 bucket does not match the upload category");
        }
        ensureExpectedObjectKey(
                normalizedKey,
                normalizedFolder,
                clientId,
                serviceKey,
                contextType,
                contextId,
                normalizedFilename
        );

        try {
            HeadObjectResponse head = s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(normalizedBucket)
                    .key(normalizedKey)
                    .build());

            verifyMetadata(head.metadata(), clientId, serviceKey, contextType, contextId, expectedSizeBytes);

            long actualSize = head.contentLength();
            if (actualSize != expectedSizeBytes || actualSize > maxFileSizeBytes) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file size does not match the prepared upload");
            }

            String actualContentType = normalizeContentType(head.contentType());
            if (!actualContentType.equalsIgnoreCase(normalizedContentType)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file content type does not match the prepared upload");
            }

            return new VerifiedS3Object(
                    S3_STORAGE_PREFIX + normalizedBucket + "/" + normalizedKey,
                    normalizedBucket,
                    normalizedKey,
                    normalizedFilename,
                    storedFilename(normalizedKey),
                    actualContentType,
                    actualSize,
                    null
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded object could not be found in S3");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Uploaded object could not be verified in S3");
        } catch (SdkClientException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "S3 could not be reached to verify the upload");
        }
    }

    public boolean isS3StorageKey(String storageKey) {
        return storageKey != null && storageKey.startsWith(S3_STORAGE_PREFIX);
    }

    public ResponseInputStream<GetObjectResponse> openStoredObject(String storageKey) {
        requireEnabled();
        StoredObjectLocation location = parseStorageKey(storageKey);
        ensureAllowedBucket(location.bucket());

        try {
            return s3Client.getObject(GetObjectRequest.builder()
                    .bucket(location.bucket())
                    .key(location.objectKey())
                    .build());
        } catch (S3Exception ex) {
            if (ex.statusCode() == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Stored S3 object was not found");
            }
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stored S3 object could not be downloaded");
        } catch (SdkClientException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "S3 could not be reached to download the object");
        }
    }

    public void deleteStoredObjectQuietly(String storageKey) {
        if (!enabled || !isS3StorageKey(storageKey)) {
            return;
        }

        try {
            StoredObjectLocation location = parseStorageKey(storageKey);
            ensureAllowedBucket(location.bucket());
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(location.bucket())
                    .key(location.objectKey())
                    .build());
        } catch (RuntimeException ignored) {
            // Best-effort cleanup only. The original operation reports its own failure.
        }
    }

    @PreDestroy
    void closeClients() {
        if (presigner != null) {
            presigner.close();
        }
        if (s3Client != null) {
            s3Client.close();
        }
    }

    private UploadUrlResponse createUploadUrl(
            UUID clientId,
            String folder,
            String serviceKey,
            String contextType,
            UUID contextId,
            String filename,
            String contentType,
            Long expectedSizeBytes
    ) {
        String normalizedContentType = normalizeContentType(contentType);
        String safeFilename = sanitizeFilename(filename);
        ensureSafeFile(safeFilename, normalizedContentType);
        requireEnabled();

        String normalizedServiceKey = sanitizePathSegment(serviceKey == null || serviceKey.isBlank() ? "general" : serviceKey);
        String normalizedContextType = sanitizePathSegment(contextType);
        String objectKey = buildObjectKey(
                folder,
                clientId,
                normalizedServiceKey,
                normalizedContextType,
                contextId,
                safeFilename
        );
        String bucket = bucketForFolder(folder);
        Instant expiresAt = Instant.now().plusSeconds(presignTtlSeconds);
        Map<String, String> metadata = uploadMetadata(
                clientId,
                normalizedServiceKey,
                normalizedContextType,
                contextId,
                expectedSizeBytes
        );

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(normalizedContentType)
                    .metadata(metadata)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(presignTtlSeconds))
                    .putObjectRequest(putObjectRequest)
                    .build();

            var presignedRequest = presigner.presignPutObject(presignRequest);
            Map<String, String> headers = new LinkedHashMap<>();
            headers.put("Content-Type", normalizedContentType);
            metadata.forEach((key, value) -> headers.put("x-amz-meta-" + key, value));

            return new UploadUrlResponse(
                    "PUT",
                    presignedRequest.url().toString(),
                    bucket,
                    objectKey,
                    publicUrlFor(folder, objectKey),
                    expiresAt,
                    headers
            );
        } catch (SdkClientException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "S3 presigned upload could not be created");
        }
    }

    private Map<String, String> uploadMetadata(
            UUID clientId,
            String serviceKey,
            String contextType,
            UUID contextId,
            Long expectedSizeBytes
    ) {
        Map<String, String> metadata = new LinkedHashMap<>();
        metadata.put("altaira-client-id", clientId.toString());
        metadata.put("altaira-service-key", serviceKey);
        metadata.put("altaira-context-type", contextType);
        metadata.put("altaira-context-id", contextId.toString());
        if (expectedSizeBytes != null) {
            metadata.put("altaira-expected-size", expectedSizeBytes.toString());
        }
        return metadata;
    }

    private void verifyMetadata(
            Map<String, String> metadata,
            UUID clientId,
            String serviceKey,
            String contextType,
            UUID contextId,
            long expectedSizeBytes
    ) {
        String normalizedServiceKey = sanitizePathSegment(serviceKey == null || serviceKey.isBlank() ? "general" : serviceKey);
        String normalizedContextType = sanitizePathSegment(contextType);

        if (!clientId.toString().equals(metadata.get("altaira-client-id")) ||
                !normalizedServiceKey.equals(metadata.get("altaira-service-key")) ||
                !normalizedContextType.equals(metadata.get("altaira-context-type")) ||
                !contextId.toString().equals(metadata.get("altaira-context-id")) ||
                !Long.toString(expectedSizeBytes).equals(metadata.get("altaira-expected-size"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded object metadata does not match the prepared upload");
        }
    }

    private void ensureExpectedObjectKey(
            String objectKey,
            String folder,
            UUID clientId,
            String serviceKey,
            String contextType,
            UUID contextId,
            String filename
    ) {
        if (objectKey == null) {
            throw new IllegalArgumentException("objectKey is required");
        }

        String normalizedServiceKey = sanitizePathSegment(serviceKey == null || serviceKey.isBlank() ? "general" : serviceKey);
        String normalizedContextType = sanitizePathSegment(contextType);
        String expectedPrefix = folder + "/" + clientId + "/" + normalizedServiceKey + "/" +
                normalizedContextType + "/" + contextId + "/";

        if (!objectKey.startsWith(expectedPrefix) || !objectKey.endsWith("-" + filename)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "S3 object does not belong to this client context");
        }
    }

    private void ensureAllowedBucket(String bucket) {
        if (bucket == null || (!bucket.equals(privateBucket) && !bucket.equals(publicBucket))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "S3 bucket is not allowed for this application");
        }
    }

    private void ensureSafeFile(String filename, String contentType) {
        int separator = filename.lastIndexOf('.');
        String extension = separator < 0 ? "" : filename.substring(separator + 1).toLowerCase(Locale.ROOT);
        String normalizedType = contentType.toLowerCase(Locale.ROOT);

        if (BLOCKED_EXTENSIONS.contains(extension) ||
                normalizedType.contains("javascript") ||
                normalizedType.equals("text/html") ||
                normalizedType.equals("application/x-msdownload")) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "This file type is not allowed");
        }
    }

    private void validateFileSize(long sizeBytes) {
        if (sizeBytes <= 0) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }
        if (sizeBytes > maxFileSizeBytes) {
            throw new IllegalArgumentException("Uploaded file is larger than the configured limit");
        }
    }

    private void requireEnabled() {
        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "S3 presigned uploads are not configured");
        }
    }

    private String normalizeFolder(String rawFolder) {
        String normalized = trimToNull(rawFolder);
        if (normalized == null) {
            throw new IllegalArgumentException("folder is required");
        }

        normalized = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]+", "-");
        if (!ALLOWED_FOLDERS.contains(normalized)) {
            throw new IllegalArgumentException("folder must be one of: branding, legal, multimedia");
        }
        return normalized;
    }

    private String bucketForFolder(String folder) {
        if (("branding".equals(folder) || "multimedia".equals(folder)) && publicBucket != null) {
            return publicBucket;
        }
        return privateBucket;
    }

    private String publicUrlFor(String folder, String objectKey) {
        if ((!"branding".equals(folder) && !"multimedia".equals(folder)) || publicBaseUrl == null) {
            return null;
        }
        return publicBaseUrl.replaceAll("/+$", "") + "/" + objectKey;
    }

    private String buildObjectKey(
            String folder,
            UUID clientId,
            String serviceKey,
            String contextType,
            UUID contextId,
            String filename
    ) {
        return folder + "/" + clientId + "/" + serviceKey + "/" + contextType + "/" + contextId + "/" +
                UUID.randomUUID() + "-" + filename;
    }

    private StoredObjectLocation parseStorageKey(String storageKey) {
        if (!isS3StorageKey(storageKey)) {
            throw new IllegalArgumentException("Invalid S3 storage key");
        }

        String location = storageKey.substring(S3_STORAGE_PREFIX.length());
        int separator = location.indexOf('/');
        if (separator <= 0 || separator == location.length() - 1) {
            throw new IllegalArgumentException("Invalid S3 storage key");
        }
        return new StoredObjectLocation(location.substring(0, separator), location.substring(separator + 1));
    }

    private String storedFilename(String objectKey) {
        int separator = objectKey.lastIndexOf('/');
        return separator < 0 ? objectKey : objectKey.substring(separator + 1);
    }

    private String sanitizePathSegment(String value) {
        String source = trimToNull(value);
        if (source == null) {
            return "general";
        }
        String sanitized = source.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]+", "-");
        sanitized = sanitized.replaceAll("^-+|-+$", "");
        return sanitized.isBlank() ? "general" : sanitized;
    }

    private String sanitizeFilename(String filename) {
        String sanitized = trimToNull(filename);
        if (sanitized == null) {
            throw new IllegalArgumentException("filename is required");
        }

        sanitized = sanitized.replace("\\", "/");
        int lastSlash = sanitized.lastIndexOf('/');
        if (lastSlash >= 0) {
            sanitized = sanitized.substring(lastSlash + 1);
        }

        sanitized = sanitized.replaceAll("[^A-Za-z0-9._-]+", "-").replaceAll("^-+|-+$", "");
        return sanitized.isBlank() ? "upload.bin" : sanitized;
    }

    private String normalizeContentType(String rawContentType) {
        String normalized = trimToNull(rawContentType);
        return normalized == null ? DEFAULT_CONTENT_TYPE : normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    public record VerifiedS3Object(
            String storageKey,
            String bucket,
            String objectKey,
            String originalFilename,
            String storedFilename,
            String contentType,
            long sizeBytes,
            String checksumSha256
    ) {}

    private record StoredObjectLocation(String bucket, String objectKey) {}
}
