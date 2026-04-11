package com.skillsync.authservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import feign.Response;
import feign.codec.ErrorDecoder;
import org.junit.jupiter.api.Test;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class FeignConfigTest {

    private final FeignConfig feignConfig = new FeignConfig();

    @Test
    void requestInterceptor_shouldAddGatewayHeader() {
        RequestInterceptor interceptor = feignConfig.requestInterceptor();
        RequestTemplate template = new RequestTemplate();

        interceptor.apply(template);

        Map<String, Collection<String>> headers = template.headers();
        assertThat(headers).containsKey("X-Gateway-Request");
        assertThat(headers.get("X-Gateway-Request")).contains("true");
    }

    @Test
    void errorDecoder_shouldHandleServerError() {
        ErrorDecoder decoder = feignConfig.errorDecoder();
        Response response = Response.builder()
                .status(500)
                .reason("Internal Server Error")
                .request(mock(feign.Request.class))
                .headers(new HashMap<>())
                .build();

        Exception exception = decoder.decode("method", response);

        assertThat(exception).isInstanceOf(RuntimeException.class);
        assertThat(exception.getMessage()).contains("Service temporarily unavailable");
    }

    @Test
    void errorDecoder_shouldHandleClientError() {
        ErrorDecoder decoder = feignConfig.errorDecoder();
        Response response = Response.builder()
                .status(400)
                .reason("Bad Request")
                .request(mock(feign.Request.class))
                .headers(new HashMap<>())
                .build();

        Exception exception = decoder.decode("method", response);

        assertThat(exception).isInstanceOf(RuntimeException.class);
        assertThat(exception.getMessage()).contains("Feign error: 400");
    }
}

