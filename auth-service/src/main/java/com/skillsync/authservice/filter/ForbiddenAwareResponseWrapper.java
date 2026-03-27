package com.skillsync.authservice.filter;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;

/**
 * Response wrapper to track status codes
 */
public class ForbiddenAwareResponseWrapper extends HttpServletResponseWrapper {
    
    private int status = SC_OK;

    public ForbiddenAwareResponseWrapper(HttpServletResponse response) {
        super(response);
    }

    @Override
    public void setStatus(int status) {
        this.status = status;
        super.setStatus(status);
    }

    @Override
    public void sendError(int status) throws java.io.IOException {
        this.status = status;
        super.sendError(status);
    }

    @Override
    public void sendError(int status, String message) throws java.io.IOException {
        this.status = status;
        super.sendError(status, message);
    }

    @Override
    public int getStatus() {
        return this.status;
    }
}
