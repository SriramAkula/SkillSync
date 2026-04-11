package com.skillsync.notification.exception;

import com.skillsync.notification.dto.ApiResponse;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(NotificationNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotificationNotFound(NotificationNotFoundException ex) {
        log.warn("Notification not found: {}", ex.getMessage());
        return new ResponseEntity<>(
            ApiResponse.error(ex.getMessage(), 404),
            HttpStatus.NOT_FOUND
        );
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized access: {}", ex.getMessage());
        return new ResponseEntity<>(
            ApiResponse.error(ex.getMessage(), 403),
            HttpStatus.FORBIDDEN
        );
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex) {
        return new ResponseEntity<>(
            ApiResponse.error(ex.getReason(), ex.getStatusCode().value()),
            ex.getStatusCode()
        );
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage());
        return new ResponseEntity<>(
            ApiResponse.error("Internal server error", 500),
            HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
