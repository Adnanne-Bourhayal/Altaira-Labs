package com.altaira.backend.service;

import com.altaira.backend.dto.media.CreateUploadUrlRequest;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.security.ClientAccessContext;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

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
