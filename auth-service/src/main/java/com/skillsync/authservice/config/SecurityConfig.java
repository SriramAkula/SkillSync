package com.skillsync.authservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.skillsync.authservice.security.CustomUserDetailsService;
import com.skillsync.authservice.security.JwtFilter;
import com.skillsync.authservice.security.InternalServiceFilter;
import com.skillsync.authservice.security.SecurityExceptionHandler;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;
    private final InternalServiceFilter internalServiceFilter;
    private final SecurityExceptionHandler securityExceptionHandler;

    public SecurityConfig(JwtFilter jwtFilter, CustomUserDetailsService userDetailsService, InternalServiceFilter internalServiceFilter, SecurityExceptionHandler securityExceptionHandler) {
        this.jwtFilter = jwtFilter;
        this.userDetailsService = userDetailsService;
        this.internalServiceFilter = internalServiceFilter;
        this.securityExceptionHandler = securityExceptionHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                // Public endpoints - use /auth paths (API Gateway strips /api prefix)
                .requestMatchers("/auth/register", "/auth/login", "/auth/refresh",
                        "/auth/send-otp", "/auth/verify-otp",
                        "/auth/forgot-password", "/auth/verify-forgot-password", "/auth/reset-password",
                        "/auth/oauth/google").permitAll()
                .requestMatchers("/internal/**").permitAll()
                .requestMatchers("/auth/internal/**").permitAll()
                // Actuator endpoints for Prometheus scraping
                .requestMatchers("/actuator/**").permitAll()
                // Swagger/OpenAPI endpoints
                .requestMatchers("/v3/api-docs", "/v3/api-docs/**").permitAll()
                .requestMatchers("/swagger-ui.html", "/swagger-ui/**").permitAll()
                .requestMatchers("/swagger-resources", "/swagger-resources/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(securityExceptionHandler)
                .accessDeniedHandler(securityExceptionHandler)
            )
            // Add InternalServiceFilter BEFORE JwtFilter to check for internal service calls first
            .addFilterBefore(internalServiceFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("authorization", "content-type", "x-auth-token"));
        configuration.setExposedHeaders(List.of("x-auth-token"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
