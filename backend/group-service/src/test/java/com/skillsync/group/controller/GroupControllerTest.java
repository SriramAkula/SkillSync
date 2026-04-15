package com.skillsync.group.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.exception.AlreadyMemberException;
import com.skillsync.group.exception.GroupFullException;
import com.skillsync.group.exception.GroupNotFoundException;
import com.skillsync.group.service.GroupService;
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
import com.skillsync.group.filter.GatewayRequestFilter;
import com.skillsync.group.dto.response.PageResponse;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = GroupController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = GatewayRequestFilter.class
    )
)
class GroupControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean GroupService groupService;

    private GroupResponseDto groupResponse;

    @BeforeEach
    void setUp() {
        groupResponse = GroupResponseDto.builder()
                .id(1L).creatorId(100L).name("Java Learners")
                .skillId(5L).maxMembers(10).currentMembers(1)
                .description("Learn Java").isActive(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    // ─── POST /group ─────────────────────────────────────────────────────────

    @Test
    void createGroup_shouldReturn201_whenMentorRole() throws Exception {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("Java Learners");
        request.setSkillId(5L);
        request.setMaxMembers(10);
        when(groupService.createGroup(eq(100L), any())).thenReturn(groupResponse);

        mockMvc.perform(post("/group")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Java Learners"));
        verify(groupService).createGroup(eq(100L), any());
    }

    @Test
    void createGroup_shouldReturn201_whenLearnerRole() throws Exception {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("Java Learners");
        request.setSkillId(5L);
        request.setMaxMembers(10);
        when(groupService.createGroup(eq(100L), any())).thenReturn(groupResponse);

        mockMvc.perform(post("/group")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_LEARNER")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Java Learners"));
        verify(groupService).createGroup(eq(100L), any());
    }



    @Test
    void createGroup_shouldReturn400_whenNameBlank() throws Exception {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("");
        request.setSkillId(5L);
        request.setMaxMembers(10);

        mockMvc.perform(post("/group")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_MENTOR")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // ─── GET /group/{groupId} ────────────────────────────────────────────────

    @Test
    void getGroupDetails_shouldReturn200_whenGroupExists() throws Exception {
        when(groupService.getGroupDetails(eq(1L), any())).thenReturn(groupResponse);

        mockMvc.perform(get("/group/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1));
    }

    @Test
    void getGroupDetails_shouldReturn404_whenGroupNotFound() throws Exception {
        when(groupService.getGroupDetails(eq(99L), any())).thenThrow(new GroupNotFoundException("Not found"));

        mockMvc.perform(get("/group/99"))
                .andExpect(status().isNotFound());
    }

    // ─── GET /group/skill/{skillId} ──────────────────────────────────────────

    @Test
    void getGroupsBySkill_shouldReturn200_withList() throws Exception {
        PageResponse<GroupResponseDto> pageResponse = PageResponse.<GroupResponseDto>builder()
                .content(List.of(groupResponse))
                .totalElements(1L)
                .totalPages(1)
                .currentPage(0)
                .pageSize(10)
                .build();
        when(groupService.getGroupsBySkill(eq(5L), anyInt(), anyInt(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/group/skill/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].skillId").value(5));
    }

    @Test
    void getGroupsBySkill_shouldReturn200_withEmptyList() throws Exception {
        PageResponse<GroupResponseDto> pageResponse = PageResponse.<GroupResponseDto>builder()
                .content(List.of())
                .totalElements(0L)
                .totalPages(0)
                .currentPage(0)
                .pageSize(10)
                .build();
        when(groupService.getGroupsBySkill(eq(99L), anyInt(), anyInt(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/group/skill/99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").isArray())
                .andExpect(jsonPath("$.data.content").isEmpty());
    }

    // ─── POST /group/{groupId}/join ──────────────────────────────────────────

    @Test
    void joinGroup_shouldReturn200_whenLearnerRole() throws Exception {
        when(groupService.joinGroup(1L, 200L)).thenReturn(groupResponse);

        mockMvc.perform(post("/group/1/join")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Joined group successfully"));
    }

    @Test
    void joinGroup_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(post("/group/1/join")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    @Test
    void joinGroup_shouldReturn409_whenAlreadyMember() throws Exception {
        when(groupService.joinGroup(1L, 200L)).thenThrow(new AlreadyMemberException("Already member"));

        mockMvc.perform(post("/group/1/join")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isConflict());
    }

    @Test
    void joinGroup_shouldReturn409_whenGroupFull() throws Exception {
        when(groupService.joinGroup(1L, 200L)).thenThrow(new GroupFullException("Group full"));

        mockMvc.perform(post("/group/1/join")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isConflict());
    }

    // ─── DELETE /group/{groupId}/leave ───────────────────────────────────────

    @Test
    void leaveGroup_shouldReturn200_whenLearnerRole() throws Exception {
        when(groupService.leaveGroup(1L, 200L)).thenReturn(groupResponse);

        mockMvc.perform(delete("/group/1/leave")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Left group successfully"));
    }

    @Test
    void leaveGroup_shouldReturn403_whenNotLearner() throws Exception {
        mockMvc.perform(delete("/group/1/leave")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isForbidden());
    }

    @Test
    void leaveGroup_shouldReturn404_whenGroupNotFound() throws Exception {
        when(groupService.leaveGroup(99L, 200L)).thenThrow(new GroupNotFoundException("Not found"));

        mockMvc.perform(delete("/group/99/leave")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound());
    }

    // ─── DELETE /group/{groupId} ─────────────────────────────────────────────

    @Test
    void deleteGroup_shouldReturn200_whenMentorRole() throws Exception {
        doNothing().when(groupService).deleteGroup(eq(1L), eq(100L), anyBoolean());

        mockMvc.perform(delete("/group/1")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Group deleted successfully"));
    }

    @Test
    void deleteGroup_shouldReturn200_whenLearnerRole() throws Exception {
        doNothing().when(groupService).deleteGroup(eq(1L), eq(100L), anyBoolean());

        mockMvc.perform(delete("/group/1")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Group deleted successfully"));
    }

    @Test
    void deleteGroup_shouldReturn403_whenInvalidRole() throws Exception {
        mockMvc.perform(delete("/group/1")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_GUEST"))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteGroup_shouldReturn404_whenGroupNotFound() throws Exception {
        doThrow(new GroupNotFoundException("Not found")).when(groupService).deleteGroup(eq(99L), eq(100L), anyBoolean());

        mockMvc.perform(delete("/group/99")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_MENTOR"))
                .andExpect(status().isNotFound());
    }

    @Test
    void createGroup_shouldReturn201_whenAdminRole() throws Exception {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("Admin Group");
        request.setSkillId(5L);
        request.setMaxMembers(10);
        when(groupService.createGroup(eq(100L), any())).thenReturn(groupResponse);

        mockMvc.perform(post("/group")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void joinGroup_shouldReturn200_whenAdminRole() throws Exception {
        when(groupService.joinGroup(1L, 200L)).thenReturn(groupResponse);

        mockMvc.perform(post("/group/1/join")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void leaveGroup_shouldReturn200_whenAdminRole() throws Exception {
        when(groupService.leaveGroup(1L, 200L)).thenReturn(groupResponse);

        mockMvc.perform(delete("/group/1/leave")
                        .header("X-User-Id", 200L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteGroup_shouldReturn200_whenAdminRole() throws Exception {
        doNothing().when(groupService).deleteGroup(eq(1L), eq(100L), anyBoolean());

        mockMvc.perform(delete("/group/1")
                        .header("X-User-Id", 100L)
                        .header("roles", "ROLE_ADMIN"))
                .andExpect(status().isOk());
    }

    @Test
    void createGroup_shouldReturn403_whenRolesNull() throws Exception {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("Valid Name");
        request.setSkillId(5L);
        request.setMaxMembers(10);

        mockMvc.perform(post("/group")
                        .header("X-User-Id", 100L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void getRandomGroups_shouldReturn200() throws Exception {
        when(groupService.getRandomGroups(eq(5), any())).thenReturn(List.of(groupResponse));

        mockMvc.perform(get("/group/random").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray());
    }
}
