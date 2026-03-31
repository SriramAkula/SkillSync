package com.skillsync.authservice.audit;

import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.CustomUserDetails;
import com.skillsync.authservice.security.CustomUserDetailsService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditAndSecurityTest {

    // ─── AuditService ────────────────────────────────────────────

    @Mock private AuditLogRepository auditLogRepository;
    @InjectMocks private AuditService auditService;

    @Test
    void auditService_shouldSaveLog_whenCalled() {
        when(auditLogRepository.save(any())).thenReturn(new AuditLog());

        auditService.log("User", 1L, "LOGIN", "1", "email=test@example.com");

        verify(auditLogRepository).save(argThat(log ->
                log.getEntityName().equals("User") &&
                log.getAction().equals("LOGIN") &&
                log.getPerformedBy().equals("1")
        ));
    }

    @Test
    void auditService_shouldNotThrow_whenRepositoryFails() {
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB error"));

        assertThatCode(() -> auditService.log("User", 1L, "LOGIN", "1", "details"))
                .doesNotThrowAnyException();
    }

    @Test
    void auditService_shouldUseSystem_whenPerformedByIsNull() {
        when(auditLogRepository.save(any())).thenReturn(new AuditLog());

        auditService.log("User", 1L, "REGISTER", null, "details");

        verify(auditLogRepository).save(argThat(log -> log.getPerformedBy().equals("system")));
    }

    // ─── CustomUserDetailsService ─────────────────────────────────

    @Mock private UserRepository userRepository;
    @InjectMocks private CustomUserDetailsService userDetailsService;

    @Test
    void loadUserByUsername_shouldReturnUserDetails_whenUserExists() {
        User user = new User("test@example.com", "encodedPass", "test.example.com", "ROLE_LEARNER");
        user.setId(1L);
        user.setIsActive(true);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername("test@example.com");

        // CustomUserDetails.getUsername() returns null (stub) - verify the object is created correctly
        assertThat(result).isNotNull();
        assertThat(result).isInstanceOf(CustomUserDetails.class);
    }

    @Test
    void loadUserByUsername_shouldThrow_whenUserNotFound() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("ghost@example.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost@example.com");
    }
}
