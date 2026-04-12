package com.skillsync.authservice.controller.internal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.authservice.dto.AuthProfileUpdateDTO;
import com.skillsync.authservice.entity.User;
import com.skillsync.authservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

@WebMvcTest(controllers = InternalUserController.class, excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class})
class InternalUserControllerTest {

    @Configuration
    @Import(InternalUserController.class)
    static class TestConfig {}

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    private static final ObjectMapper objectMapper = new ObjectMapper();

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setRole("ROLE_USER");
        user.setIsActive(true);
    }

    @Test
    void updateUserProfile_shouldUpdate_whenUserExistsAndUsernameProvided() throws Exception {
        AuthProfileUpdateDTO updates = new AuthProfileUpdateDTO();
        updates.setUsername("newusername");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/profile")
                        .header("X-Internal-Service", "user-service")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk());

        verify(userRepository).save(user);
        assert (user.getUsername().equals("newusername"));
    }

    @Test
    void updateUserProfile_shouldNotUpdate_whenUsernameEmpty() throws Exception {
        AuthProfileUpdateDTO updates = new AuthProfileUpdateDTO();
        updates.setUsername("");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updates)))
                .andExpect(status().isOk());

        verify(userRepository, never()).save(any());
    }

    @Test
    void updateUserProfile_shouldReturnNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/99/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AuthProfileUpdateDTO())))
                .andExpect(status().isNotFound());
    }

    @Test
    void addUserRole_shouldAddRole_whenUserExistsAndNotAlreadyPresent() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_MENTOR")
                        .header("X-Internal-Service", "mentor-service"))
                .andExpect(status().isOk());

        verify(userRepository).save(user);
        assert (user.getRole().contains("ROLE_MENTOR"));
    }

    @Test
    void addUserRole_shouldNotAdd_whenAlreadyPresent() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/roles")
                        .param("role", "ROLE_USER"))
                .andExpect(status().isOk());

        verify(userRepository, never()).save(any());
    }

    @Test
    void addUserRole_shouldReturnNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/99/roles")
                        .param("role", "ROLE_MENTOR"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getUserRoles_shouldReturnRoles_whenUserExists() throws Exception {
        user.setRole("ROLE_USER,ROLE_MENTOR");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/internal/users/1/roles")
                        .header("X-Internal-Service", "user-service"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[?(@ == 'ROLE_USER')]").exists())
                .andExpect(jsonPath("$[?(@ == 'ROLE_MENTOR')]").exists());
    }

    @Test
    void getUserRoles_shouldReturnEmptySet_whenRolesNull() throws Exception {
        user.setRole(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/internal/users/1/roles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getUserRoles_shouldReturnNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/internal/users/99/roles"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUserStatus_shouldUpdate_whenUserExists() throws Exception {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        mockMvc.perform(put("/internal/users/1/status")
                        .param("isActive", "false")
                        .header("X-Internal-Service", "user-service"))
                .andExpect(status().isOk());

        verify(userRepository).save(user);
        assert (!user.getIsActive());
    }

    @Test
    void updateUserStatus_shouldReturnNotFound_whenUserDoesNotExist() throws Exception {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        mockMvc.perform(put("/internal/users/99/status")
                        .param("isActive", "false"))
                .andExpect(status().isNotFound());
    }
}
