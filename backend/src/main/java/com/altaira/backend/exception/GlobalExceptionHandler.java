package com.altaira.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Validation failed");
        response.put("fields", fieldErrors);

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeError(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());

        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal server error");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(LeadNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleLeadNotFound(LeadNotFoundException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("error", "Lead not found");

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", ex.getMessage());

        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", ex.getStatusCode().value());
        response.put("error", ex.getReason());

        return ResponseEntity.status(ex.getStatusCode()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericError(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", Instant.now().toString());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal server error");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
