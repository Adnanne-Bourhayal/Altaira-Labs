package com.altaira.backend.security;

import com.altaira.backend.entity.AppUserEntity;
import com.altaira.backend.entity.ClientEntity;

public record ClientAccessContext(AppUserEntity user, ClientEntity client, String accessRole) {
}
