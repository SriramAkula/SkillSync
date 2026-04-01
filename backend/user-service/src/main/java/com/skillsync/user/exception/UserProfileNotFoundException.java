package com.skillsync.user.exception;

/**
 * Custom exception for when user profile is not found
 */
public class UserProfileNotFoundException extends RuntimeException {
	public UserProfileNotFoundException(String message) {
		super(message);
	}
}
