package com.altaira.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Stores onboarding files locally for development and transparently reads S3-backed
 * objects after a direct upload has been verified by {@link MediaUploadUrlService}.
 */
@Service
public class OnboardingFileStorageService {

    private final Path storageRoot;
    private final long maxFileSizeBytes;
    private final MediaUploadUrlService mediaUploadUrlService;

    public OnboardingFileStorageService(
            @Value("${altaira.onboarding.storage-dir}") String storageDir,
            @Value("${altaira.onboarding.max-file-size-bytes}") long maxFileSizeBytes,
            MediaUploadUrlService mediaUploadUrlService
    ) {
        this.storageRoot = Path.of(storageDir).toAbsolutePath().normalize();
        this.maxFileSizeBytes = maxFileSizeBytes;
        this.mediaUploadUrlService = mediaUploadUrlService;
    }

    public StoredOnboardingFile store(UUID clientId, UUID taskId, MultipartFile file) {
        return storeFile(clientId + "/" + taskId, file);
    }

    public StoredOnboardingFile storeProjectAsset(UUID clientId, UUID projectId, MultipartFile file) {
        return storeFile(clientId + "/projects/" + projectId, file);
    }

    private StoredOnboardingFile storeFile(String storagePrefix, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file cannot be empty");
        }

        try {
            byte[] bytes = file.getBytes();

            if (bytes.length > maxFileSizeBytes) {
                throw new IllegalArgumentException("Uploaded file is larger than the configured limit");
            }

            String originalFilename = safeFilename(file.getOriginalFilename());
            String storedFilename = UUID.randomUUID() + "-" + originalFilename;
            String storageKey = storagePrefix + "/" + storedFilename;
            Path target = resolveStorageKey(storageKey);

            Files.createDirectories(target.getParent());
            Files.write(target, bytes, StandardOpenOption.CREATE_NEW);

            return new StoredOnboardingFile(
                    originalFilename,
                    storedFilename,
                    storageKey,
                    file.getContentType() == null || file.getContentType().isBlank() ? "application/octet-stream" : file.getContentType(),
                    bytes.length,
                    sha256(bytes)
            );
        } catch (IOException ex) {
            throw new IllegalStateException("Could not store onboarding file", ex);
        }
    }

    public Path resolve(String storageKey) {
        return resolveStorageKey(storageKey);
    }

    public InputStream open(String storageKey) throws IOException {
        if (mediaUploadUrlService.isS3StorageKey(storageKey)) {
            return mediaUploadUrlService.openStoredObject(storageKey);
        }

        return Files.newInputStream(resolveStorageKey(storageKey));
    }

    private Path resolveStorageKey(String storageKey) {
        Path target = storageRoot.resolve(storageKey).normalize();

        if (!target.startsWith(storageRoot)) {
            throw new IllegalArgumentException("Invalid onboarding storage key");
        }

        return target;
    }

    private String safeFilename(String filename) {
        String candidate = filename == null || filename.isBlank() ? "upload.bin" : Path.of(filename).getFileName().toString();
        String sanitized = candidate.replaceAll("[^A-Za-z0-9._-]", "_");
        return sanitized.isBlank() ? "upload.bin" : sanitized;
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(bytes));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 digest is not available", ex);
        }
    }

    public record StoredOnboardingFile(
            String originalFilename,
            String storedFilename,
            String storageKey,
            String contentType,
            long sizeBytes,
            String checksumSha256
    ) {}
}
