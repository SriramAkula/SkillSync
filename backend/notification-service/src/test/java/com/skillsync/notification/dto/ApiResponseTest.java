package com.skillsync.notification.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ApiResponseTest {

    @Test
    void testApiResponseBuilder() {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .success(true)
                .message("success")
                .data("data")
                .statusCode(200)
                .build();

        assertTrue(response.getSuccess());
        assertEquals("success", response.getMessage());
        assertEquals("data", response.getData());
        assertEquals(200, response.getStatusCode());
    }

    @Test
    void testApiResponseNoArgs() {
        ApiResponse<String> response = new ApiResponse<>();
        assertNotNull(response);
    }
    
    @Test
    void testApiResponseAllArgs() {
        ApiResponse<String> response = new ApiResponse<>(true, "data", "msg", 200);
        assertTrue(response.getSuccess());
        assertEquals("msg", response.getMessage());
        assertEquals("data", response.getData());
        assertEquals(200, response.getStatusCode());
    }

    @Test
    void testStaticMethods() {
        ApiResponse<String> ok = ApiResponse.ok("data", "msg");
        assertTrue(ok.getSuccess());
        assertEquals(200, ok.getStatusCode());

        ApiResponse<Object> err = ApiResponse.error("fail", 400);
        assertFalse(err.getSuccess());
        assertEquals(400, err.getStatusCode());
    }

    @Test
    void testSetters() {
        ApiResponse<String> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage("fail");
        response.setData(null);
        response.setStatusCode(500);
        assertFalse(response.getSuccess());
        assertEquals("fail", response.getMessage());
        assertNull(response.getData());
        assertEquals(500, response.getStatusCode());
    }
}
