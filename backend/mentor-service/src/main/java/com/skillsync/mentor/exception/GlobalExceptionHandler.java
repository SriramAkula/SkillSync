package com.skillsync.mentor.exception;

import com.skillsync.mentor.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.slf4j.LoggerFactory;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    
    @ExceptionHandler(MentorNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleMentorNotFound(MentorNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(404)
                .build());
    }
    
    @ExceptionHandler(MentorAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<?>> handleMentorAlreadyExists(MentorAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(409)
                .build());
    }
    
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<?>> handleUnauthorized(UnauthorizedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(403)
                .build());
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldError().getDefaultMessage();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ApiResponse.builder()
                .success(false)
                .message(message)
                .statusCode(400)
                .build());
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<?>> handleResponseStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getReason())
                .statusCode(ex.getStatusCode().value())
                .build());
    }

    @ExceptionHandler(RedisConnectionFailureException.class)
    public ResponseEntity<ApiResponse<?>> handleRedisConnectionFailure(RedisConnectionFailureException ex) {
        // Redis is down - log and continue. The request should NOT fail because of cache unavailability.
        // This handler is a last-resort safety net; CacheErrorHandler in RedisConfig handles it first.
        log.warn("Redis unavailable - request will proceed without cache: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(ApiResponse.builder()
                .success(false)
                .message("Cache service is temporarily unavailable. Please retry the request.")
                .statusCode(503)
                .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.builder()
                .success(false)
                .message("Internal server error: " + ex.getMessage())
                .statusCode(500)
                .build());
    }
}
