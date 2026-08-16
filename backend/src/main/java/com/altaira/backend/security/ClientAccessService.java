package com.altaira.backend.security;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.exception.ResourceNotFoundException;
import com.altaira.backend.model.UserRole;
import com.altaira.backend.repository.ClientRepository;
import com.altaira.backend.repository.ClientUserAccessRepository;
import com.altaira.backend.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ClientAccessService {

    private final AuthService authService;
    private final ClientUserAccessRepository clientUserAccessRepository;
    private final ClientRepository clientRepository;

    public ClientAccessService(
            AuthService authService,
            ClientUserAccessRepository clientUserAccessRepository,
            ClientRepository clientRepository
    ) {
        this.authService = authService;
        this.clientUserAccessRepository = clientUserAccessRepository;
        this.clientRepository = clientRepository;
    }

    public ClientAccessContext requireClientAccess(String clientSessionToken) {
        AppUserEntity user = authService.getCurrentUserEntity(clientSessionToken);
        UserRole role = UserRole.parse(user.getRole());

        if (!role.isClientRole()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Client role required");
        }

        var accessList = clientUserAccessRepository.findAllByUserAndActiveTrue(user);

        if (accessList.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No client workspace access");
        }

        if (accessList.size() > 1) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Multiple active client workspaces require explicit workspace selection"
            );
        }

        var access = accessList.get(0);
        return new ClientAccessContext(user, access.getClient(), access.getRole());
    }

    public ClientAccessContext requireClientAccess(String clientSessionToken, UUID clientId) {
        AppUserEntity user = authService.getCurrentUserEntity(clientSessionToken);
        UserRole role = UserRole.parse(user.getRole());

        if (!role.isClientRole()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Client role required");
        }

        var client = clientRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client", clientId));

        var access = clientUserAccessRepository.findByUserAndClientAndActiveTrue(user, client)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "No access to this client workspace"));

        return new ClientAccessContext(user, client, access.getRole());
    }

    public void requireClientWriteAccess(ClientAccessContext context) {
        UserRole userRole = UserRole.parse(context.user().getRole());
        String accessRole = context.accessRole() == null ? "" : context.accessRole().trim().toLowerCase();

        if (userRole != UserRole.CLIENT_USER || !"client_user".equals(accessRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Client workspace is read-only for this account");
        }
    }
}
