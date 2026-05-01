package com.example.vaultaire.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<?> handleRuntime(RuntimeException ex) {

        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("message", ex.getMessage());

        if (ex.getMessage().contains("Invalid token")) {
            return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
        }

        if (ex.getMessage().contains("Token expired")) {
            return new ResponseEntity<>(response, HttpStatus.GONE);
        }

        if (ex.getMessage().contains("Download limit")) {
            return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
        }

        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}