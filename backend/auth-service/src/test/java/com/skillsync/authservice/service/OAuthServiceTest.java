package com.skillsync.authservice.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.skillsync.authservice.audit.AuditService;
import com.skillsync.authservice.client.UserServiceClient;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.enums.AuthProvider;
import com.skillsync.authservice.publisher.AuthEventPublisher;
import com.skillsync.authservice.repository.UserRepository;
import com.skillsync.authservice.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OAuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuditService auditService;
    @Mock private UserServiceClient userServiceClient;
    @Mock private AuthEventPublisher eventPublisher;

    @InjectMocks @Spy
    private OAuthService oAuthService;

    @Mock private GoogleIdTokenVerifier verifier;
    @Mock private GoogleIdToken googleIdToken;
    @Mock private GoogleIdToken.Payload payload;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(oAuthService, "googleClientId", "test-client-id");
        doReturn(verifier).when(oAuthService).getVerifier();
    }

    @Test
    void loginWithGoogle_shouldReturnAuthResponse_whenNewUser() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("new@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-123");
        lenient().when(payload.get("name")).thenReturn("New User");

        lenient().when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        lenient().when(userRepository.existsByUsername("new")).thenReturn(false);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("encoded-pass");
        
        User savedUser = new User("new@example.com", "encoded-pass", "new", "ROLE_LEARNER");
        savedUser.setId(1L);
        lenient().when(userRepository.save(any())).thenReturn(savedUser);
        
        lenient().when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("access-token");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");

        AuthResponse response = oAuthService.loginWithGoogle(idToken);

        assertThat(response.email()).isEqualTo("new@example.com");
        assertThat(response.token()).isEqualTo("access-token");
        verify(eventPublisher).publishUserCreated(any());
        verify(userServiceClient).createProfile(anyMap());
    }

    @Test
    void loginWithGoogle_shouldHandleUsernameCollision() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("collision@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-456");

        lenient().when(userRepository.findByEmail("collision@example.com")).thenReturn(Optional.empty());
        lenient().when(userRepository.existsByUsername("collision")).thenReturn(true);
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("encoded-pass");
        
        User savedUser = new User("collision@example.com", "encoded-pass", "collision.uuid", "ROLE_LEARNER");
        savedUser.setId(2L);
        lenient().when(userRepository.save(any())).thenReturn(savedUser);
        
        lenient().when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("t");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("rt");

        oAuthService.loginWithGoogle(idToken);

        verify(userRepository).save(argThat(u -> u.getUsername().startsWith("collision.")));
    }

    @Test
    void loginWithGoogle_shouldReturnAuthResponse_whenExistingGoogleUser() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("exists@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-123");

        User existingUser = new User("exists@example.com", "pass", "exists", "ROLE_LEARNER");
        existingUser.setId(3L);
        existingUser.setAuthProvider(AuthProvider.GOOGLE);
        existingUser.setProviderId("google-id-123");
        lenient().when(userRepository.findByEmail("exists@example.com")).thenReturn(Optional.of(existingUser));
        
        lenient().when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("access-token");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("refresh-token");

        AuthResponse response = oAuthService.loginWithGoogle(idToken);

        assertThat(response.email()).isEqualTo("exists@example.com");
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginWithGoogle_shouldThrow_whenExistingLocalUser() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("local@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-123");

        User existingUser = new User("local@example.com", "pass", "local", "ROLE_LEARNER");
        existingUser.setAuthProvider(AuthProvider.LOCAL);
        lenient().when(userRepository.findByEmail("local@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> oAuthService.loginWithGoogle(idToken))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already registered with password login");
    }

    @Test
    void loginWithGoogle_shouldThrow_whenAccountDeactivated() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("deactivated@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-123");

        User existingUser = new User("deactivated@example.com", "pass", "deactivated", "ROLE_LEARNER");
        existingUser.setIsActive(false);
        lenient().when(userRepository.findByEmail("deactivated@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> oAuthService.loginWithGoogle(idToken))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    void loginWithGoogle_shouldThrow_whenVerifyReturnsNull() throws Exception {
        lenient().when(verifier.verify(anyString())).thenReturn(null);

        assertThatThrownBy(() -> oAuthService.loginWithGoogle("bad-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Invalid Google token");
    }

    @Test
    void loginWithGoogle_shouldThrow_whenVerifyThrowsException() throws Exception {
        lenient().when(verifier.verify(anyString())).thenThrow(new RuntimeException("Network error"));

        assertThatThrownBy(() -> oAuthService.loginWithGoogle("token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Network error");
    }

    @Test
    void createOAuthUser_shouldStillSucceed_whenPublishOrFeignFails() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("fail@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-123");

        lenient().when(userRepository.findByEmail("fail@example.com")).thenReturn(Optional.empty());
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("encoded-pass");
        
        User savedUser = new User("fail@example.com", "encoded-pass", "fail", "ROLE_LEARNER");
        savedUser.setId(5L);
        lenient().when(userRepository.save(any())).thenReturn(savedUser);
        
        lenient().doThrow(new RuntimeException("Rabbit fail")).when(eventPublisher).publishUserCreated(any());
        lenient().doThrow(new RuntimeException("Feign fail")).when(userServiceClient).createProfile(any());

        lenient().when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("t");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("rt");

        assertThatCode(() -> oAuthService.loginWithGoogle(idToken)).doesNotThrowAnyException();
    }

    @Test
    void loginWithGoogle_shouldUpdateProviderId_whenExistingUserHasNullProviderId() throws Exception {
        String idToken = "valid-token";
        lenient().when(verifier.verify(idToken)).thenReturn(googleIdToken);
        lenient().when(googleIdToken.getPayload()).thenReturn(payload);
        lenient().when(payload.getEmail()).thenReturn("migrate@example.com");
        lenient().when(payload.getSubject()).thenReturn("google-id-migrate");

        User existingUser = new User("migrate@example.com", "pass", "migrate", "ROLE_LEARNER");
        existingUser.setId(10L);
        existingUser.setAuthProvider(AuthProvider.GOOGLE);
        existingUser.setProviderId(null); // Null case
        lenient().when(userRepository.findByEmail("migrate@example.com")).thenReturn(Optional.of(existingUser));
        
        lenient().when(jwtUtil.generateToken(anyLong(), anyString(), anyList())).thenReturn("at");
        lenient().when(jwtUtil.generateRefreshToken(anyLong(), anyString(), anyList())).thenReturn("rt");

        oAuthService.loginWithGoogle(idToken);

        verify(userRepository).save(argThat(u -> "google-id-migrate".equals(u.getProviderId())));
    }

    @Test
    void verifyGoogleToken_shouldThrow_whenGeneralExceptionOccurs() throws Exception {
        // We use a non-RuntimeException to trigger the second catch block
        lenient().when(verifier.verify(anyString())).thenAnswer(inv -> {
            throw new Exception("General security error");
        });

        assertThatThrownBy(() -> oAuthService.loginWithGoogle("token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Google token verification failed");
    }

    @Test
    void getVerifier_shouldReturnNonNull() {
        // We call the real method on the spy
        doCallRealMethod().when(oAuthService).getVerifier();
        GoogleIdTokenVerifier v = oAuthService.getVerifier();
        assertThat(v).isNotNull();
    }
}

