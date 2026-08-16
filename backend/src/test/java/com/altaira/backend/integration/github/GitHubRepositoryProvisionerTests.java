package com.altaira.backend.integration.github;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GitHubRepositoryProvisionerTests {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpServer server;

    @AfterEach
    void stopServer() {
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void dryRunGateBlocksBeforeAnyNetworkCall() {
        GitHubAppProperties properties = properties("http://127.0.0.1:1", true);
        GitHubApiClient apiClient = new GitHubApiClient(
                objectMapper,
                HttpClient.newBuilder().connectTimeout(Duration.ofMillis(100)).build()
        );
        GitHubRepositoryProvisioner provisioner = new GitHubRepositoryProvisioner(
                properties,
                apiClient,
                () -> "unused-token",
                objectMapper
        );

        GitHubIntegrationException exception = assertThrows(
                GitHubIntegrationException.class,
                () -> provisioner.ensurePrivateRepository("demo-repository", "Demo")
        );

        assertTrue(exception.safeMessage().contains("blocked"));
    }

    @Test
    void createsMissingRepositoryAsPrivateWithoutInitialContent() throws Exception {
        AtomicInteger createRequests = new AtomicInteger();
        startServer(exchange -> {
            if ("GET".equals(exchange.getRequestMethod())) {
                respond(exchange, 404, "{\"message\":\"Not Found\"}");
                return;
            }

            createRequests.incrementAndGet();
            var request = objectMapper.readTree(exchange.getRequestBody());
            assertEquals("demo-repository", request.path("name").asText());
            assertTrue(request.path("private").asBoolean());
            assertFalse(request.path("auto_init").asBoolean(true));
            respond(exchange, 201, repositoryJson(true));
        });

        GitHubRepositoryProvisioningResult result = liveProvisioner().ensurePrivateRepository(
                "demo-repository",
                "Controlled provider test"
        );

        assertTrue(result.created());
        assertFalse(result.reused());
        assertEquals("Altaira-Labs/demo-repository", result.fullName());
        assertEquals("private", result.visibility());
        assertEquals(1, createRequests.get());
    }

    @Test
    void reusesExistingPrivateRepositoryWithoutCreatingDuplicate() throws Exception {
        AtomicInteger createRequests = new AtomicInteger();
        startServer(exchange -> {
            if ("POST".equals(exchange.getRequestMethod())) {
                createRequests.incrementAndGet();
            }
            respond(exchange, 200, repositoryJson(true));
        });

        GitHubRepositoryProvisioningResult result = liveProvisioner().ensurePrivateRepository(
                "demo-repository",
                "Controlled provider test"
        );

        assertFalse(result.created());
        assertTrue(result.reused());
        assertEquals(0, createRequests.get());
    }

    @Test
    void refusesToReusePublicRepository() throws Exception {
        startServer(exchange -> respond(exchange, 200, repositoryJson(false)));

        GitHubIntegrationException exception = assertThrows(
                GitHubIntegrationException.class,
                () -> liveProvisioner().ensurePrivateRepository("demo-repository", "Controlled provider test")
        );

        assertTrue(exception.safeMessage().contains("private repository target"));
    }

    @Test
    void reusesRepositoryCreatedByConcurrentRequest() throws Exception {
        AtomicInteger getRequests = new AtomicInteger();
        AtomicInteger createRequests = new AtomicInteger();
        startServer(exchange -> {
            if ("GET".equals(exchange.getRequestMethod())) {
                if (getRequests.incrementAndGet() == 1) {
                    respond(exchange, 404, "{\"message\":\"Not Found\"}");
                } else {
                    respond(exchange, 200, repositoryJson(true));
                }
                return;
            }

            createRequests.incrementAndGet();
            respond(exchange, 422, "{\"message\":\"name already exists on this account\"}");
        });

        GitHubRepositoryProvisioningResult result = liveProvisioner().ensurePrivateRepository(
                "demo-repository",
                "Controlled provider test"
        );

        assertFalse(result.created());
        assertTrue(result.reused());
        assertEquals(2, getRequests.get());
        assertEquals(1, createRequests.get());
    }

    private GitHubRepositoryProvisioner liveProvisioner() {
        String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
        GitHubApiClient apiClient = new GitHubApiClient(objectMapper, HttpClient.newHttpClient());
        return new GitHubRepositoryProvisioner(
                properties(baseUrl, false),
                apiClient,
                () -> "local-test-installation-token",
                objectMapper
        );
    }

    private GitHubAppProperties properties(String baseUrl, boolean dryRun) {
        return new GitHubAppProperties(
                true,
                true,
                dryRun,
                "Altaira-Labs",
                baseUrl,
                "test-app-id",
                "test-client-id",
                "test-installation-id",
                "test-private-key",
                ""
        );
    }

    private void startServer(ExchangeHandler handler) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            try {
                handler.handle(exchange);
            } catch (Throwable throwable) {
                respond(exchange, 500, "{\"message\":\"test handler failed\"}");
            }
        });
        server.start();
    }

    private void respond(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }

    private String repositoryJson(boolean privateRepository) {
        return """
                {
                  "id": 123456,
                  "name": "demo-repository",
                  "full_name": "Altaira-Labs/demo-repository",
                  "private": %s,
                  "html_url": "https://github.com/Altaira-Labs/demo-repository",
                  "owner": {"login": "Altaira-Labs"}
                }
                """.formatted(privateRepository);
    }

    @FunctionalInterface
    private interface ExchangeHandler {
        void handle(HttpExchange exchange) throws Exception;
    }
}
