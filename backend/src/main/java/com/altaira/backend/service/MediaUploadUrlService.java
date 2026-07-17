package com.altaira.backend.service;

import com.altaira.backend.dto.media.CreateUploadUrlRequest;
import com.altaira.backend.dto.media.UploadUrlResponse;
import com.altaira.backend.security.ClientAccessContext;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class MediaUploadUrlService {

    private static final String DEFAULT_CONTENT_TYPE = "application/octet-stream";

    private final boolean enabled;
    private final String region;
    private final String privateBucket;
    private final String publicBucket;
    private final String publicBaseUrl;
    private final long presignTtlSeconds;

    public MediaUploadUrlService(
            @Value("${altaira.media.s3.enabled:false}") boolean enabled,
            @Value("${altaira.media.s3.region:}") String region,
            @Value("${altaira.media.s3.private-bucket:}") String privateBucket,
            @Value("${altaira.media.s3.public-bucket:}") String publicBucket,
            @Value("${altaira.media.s3.public-base-url:}") String publicBaseUrl,
            @Value("${altaira.media.s3.presign-ttl-seconds:900}") long presignTtlSeconds
    ) {
        this.enabled = enabled;
        this.region = trimToNull(region);
        this.privateBucket = trimToNull(privateBucket);
        this.publicBucket = trimToNull(publicBucket);
        this.publicBaseUrl = trimToNull(publicBaseUrl);
        this.presignTtlSeconds = Math.max(60, Math.min(presignTtlSeconds, 3600));
    }

    public UploadUrlResponse createClientUploadUrl(ClientAccessContext context, CreateUploadUrlRequest request) {
        String folder = normalizeFolder(request.getFolder());
        String contentType = normalizeContentType(request.getContentType());
        String objectKey = buildObjectKey(
                folder,
                context.client().getId(),
                request.getServiceKey(),
                request.getFilename()
        );

        if (!enabled) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, "S3 presigned uploads are not configured");
        }

        String bucket = bucketForFolder(folder);
        if (region == null || bucket == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "S3 region or bucket is not configured");
        }

        Instant expiresAt = Instant.now().plusSeconds(presignTtlSeconds);

        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.of(region))
                .build()) {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(contentType)
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofSeconds(presignTtlSeconds))
                    .putObjectRequest(putObjectRequest)
                    .build();

            var presignedRequest = presigner.presignPutObject(presignRequest);

            return new UploadUrlResponse(
                    "PUT",
                    presignedRequest.url().toString(),
                    bucket,
                    objectKey,
                    publicUrlFor(folder, objectKey),
                    expiresAt,
                    Map.of("Content-Type", contentType)
            );
        } catch (SdkClientException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "S3 presigned upload could not be created");
        }
    }

    private String normalizeFolder(String rawFolder) {
        String normalized = trimToNull(rawFolder);
        if (normalized == null) {
            throw new IllegalArgumentException("folder is required");
        }

        normalized = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]+", "-");

        return switch (normalized) {
            case "branding", "legal", "multimedia" -> normalized;
            default -> throw new IllegalArgumentException("folder must be one of: branding, legal, multimedia");
        };
    }

    private String bucketForFolder(String folder) {
        if (("branding".equals(folder) || "multimedia".equals(folder)) && publicBucket != null) {
            return publicBucket;
        }

        return privateBucket;
    }

    private String publicUrlFor(String folder, String objectKey) {
        if (!"branding".equals(folder) && !"multimedia".equals(folder)) {
            return null;
        }

        if (publicBaseUrl == null) {
            return null;
        }

        return publicBaseUrl.replaceAll("/+$", "") + "/" + objectKey;
    }

    private String buildObjectKey(String folder, UUID clientId, String serviceKey, String filename) {
        String safeServiceKey = sanitizePathSegment(serviceKey == null || serviceKey.isBlank() ? "general" : serviceKey);
        String safeFilename = sanitizeFilename(filename);
        return folder + "/" + clientId + "/" + safeServiceKey + "/" + UUID.randomUUID() + "-" + safeFilename;
    }

    private String sanitizePathSegment(String value) {
        String sanitized = value.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]+", "-");
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
        if (normalized == null) {
            return DEFAULT_CONTENT_TYPE;
        }

        return normalized;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
