package com.altaira.backend.security;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientEntity;
import com.altaira.backend.entity.ClientUserAccessEntity;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import com.altaira.backend.service.AuthService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ClientAccessServiceTests {

    @Mock
    private AuthService authService;

    @Mock
    private ClientUserAccessRepository clientUserAccessRepository;

    @Mock
    private ClientRepository clientRepository;

    @Test
    void clientUserAccessCanWrite() {
        ClientAccessService service = service();
        ClientAccessContext context = context("client_user", "client_user");

        assertThatCode(() -> service.requireClientWriteAccess(context)).doesNotThrowAnyException();
    }

    @Test
    void viewerAccessIsReadOnly() {
        ClientAccessService service = service();
        ClientAccessContext context = context("viewer", "viewer");

        assertThatThrownBy(() -> service.requireClientWriteAccess(context))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("403 FORBIDDEN");
    }

    @Test
    void ambiguousMultipleWorkspaceSessionIsRejected() {
        AppUserEntity user = new AppUserEntity();
        user.setRole("client_user");

        when(authService.getCurrentUserEntity("session-token")).thenReturn(user);
        when(clientUserAccessRepository.findAllByUserAndActiveTrue(user))
                .thenReturn(List.of(new ClientUserAccessEntity(), new ClientUserAccessEntity()));

        assertThatThrownBy(() -> service().requireClientAccess("session-token"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("409 CONFLICT")
                .hasMessageContaining("explicit workspace selection");
    }

    private ClientAccessService service() {
        return new ClientAccessService(authService, clientUserAccessRepository, clientRepository);
    }

    private ClientAccessContext context(String userRole, String accessRole) {
        AppUserEntity user = new AppUserEntity();
        user.setRole(userRole);
        ClientEntity client = new ClientEntity();
        return new ClientAccessContext(user, client, accessRole);
    }
}
