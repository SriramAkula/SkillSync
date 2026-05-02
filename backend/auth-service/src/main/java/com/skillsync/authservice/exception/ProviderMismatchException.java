package com.skillsync.authservice.exception;

public class ProviderMismatchException extends RuntimeException {
    public ProviderMismatchException(String message) {
        super(message);
    }
}
