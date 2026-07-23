package com.altaira.backend.config;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class LocalRuntimeIsolationTests {

    @Test
    void defaultConfigDoesNotImportProductionSecretsImplicitly() throws IOException {
        Properties properties = loadProperties("application.properties");
        String configImport = properties.getProperty("spring.config.import");

        assertEquals(
                "optional:file:${ALTAIRA_SECRETS_FILE:./.env}[.properties]",
                configImport
        );
        assertFalse(configImport.contains("/Volumes/"));
        assertFalse(configImport.contains(".secrets/neon-render.env"));
    }

    @Test
    void testProfileUsesOnlyAnInMemoryH2Datasource() throws IOException {
        Properties properties = loadProperties("application-test.properties");
        String datasourceUrl = properties.getProperty("spring.datasource.url");

        assertNotNull(datasourceUrl);
        assertTrue(datasourceUrl.startsWith("jdbc:h2:mem:"));
        assertFalse(datasourceUrl.contains("postgresql"));
        assertEquals("org.h2.Driver", properties.getProperty("spring.datasource.driver-class-name"));
        assertEquals("create-drop", properties.getProperty("spring.jpa.hibernate.ddl-auto"));
    }

    private Properties loadProperties(String resourceName) throws IOException {
        try (InputStream input = getClass().getClassLoader().getResourceAsStream(resourceName)) {
            assertNotNull(input, "Missing test resource: " + resourceName);
            Properties properties = new Properties();
            properties.load(input);
            return properties;
        }
    }
}
