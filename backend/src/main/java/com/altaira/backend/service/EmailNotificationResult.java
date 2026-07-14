package com.altaira.backend.service;

public record EmailNotificationResult(boolean sent, String message) {
    public static EmailNotificationResult success() {
        return new EmailNotificationResult(true, "Email notification sent.");
    }

    public static EmailNotificationResult notSent(String message) {
        return new EmailNotificationResult(false, message);
    }
}
