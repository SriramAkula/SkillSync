package com.skillsync.skill.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.ApiResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.service.SkillService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = SkillController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.skill.filter.GatewayRequestFilter.class
    )
)
class SkillControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean SkillService skillService;

    private SkillResponseDto skillResponse;
    private CreateSkillRequestDto createRequest;

    @BeforeEach
    void setUp() {
        skillResponse = new SkillResponseDto();
        skillResponse.setId(1L);
        skillResponse.setSkillName("Java");
        skillResponse.setDescription("Java programming language");
        skillResponse.setCategory("Programming");
        skillResponse.setPopularityScore(100);
        skillResponse.setIsActive(true);
        skillResponse.setCreatedAt(LocalDateTime.now());
        skillResponse.setUpdatedAt(LocalDateTime.now());

        createRequest = new CreateSkillRequestDto("Java", "Java programming language", "Programming");
    }

    // ─── POST /skill ──────────────────────────────────────────────────────────

    @Test
    void createSkill_shouldReturn201_whenAdminRole() throws Exception {
        when(skillService.createSkill(any())).thenReturn(skillResponse);

        mockMvc.perform(post("/skill")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skill created successfully"))
                .andExpect(jsonPath("$.data.skillName").value("Java"))
                .andExpect(jsonPath("$.statusCode").value(201));
    }

    @Test
    void createSkill_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(post("/skill")
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isForbidden());

        verify(skillService, never()).createSkill(any());
    }

    @Test
    void createSkill_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(post("/skill")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isForbidden());

        verify(skillService, never()).createSkill(any());
    }

    @Test
    void createSkill_shouldReturn400_whenSkillNameBlank() throws Exception {
        CreateSkillRequestDto invalid = new CreateSkillRequestDto("", "desc", "cat");

        mockMvc.perform(post("/skill")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSkill_shouldReturn400_whenSkillNameTooShort() throws Exception {
        CreateSkillRequestDto invalid = new CreateSkillRequestDto("A", "desc", "cat");

        mockMvc.perform(post("/skill")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    // ─── GET /skill/{id} ──────────────────────────────────────────────────────

    @Test
    void getSkillById_shouldReturn200_whenExists() throws Exception {
        when(skillService.getSkillById(1L)).thenReturn(skillResponse);

        mockMvc.perform(get("/skill/1")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skill fetched successfully"))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.skillName").value("Java"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void getSkillById_shouldReturn404_whenNotFound() throws Exception {
        when(skillService.getSkillById(99L)).thenThrow(new RuntimeException("Skill not found"));

        mockMvc.perform(get("/skill/99")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /skill ───────────────────────────────────────────────────────────

    @Test
    void getAllSkills_shouldReturn200_withList() throws Exception {
        when(skillService.getAllActiveSkills()).thenReturn(List.of(skillResponse));

        mockMvc.perform(get("/skill")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skills fetched successfully"))
                .andExpect(jsonPath("$.data[0].skillName").value("Java"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void getAllSkills_shouldReturn200_withEmptyList() throws Exception {
        when(skillService.getAllActiveSkills()).thenReturn(List.of());

        mockMvc.perform(get("/skill")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── GET /skill/search ────────────────────────────────────────────────────

    @Test
    void searchSkills_shouldReturn200_withResults() throws Exception {
        when(skillService.searchSkills("java")).thenReturn(List.of(skillResponse));

        mockMvc.perform(get("/skill/search")
                        .param("keyword", "java")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skills found"))
                .andExpect(jsonPath("$.data[0].skillName").value("Java"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void searchSkills_shouldReturn200_withEmptyResults() throws Exception {
        when(skillService.searchSkills("unknown")).thenReturn(List.of());

        mockMvc.perform(get("/skill/search")
                        .param("keyword", "unknown")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── GET /skill/category/{category} ──────────────────────────────────────

    @Test
    void getByCategory_shouldReturn200_withList() throws Exception {
        when(skillService.getSkillsByCategory("Programming")).thenReturn(List.of(skillResponse));

        mockMvc.perform(get("/skill/category/Programming")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skills fetched successfully"))
                .andExpect(jsonPath("$.data[0].category").value("Programming"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void getByCategory_shouldReturn200_withEmptyList() throws Exception {
        when(skillService.getSkillsByCategory("Unknown")).thenReturn(List.of());

        mockMvc.perform(get("/skill/category/Unknown")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── PUT /skill/{id} ──────────────────────────────────────────────────────

    @Test
    void updateSkill_shouldReturn200_whenAdminRole() throws Exception {
        when(skillService.updateSkill(eq(1L), any())).thenReturn(skillResponse);

        mockMvc.perform(put("/skill/1")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skill updated successfully"))
                .andExpect(jsonPath("$.data.skillName").value("Java"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void updateSkill_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(put("/skill/1")
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isForbidden());

        verify(skillService, never()).updateSkill(anyLong(), any());
    }

    @Test
    void updateSkill_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(put("/skill/1")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateSkill_shouldReturn400_whenNameBlank() throws Exception {
        CreateSkillRequestDto invalid = new CreateSkillRequestDto("", "desc", "cat");

        mockMvc.perform(put("/skill/1")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateSkill_shouldReturn404_whenNotFound() throws Exception {
        when(skillService.updateSkill(eq(99L), any()))
                .thenThrow(new RuntimeException("Skill not found"));

        mockMvc.perform(put("/skill/99")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isNotFound());
    }

    // ─── DELETE /skill/{id} ───────────────────────────────────────────────────

    @Test
    void deleteSkill_shouldReturn200_whenAdminRole() throws Exception {
        doNothing().when(skillService).deleteSkill(1L);

        mockMvc.perform(delete("/skill/1")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Skill deleted successfully"))
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    @Test
    void deleteSkill_shouldReturn403_whenNotAdmin() throws Exception {
        mockMvc.perform(delete("/skill/1")
                        .header("roles", "ROLE_LEARNER")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());

        verify(skillService, never()).deleteSkill(anyLong());
    }

    @Test
    void deleteSkill_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(delete("/skill/1")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteSkill_shouldReturn404_whenNotFound() throws Exception {
        doThrow(new RuntimeException("Skill not found")).when(skillService).deleteSkill(99L);

        mockMvc.perform(delete("/skill/99")
                        .header("roles", "ROLE_ADMIN")
                        .header("X-Gateway-Request", "true"))
                .andExpect(status().isNotFound());
    }
}
