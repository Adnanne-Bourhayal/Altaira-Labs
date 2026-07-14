package com.altaira.backend.model;

public enum SecurityEventType {
    LOGIN_SUCCESS("login_success"),
    LOGIN_FAILED("login_failed"),
    USER_CREATED("user_created"),
    PASSWORD_CHANGED("password_changed"),
    USER_DISABLED("user_disabled"),
    LOGOUT("logout");

    private final String value;

    SecurityEventType(String value) {
        this.value = value;
    }

    public String value() {
        return value;
    }
}
