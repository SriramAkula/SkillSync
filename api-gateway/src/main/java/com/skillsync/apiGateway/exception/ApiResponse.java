package com.skillsync.apiGateway.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard API Response Wrapper for API Gateway errors
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private String message;
    private T data;
    private Integer statusCode;

    public ApiResponse(String message, Integer statusCode) {
        this.message = message;
        this.statusCode = statusCode;
    }
}
