package com.skillsync.authservice.dto.response;

/**
 * Generic API Response Wrapper
 * Used for consistent error responses across the service
 */
public class ApiResponse<T> {

    private String message;
    private T data;
    private Integer statusCode;

    public ApiResponse() {}

    public ApiResponse(String message) {
        this.message = message;
    }

    public ApiResponse(String message, Integer statusCode) {
        this.message = message;
        this.statusCode = statusCode;
    }

    public ApiResponse(String message, T data, Integer statusCode) {
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public T getData() { return data; }
    public void setData(T data) { this.data = data; }

    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
}
