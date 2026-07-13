package com.altaira.backend.exception;

public class InvalidLeadStatusException extends IllegalArgumentException {

    public InvalidLeadStatusException(String message) {
        super(message);
    }
}
