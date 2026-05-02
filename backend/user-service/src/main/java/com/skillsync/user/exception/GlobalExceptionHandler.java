package com.skillsync.user.exception;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Global Exception Handler for User Service
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

	@ExceptionHandler(MissingRequestHeaderException.class)
	public ResponseEntity<ErrorResponse> handleMissingHeaderException(MissingRequestHeaderException ex) {
		log.error("Missing required header: {}", ex.getHeaderName());
		ErrorResponse error = new ErrorResponse(
			HttpStatus.BAD_REQUEST.value(),
			"Missing required header: " + ex.getHeaderName(),
			LocalDateTime.now(),
			null,
			"MISSING_HEADER"
		);
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
	}

	@ExceptionHandler(UserProfileNotFoundException.class)
	public ResponseEntity<ErrorResponse> handleUserProfileNotFoundException(
			UserProfileNotFoundException ex) {
		log.error("User profile not found: {}", ex.getMessage());

		ErrorResponse error = new ErrorResponse(
			HttpStatus.NOT_FOUND.value(),
			ex.getMessage(),
			LocalDateTime.now(),
			null,
			"USER_PROFILE_NOT_FOUND"
		);

		return ResponseEntity
			.status(HttpStatus.NOT_FOUND)
			.body(error);
	}

	@ExceptionHandler(UsernameAlreadyExistsException.class)
	public ResponseEntity<ErrorResponse> handleUsernameAlreadyExistsException(UsernameAlreadyExistsException ex) {
		log.error("Username already exists: {}", ex.getMessage());

		ErrorResponse error = new ErrorResponse(
			HttpStatus.CONFLICT.value(),
			ex.getMessage(),
			LocalDateTime.now(),
			null,
			"USERNAME_ALREADY_EXISTS"
		);

		return ResponseEntity
			.status(HttpStatus.CONFLICT)
			.body(error);
	}

	@ExceptionHandler(UnauthorizedException.class)
	public ResponseEntity<ErrorResponse> handleUnauthorizedException(UnauthorizedException ex) {
		log.error("Unauthorized: {}", ex.getMessage());

		ErrorResponse error = new ErrorResponse(
			HttpStatus.FORBIDDEN.value(),
			ex.getMessage(),
			LocalDateTime.now(),
			null,
			"UNAUTHORIZED"
		);

		return ResponseEntity
			.status(HttpStatus.FORBIDDEN)
			.body(error);
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
		log.error("Validation failed: {}", ex.getMessage());
		
		FieldError fieldError = (FieldError) ex.getBindingResult().getAllErrors().get(0);
		String message = fieldError.getDefaultMessage();

		ErrorResponse error = new ErrorResponse(
			HttpStatus.BAD_REQUEST.value(),
			message,
			LocalDateTime.now(),
			null,
			"VALIDATION_FAILED"
		);

		return ResponseEntity
			.status(HttpStatus.BAD_REQUEST)
			.body(error);
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException ex) {
		ErrorResponse error = new ErrorResponse(
			ex.getStatusCode().value(),
			ex.getReason(),
			LocalDateTime.now(),
			null,
			"REQUEST_ERROR"
		);
		return ResponseEntity.status(ex.getStatusCode()).body(error);
	}

	@ExceptionHandler(FileStorageException.class)
	public ResponseEntity<ErrorResponse> handleFileStorageException(FileStorageException ex) {
		log.error("File storage error: {}", ex.getMessage());
		ErrorResponse error = new ErrorResponse(
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			ex.getMessage(),
			LocalDateTime.now(),
			null,
			"FILE_STORAGE_ERROR"
		);
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
		log.error("Internal server error: {}", ex.getMessage(), ex);

		ErrorResponse error = new ErrorResponse(
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"Internal server error",
			LocalDateTime.now(),
			null,
			"INTERNAL_SERVER_ERROR"
		);

		return ResponseEntity
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.body(error);
	}
}

@Data
@NoArgsConstructor
@AllArgsConstructor
class ErrorResponse {
	private int status;
	private String message;
	private LocalDateTime timestamp;
	private String path;
	private String errorCode;
}
