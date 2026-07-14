package com.altaira.backend.dto.diagnostics;

public record EmailDiagnosticsResponse(
        boolean enabled,
        String provider,
        String notificationTo,
        String notificationFrom,
        long timeoutMs,
        String resendApiUrl,
        boolean resendApiKeyConfigured,
        String smtpHost,
        int smtpPort,
        String smtpUsername,
        boolean smtpAuthEnabled,
        boolean smtpStartTlsEnabled,
        boolean smtpStartTlsRequired
) {
}
