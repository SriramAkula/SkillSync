package com.skillsync.notification.dto;

public class ApiResponse<T> {
    private Boolean success;
    private T data;
    private String message;
    private Integer statusCode;
    
    public ApiResponse() {}
    
    public ApiResponse(Boolean success, T data, String message, Integer statusCode) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;
    }

    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message, 200);
    }
    
    public static <T> ApiResponse<T> error(String message, Integer statusCode) {
        return new ApiResponse<>(false, null, message, statusCode);
    }

    public static <T> ApiResponseBuilder<T> builder() {
        return new ApiResponseBuilder<>();
    }

    public static class ApiResponseBuilder<T> {
        private Boolean success;
        private T data;
        private String message;
        private Integer statusCode;

        public ApiResponseBuilder<T> success(Boolean success) {
            this.success = success;
            return this;
        }

        public ApiResponseBuilder<T> data(T data) {
            this.data = data;
            return this;
        }

        public ApiResponseBuilder<T> message(String message) {
            this.message = message;
            return this;
        }

        public ApiResponseBuilder<T> statusCode(Integer statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        public ApiResponse<T> build() {
            return new ApiResponse<>(success, data, message, statusCode);
        }
    }

    // Getters and setters
    public Boolean getSuccess() { return success; }
    public void setSuccess(Boolean success) { this.success = success; }
    
    public T getData() { return data; }
    public void setData(T data) { this.data = data; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Integer getStatusCode() { return statusCode; }
    public void setStatusCode(Integer statusCode) { this.statusCode = statusCode; }
}
