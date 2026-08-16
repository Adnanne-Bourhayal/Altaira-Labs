package com.altaira.backend.service;

import com.altaira.backend.dto.auth.GoogleClientLoginRequest;
import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientUserAccessEntity;
import com.altaira.backend.repository.AppUserRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientGoogleAuthServiceTests {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ClientUserAccessRepository clientUserAccessRepository;

    @Mock
    private AuthService authService;

    @Mock
    private SecurityEventService securityEventService;

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> googleResponse;

    @Test
    void googleLoginRejectsAmbiguousMultipleWorkspaceAccess() throws Exception {
        AppUserEntity user = new AppUserEntity();
        user.setUsername("client@example.com");
        user.setRole("client_user");
        user.setActive(true);

        when(httpClient.send(
                any(HttpRequest.class),
                org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()
        )).thenReturn(googleResponse);
        when(googleResponse.statusCode()).thenReturn(200);
        when(googleResponse.body()).thenReturn("""
                {
                  "aud": "google-client-id",
                  "email_verified": "true",
                  "email": "client@example.com"
                }
                """);
        when(appUserRepository.findByUsernameIgnoreCase("client@example.com")).thenReturn(Optional.of(user));
        when(clientUserAccessRepository.findAllByUserAndActiveTrue(user))
                .thenReturn(List.of(new ClientUserAccessEntity(), new ClientUserAccessEntity()));

        GoogleClientLoginRequest request = new GoogleClientLoginRequest();
        request.setCredential("google-credential");

        ClientGoogleAuthService service = new ClientGoogleAuthService(
                appUserRepository,
                clientUserAccessRepository,
                authService,
                securityEventService,
                new ObjectMapper(),
                "google-client-id",
                "https://oauth2.googleapis.com/tokeninfo",
                httpClient
        );

        assertThatThrownBy(() -> service.login(request, "127.0.0.1", "test-agent"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT")
                .hasMessageContaining("explicit workspace selection");

        verify(authService, never()).createSessionForUser(any(), any(), any(), any());
    }
}
