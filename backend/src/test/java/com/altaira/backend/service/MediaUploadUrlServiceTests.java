package com.altaira.backend.service;

import com.altaira.backend.dto.media.CreateUploadUrlRequest;
import com.altaira.backend.dto.media.PreparePrivateUploadRequest;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.security.ClientAccessContext;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.net.URI;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.ArgumentCaptor;

class MediaUploadUrlServiceTests {

    @Test
    void reportsNotConfiguredWhenS3IsDisabled() {
        MediaUploadUrlService service = new MediaUploadUrlService(
                false,
                "",
                "",
                "",
                "",
                900
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.createClientUploadUrl(clientContext(), request("branding", "logo.png"))
        );

        assertEquals(HttpStatus.NOT_IMPLEMENTED, ex.getStatusCode());
        assertEquals("S3 presigned uploads are not configured", ex.getReason());
    }

    @Test
    void rejectsUnexpectedFoldersBeforeAttemptingS3() {
        MediaUploadUrlService service = new MediaUploadUrlService(
                false,
                "",
                "",
                "",
                "",
                900
        );

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.createClientUploadUrl(clientContext(), request("avatars", "logo.png"))
        );

        assertEquals("folder must be one of: branding, legal, multimedia", ex.getMessage());
    }

    @Test
    void preparesAndVerifiesAClientScopedPrivateUpload() throws Exception {
        S3Client s3Client = mock(S3Client.class);
        S3Presigner presigner = mock(S3Presigner.class);
        PresignedPutObjectRequest presignedRequest = mock(PresignedPutObjectRequest.class);
        when(presignedRequest.url()).thenReturn(URI.create("https://uploads.example.test/signed").toURL());
        when(presigner.presignPutObject(any(PutObjectPresignRequest.class))).thenReturn(presignedRequest);

        MediaUploadUrlService service = enabledService(s3Client, presigner);
        UUID clientId = UUID.fromString("b539b1ff-996d-4ed7-a26c-8086f6456691");
        UUID taskId = UUID.fromString("1dcc8022-3951-46df-96c4-f3df59c70dd2");
        PreparePrivateUploadRequest request = privateUploadRequest("identity-manual.pdf", "application/pdf", 128L);

        var prepared = service.createContextUploadUrl(
                clientId,
                "legal",
                "web_seo",
                "onboarding",
                taskId,
                request
        );

        ArgumentCaptor<PutObjectPresignRequest> presignCaptor = ArgumentCaptor.forClass(PutObjectPresignRequest.class);
        verify(presigner).presignPutObject(presignCaptor.capture());
        var signedPut = presignCaptor.getValue().putObjectRequest();
        assertEquals("private-files", signedPut.bucket());
        assertTrue(signedPut.key().startsWith("legal/" + clientId + "/web_seo/onboarding/" + taskId + "/"));
        assertEquals(clientId.toString(), signedPut.metadata().get("altaira-client-id"));
        assertEquals("128", signedPut.metadata().get("altaira-expected-size"));

        when(s3Client.headObject(any(software.amazon.awssdk.services.s3.model.HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder()
                        .metadata(signedPut.metadata())
                        .contentLength(128L)
                        .contentType("application/pdf")
                        .build());

        var verified = service.verifyCompletedUpload(
                clientId,
                "legal",
                "web_seo",
                "onboarding",
                taskId,
                prepared.getBucket(),
                prepared.getObjectKey(),
                request.getFilename(),
                request.getContentType(),
                request.getSizeBytes()
        );

        assertEquals("s3://private-files/" + prepared.getObjectKey(), verified.storageKey());
        assertEquals(128L, verified.sizeBytes());
    }

    @Test
    void rejectsAnObjectKeyOutsideTheExpectedClientContext() {
        S3Client s3Client = mock(S3Client.class);
        S3Presigner presigner = mock(S3Presigner.class);
        MediaUploadUrlService service = enabledService(s3Client, presigner);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.verifyCompletedUpload(
                        UUID.fromString("b539b1ff-996d-4ed7-a26c-8086f6456691"),
                        "legal",
                        "web_seo",
                        "onboarding",
                        UUID.fromString("1dcc8022-3951-46df-96c4-f3df59c70dd2"),
                        "private-files",
                        "legal/another-client/web_seo/onboarding/another-task/id-contract.pdf",
                        "contract.pdf",
                        "application/pdf",
                        128L
                )
        );

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    void rejectsExecutableUploadsBeforePresigning() {
        MediaUploadUrlService service = new MediaUploadUrlService(false, "", "", "", "", 900);

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> service.createClientUploadUrl(clientContext(), request("branding", "installer.exe"))
        );

        assertEquals(HttpStatus.UNSUPPORTED_MEDIA_TYPE, ex.getStatusCode());
    }

    private MediaUploadUrlService enabledService(S3Client s3Client, S3Presigner presigner) {
        return new MediaUploadUrlService(
                true,
                "eu-west-1",
                "private-files",
                "",
                "",
                900,
                15_728_640L,
                s3Client,
                presigner
        );
    }

    private PreparePrivateUploadRequest privateUploadRequest(String filename, String contentType, long sizeBytes) {
        PreparePrivateUploadRequest request = new PreparePrivateUploadRequest();
        request.setFilename(filename);
        request.setContentType(contentType);
        request.setSizeBytes(sizeBytes);
        request.setAssetType("legal");
        return request;
    }

    private ClientAccessContext clientContext() {
        ClientEntity client = new ClientEntity();
        client.setId(UUID.fromString("b539b1ff-996d-4ed7-a26c-8086f6456691"));
        client.setName("Clinic Owner");
        client.setCompany("Clinic Co");
        client.setEmail("clinic@example.com");
        return new ClientAccessContext(null, client, "owner");
    }

    private CreateUploadUrlRequest request(String folder, String filename) {
        CreateUploadUrlRequest request = new CreateUploadUrlRequest();
        request.setFolder(folder);
        request.setFilename(filename);
        request.setServiceKey("web_seo");
        request.setContentType("image/png");
        return request;
    }
}
