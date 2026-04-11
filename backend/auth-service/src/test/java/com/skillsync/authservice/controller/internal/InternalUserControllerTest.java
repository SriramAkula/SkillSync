package com.skillsync.authservice.controller.internal;

import com.skillsync.authservice.dto.AuthProfileUpdateDTO;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class InternalUserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InternalUserController internalUserController;

    private User user;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(internalUserController).build();
        user = new User("test@example.com", "pass", "testuser", "ROLE_LEARNER");
        user.setId(1L);
    }

    @Test
    void updateUserProfile_shouldUpdate_whenValid() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newname\"}")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getUsername().equals("newname")));
    }

    @Test
    void updateUserProfile_shouldNotUpdate_whenEmptyUsername() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"\"}")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserProfile_shouldReturn404_whenUserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"newname\"}")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    @Test
    void addUserRole_shouldAdd_whenNew() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_MENTOR")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());

        verify(userRepository).save(argThat(u -> u.getRole().contains("ROLE_MENTOR")));
    }

    @Test
    void addUserRole_shouldNotAdd_whenAlreadyExists() throws Exception {
        user.setRole("ROLE_LEARNER,ROLE_MENTOR");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_MENTOR")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk());

        verify(userRepository, never()).save(any());
    }

    @Test
    void getUserRoles_shouldReturnEmptySet_whenNoRoles() throws Exception {
        user.setRole("");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/internal/users/1/roles")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getUserRoles_shouldHandleNullHeaders() throws Exception {
        user.setRole("ROLE_LEARNER");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/internal/users/1/roles"))
                .andExpect(status().isOk());
    }

    @Test
    void updateUserStatus_shouldReturn404_whenUserNotFound() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/1/status")
                        .param("isActive", "false"))
                .andExpect(status().isNotFound());
    }
}

