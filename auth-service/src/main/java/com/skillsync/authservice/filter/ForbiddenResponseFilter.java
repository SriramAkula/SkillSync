package com.skillsync.authservice.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.dto.response.ApiResponse;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Filter to wrap response and ensure 403 errors return ApiResponse format
 */
@Component
public class ForbiddenResponseFilter implements Filter {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // Wrap the response to capture status codes
        ForbiddenAwareResponseWrapper responseWrapper = new ForbiddenAwareResponseWrapper(httpResponse);
        
        try {
            chain.doFilter(request, responseWrapper);
        } finally {
            // Check if response is 403 and doesn't have JSON content
            if (responseWrapper.getStatus() == HttpServletResponse.SC_FORBIDDEN) {
                // Check if content type is already JSON
                String contentType = httpResponse.getContentType();
                if (contentType == null || !contentType.contains("application/json")) {
                    // Send ApiResponse format for 403
                    httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    httpResponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    httpResponse.setCharacterEncoding("UTF-8");
                    
                    ApiResponse<?> apiResponse = new ApiResponse<>(
                        "Forbidden: You don't have permission to access this resource",
                        null,
                        HttpServletResponse.SC_FORBIDDEN
                    );
                    
                    httpResponse.getWriter().write(objectMapper.writeValueAsString(apiResponse));
                    httpResponse.getWriter().flush();
                    httpResponse.getWriter().close();
                }
            }
        }
    }
}
