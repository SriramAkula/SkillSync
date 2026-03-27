package com.skillsync.payment.dto.response;

public class ApiResponse<T> {
    private boolean success;
    private T data;
    private String message;
    private int statusCode;

    public ApiResponse(boolean success, T data, String message, int statusCode) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }

    public boolean isSuccess() { return success; }
    public T getData() { return data; }
    public String getMessage() { return message; }
    public int getStatusCode() { return statusCode; }
}
