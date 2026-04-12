package com.skillsync.notification.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;

class RedisConfigTest {

    private RedisConfig redisConfig;
    private CacheErrorHandler errorHandler;
    private Cache cache;
    private RuntimeException exception;

    @BeforeEach
    void setUp() {
        redisConfig = new RedisConfig();
        ReflectionTestUtils.setField(redisConfig, "redisHost", "localhost");
        ReflectionTestUtils.setField(redisConfig, "redisPort", 6379);
        
        errorHandler = redisConfig.errorHandler();
        cache = mock(Cache.class);
        exception = new RuntimeException("Redis connection failure");
    }

    @Test
    void handleCacheGetError_shouldLogAndNotThrow() {
        assertDoesNotThrow(() -> errorHandler.handleCacheGetError(exception, cache, "key1"));
    }

    @Test
    void handleCachePutError_shouldLogAndNotThrow() {
        assertDoesNotThrow(() -> errorHandler.handleCachePutError(exception, cache, "key1", "value1"));
    }

    @Test
    void handleCacheEvictError_shouldLogAndNotThrow() {
        assertDoesNotThrow(() -> errorHandler.handleCacheEvictError(exception, cache, "key1"));
    }

    @Test
    void handleCacheClearError_shouldLogAndNotThrow() {
        assertDoesNotThrow(() -> errorHandler.handleCacheClearError(exception, cache));
    }
    
    @Test
    void redisConnectionFactory_test() {
        // Exercise bean creation path
        assertDoesNotThrow(() -> redisConfig.redisConnectionFactory());
    }
}
