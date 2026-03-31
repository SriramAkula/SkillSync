package com.skillsync.authservice.controller.internal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.dto.AuthProfileUpdateDTO;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.skillsync.authservice.config.JwtConfig;
import com.skillsync.authservice.security.JwtUtil;

@WebMvcTest(
    controllers = InternalUserController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.authservice.filter.GatewayRequestFilter.class
    )
)
class InternalUserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean UserRepository userRepository;
    @MockBean JwtUtil jwtUtil;
    @MockBean JwtConfig jwtConfig;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User("test@example.com", "encodedPass", "old.username", "ROLE_LEARNER");
        user.setId(1L);
        user.setIsActive(true);
    }

    // ─── PUT /internal/users/{userId}/profile ────────────────────

    @Test
    void updateUserProfile_shouldReturn200_whenUserExists() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        AuthProfileUpdateDTO dto = new AuthProfileUpdateDTO();
        dto.setUsername("new.username");

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getUsername().equals("new.username")));
    }

    @Test
    void updateUserProfile_shouldReturn404_whenUserNotFound() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        AuthProfileUpdateDTO dto = new AuthProfileUpdateDTO();
        dto.setUsername("new.username");

        mockMvc.perform(put("/internal/users/99/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isNotFound());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserProfile_shouldNotUpdateUsername_whenUsernameBlank() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        AuthProfileUpdateDTO dto = new AuthProfileUpdateDTO();
        dto.setUsername("");

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getUsername().equals("old.username")));
    }

    // ─── PUT /internal/users/{userId}/roles ──────────────────────

    @Test
    void addUserRole_shouldReturn200_andAddRole_whenUserExists() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_MENTOR"))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getRole().contains("ROLE_MENTOR")));
    }

    @Test
    void addUserRole_shouldReturn200_andNotDuplicate_whenRoleAlreadyExists() throws Exception {
        user = new User("test@example.com", "encodedPass", "test.example.com", "ROLE_LEARNER,ROLE_MENTOR");
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_MENTOR"))
                .andExpect(status().isOk());

        verify(userRepository, never()).save(any());
    }

    @Test
    void addUserRole_shouldReturn404_whenUserNotFound() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/99/roles")
                        .param("role", "ROLE_MENTOR"))
                .andExpect(status().isNotFound());
    }
}
