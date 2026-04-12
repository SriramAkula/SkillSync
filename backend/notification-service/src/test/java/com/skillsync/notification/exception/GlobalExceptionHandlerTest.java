package com.skillsync.notification.exception;

import com.skillsync.notification.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void handleNotificationNotFound_shouldReturn404() {
        NotificationNotFoundException ex = new NotificationNotFoundException("Not found");
        ResponseEntity<ApiResponse<Void>> response = handler.handleNotificationNotFound(ex);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).isEqualTo("Not found");
        assertThat(response.getBody().getSuccess()).isFalse();
    }

    @Test
    void handleUnauthorized_shouldReturn403() {
        UnauthorizedException ex = new UnauthorizedException("Forbidden");
        ResponseEntity<ApiResponse<Void>> response = handler.handleUnauthorized(ex);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(response.getBody().getMessage()).isEqualTo("Forbidden");
    }

    @Test
    void handleResponseStatus_shouldReturnCorrectStatus() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bad request");
        ResponseEntity<ApiResponse<Void>> response = handler.handleResponseStatus(ex);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).isEqualTo("Bad request");
    }

    @Test
    void handleGeneralException_shouldReturn500() {
        Exception ex = new Exception("Unexpected");
        ResponseEntity<ApiResponse<Void>> response = handler.handleGeneralException(ex);
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).isEqualTo("Internal server error");
    }
}
