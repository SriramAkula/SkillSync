package com.skillsync.group.exception;

public class AlreadyMemberException extends RuntimeException {
    public AlreadyMemberException(String message) {
        super(message);
    }
}
