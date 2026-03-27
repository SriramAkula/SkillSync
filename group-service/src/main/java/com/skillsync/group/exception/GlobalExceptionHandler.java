package com.skillsync.group.exception;

import com.skillsync.group.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(GroupNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleGroupNotFound(GroupNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(404)
                .build());
    }
    
    @ExceptionHandler(GroupFullException.class)
    public ResponseEntity<ApiResponse<?>> handleGroupFull(GroupFullException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(409)
                .build());
    }
    
    @ExceptionHandler(AlreadyMemberException.class)
    public ResponseEntity<ApiResponse<?>> handleAlreadyMember(AlreadyMemberException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ApiResponse.builder()
                .success(false)
                .message(ex.getMessage())
                .statusCode(409)
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
