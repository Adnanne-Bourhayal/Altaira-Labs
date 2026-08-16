package com.altaira.backend.integration.github;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.KeyPairGenerator;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GitHubAppJwtServiceTests {

    @Test
    void createsJwtFromBase64EncodedPemWithoutExposingPrivateKey() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var keyPair = generator.generateKeyPair();
        String pem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8)).encodeToString(keyPair.getPrivate().getEncoded())
                + "\n-----END PRIVATE KEY-----\n";
        String privateKeyBase64 = Base64.getEncoder().encodeToString(pem.getBytes(StandardCharsets.UTF_8));
        var properties = new GitHubAppProperties(
                true,
                false,
                true,
                "Altaira-Labs",
                "https://api.github.com",
                "4339634",
                "Iv23liG1o7dXGqZDEdd8",
                "147629095",
                privateKeyBase64,
                ""
        );
        var service = new GitHubAppJwtService(
                new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-07-19T10:15:30Z"), ZoneOffset.UTC)
        );

        String jwt = service.createJwt(properties);

        assertEquals(3, jwt.split("\\.").length);
    }

    @Test
    void invalidPrivateKeyBase64ReturnsSafeError() {
        var properties = new GitHubAppProperties(
                true,
                false,
                true,
                "Altaira-Labs",
                "https://api.github.com",
                "4339634",
                "Iv23liG1o7dXGqZDEdd8",
                "147629095",
                "not-base64-secret",
                ""
        );
        var service = new GitHubAppJwtService(new ObjectMapper());

        GitHubIntegrationException ex = assertThrows(GitHubIntegrationException.class, () -> service.createJwt(properties));

        assertEquals("GitHub App private key could not be decoded. Check GITHUB_APP_PRIVATE_KEY_BASE64.", ex.safeMessage());
    }
}
