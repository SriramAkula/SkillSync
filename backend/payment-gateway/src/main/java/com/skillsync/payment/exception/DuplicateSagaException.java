package com.skillsync.payment.exception;

public class DuplicateSagaException extends RuntimeException {
    public DuplicateSagaException(String message) { super(message); }
}
