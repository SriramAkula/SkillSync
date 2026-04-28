package com.skillsync.messaging.exception;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("Handle MessageNotFoundException")
    void handleMessageNotFound() {
        MessageNotFoundException ex = new MessageNotFoundException(1L);
        ResponseEntity<ErrorResponse> response = handler.handleMessageNotFound(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody().getMessage()).contains("Message not found");
    }

    @Test
    @DisplayName("Handle InvalidMessageException")
    void handleInvalidMessage() {
        InvalidMessageException ex = new InvalidMessageException("Invalid");
        ResponseEntity<ErrorResponse> response = handler.handleInvalidMessage(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).contains("Invalid");
    }

    @Test
    @DisplayName("Handle UserServiceUnavailableException")
    void handleUserServiceUnavailable() {
        UserServiceUnavailableException ex = new UserServiceUnavailableException("Down");
        ResponseEntity<ErrorResponse> response = handler.handleUserServiceUnavailable(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody().getMessage()).contains("Down");
    }

    @Test
    @DisplayName("Handle Validation Errors")
    void handleValidationErrors() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field", "error message");
        
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(List.of(fieldError));

        ResponseEntity<ErrorResponse> response = handler.handleValidationErrors(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().getMessage()).contains("field: error message");
    }

    @Test
    @DisplayName("Handle Generic Exception")
    void handleGenericException() {
        Exception ex = new Exception("Internal error");
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody().getMessage()).contains("Internal error");
    }
}
