package com.skillsync.mentor.exception;

public class MentorAlreadyExistsException extends RuntimeException {
    public MentorAlreadyExistsException(String message) {
        super(message);
    }
}
