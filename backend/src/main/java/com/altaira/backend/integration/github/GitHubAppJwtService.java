package com.altaira.backend.integration.github;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class GitHubAppJwtService {

    private static final byte[] RSA_ALGORITHM_IDENTIFIER = new byte[] {
            0x30, 0x0d,
            0x06, 0x09,
            0x2a, (byte) 0x86, 0x48, (byte) 0x86, (byte) 0xf7, 0x0d, 0x01, 0x01, 0x01,
            0x05, 0x00
    };

    private final ObjectMapper objectMapper;
    private final Clock clock;

    @Autowired
    public GitHubAppJwtService(ObjectMapper objectMapper) {
        this(objectMapper, Clock.systemUTC());
    }

    GitHubAppJwtService(ObjectMapper objectMapper, Clock clock) {
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    public String createJwt(GitHubAppProperties properties) {
        if (properties.appId().isBlank()) {
            throw GitHubIntegrationException.missingConfiguration("GITHUB_APP_ID is required.");
        }
        if (properties.privateKeyBase64ConfiguredValue().isBlank()) {
            throw GitHubIntegrationException.missingConfiguration("GITHUB_APP_PRIVATE_KEY_BASE64 is required.");
        }

        PrivateKey privateKey = parsePrivateKey(properties.privateKeyBase64ConfiguredValue());
        Instant now = clock.instant();
        long issuedAt = Math.max(0, now.minusSeconds(60).getEpochSecond());
        long expiresAt = now.plusSeconds(540).getEpochSecond();

        Map<String, Object> header = new LinkedHashMap<>();
        header.put("alg", "RS256");
        header.put("typ", "JWT");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("iat", issuedAt);
        payload.put("exp", expiresAt);
        payload.put("iss", properties.appId());

        try {
            String signingInput = base64Url(objectMapper.writeValueAsBytes(header))
                    + "."
                    + base64Url(objectMapper.writeValueAsBytes(payload));
            return signingInput + "." + sign(signingInput, privateKey);
        } catch (JsonProcessingException ex) {
            throw GitHubIntegrationException.safe("GitHub App JWT could not be prepared.");
        }
    }

    private PrivateKey parsePrivateKey(String privateKeyBase64) {
        try {
            byte[] decoded = Base64.getDecoder().decode(privateKeyBase64.replaceAll("\\s+", ""));
            String decodedText = new String(decoded, StandardCharsets.UTF_8);

            if (decodedText.contains("-----BEGIN")) {
                return parsePem(decodedText);
            }

            return parsePkcs8OrPkcs1(decoded);
        } catch (IllegalArgumentException ex) {
            throw GitHubIntegrationException.safe("GitHub App private key could not be decoded. Check GITHUB_APP_PRIVATE_KEY_BASE64.");
        }
    }

    private PrivateKey parsePem(String pem) {
        String type = pem.contains("BEGIN RSA PRIVATE KEY") ? "RSA PRIVATE KEY" : "PRIVATE KEY";
        String normalized = pem
                .replace("-----BEGIN " + type + "-----", "")
                .replace("-----END " + type + "-----", "")
                .replaceAll("\\s+", "");
        byte[] der = Base64.getDecoder().decode(normalized);
        if ("RSA PRIVATE KEY".equals(type)) {
            der = wrapPkcs1PrivateKey(der);
        }
        return generatePrivateKey(der);
    }

    private PrivateKey parsePkcs8OrPkcs1(byte[] der) {
        try {
            return generatePrivateKey(der);
        } catch (GitHubIntegrationException ex) {
            return generatePrivateKey(wrapPkcs1PrivateKey(der));
        }
    }

    private PrivateKey generatePrivateKey(byte[] pkcs8Der) {
        try {
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(pkcs8Der));
        } catch (GeneralSecurityException | IllegalArgumentException ex) {
            throw GitHubIntegrationException.safe("GitHub App private key could not be loaded. Check key format.");
        }
    }

    private String sign(String signingInput, PrivateKey privateKey) {
        try {
            Signature signature = Signature.getInstance("SHA256withRSA");
            signature.initSign(privateKey);
            signature.update(signingInput.getBytes(StandardCharsets.UTF_8));
            return base64Url(signature.sign());
        } catch (GeneralSecurityException ex) {
            throw GitHubIntegrationException.safe("GitHub App JWT could not be signed.");
        }
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private byte[] wrapPkcs1PrivateKey(byte[] pkcs1Der) {
        byte[] version = new byte[] {0x02, 0x01, 0x00};
        byte[] privateKeyOctetString = concat(new byte[] {0x04}, encodeLength(pkcs1Der.length), pkcs1Der);
        byte[] body = concat(version, RSA_ALGORITHM_IDENTIFIER, privateKeyOctetString);
        return concat(new byte[] {0x30}, encodeLength(body.length), body);
    }

    private byte[] encodeLength(int length) {
        if (length < 128) {
            return new byte[] {(byte) length};
        }

        int value = length;
        int bytesNeeded = 0;
        while (value > 0) {
            bytesNeeded++;
            value >>= 8;
        }

        byte[] encoded = new byte[bytesNeeded + 1];
        encoded[0] = (byte) (0x80 | bytesNeeded);
        for (int i = bytesNeeded; i > 0; i--) {
            encoded[i] = (byte) (length & 0xff);
            length >>= 8;
        }
        return encoded;
    }

    private byte[] concat(byte[]... arrays) {
        int total = 0;
        for (byte[] array : arrays) {
            total += array.length;
        }
        byte[] result = new byte[total];
        int offset = 0;
        for (byte[] array : arrays) {
            System.arraycopy(array, 0, result, offset, array.length);
            offset += array.length;
        }
        return result;
    }
}
