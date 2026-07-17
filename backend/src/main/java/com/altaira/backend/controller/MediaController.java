package com.altaira.backend.controller;

import com.altaira.backend.dto.media.CreateUploadUrlRequest;
import com.altaira.backend.dto.media.UploadUrlResponse;
import com.altaira.backend.security.ClientAccessService;
import com.altaira.backend.service.MediaUploadUrlService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/media")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://altairalabs.vercel.app"
})
public class MediaController {

    private final ClientAccessService clientAccessService;
    private final MediaUploadUrlService mediaUploadUrlService;

    public MediaController(
            ClientAccessService clientAccessService,
            MediaUploadUrlService mediaUploadUrlService
    ) {
        this.clientAccessService = clientAccessService;
        this.mediaUploadUrlService = mediaUploadUrlService;
    }

    @PostMapping("/upload-url")
    public UploadUrlResponse createUploadUrl(
            @Valid @RequestBody CreateUploadUrlRequest request,
            @RequestHeader(name = "X-Client-Session-Token", required = false) String clientSessionToken
    ) {
        var context = clientAccessService.requireClientAccess(clientSessionToken);
        clientAccessService.requireClientWriteAccess(context);
        return mediaUploadUrlService.createClientUploadUrl(context, request);
    }
}
