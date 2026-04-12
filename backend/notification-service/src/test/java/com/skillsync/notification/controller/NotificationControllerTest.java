package com.skillsync.notification.controller;

import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.dto.response.PageResponse;
import com.skillsync.notification.service.NotificationService;
import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = NotificationController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.ASSIGNABLE_TYPE,
        classes = com.skillsync.notification.filter.GatewayRequestFilter.class
    )
)
class NotificationControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockBean private NotificationService notificationService;

    @Test
    void getUserNotifications_shouldReturn200() throws Exception {
        PageResponse<NotificationDto> pageResponse = PageResponse.<NotificationDto>builder()
                .content(List.of())
                .totalElements(0L)
                .build();
        when(notificationService.getUserNotifications(anyLong(), anyInt(), anyInt())).thenReturn(pageResponse);

        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk());
    }

    @Test
    void getUnreadNotifications_shouldReturn200() throws Exception {
        PageResponse<NotificationDto> pageResponse = PageResponse.<NotificationDto>builder()
                .content(List.of())
                .totalElements(0L)
                .build();
        when(notificationService.getUserUnreadNotifications(anyLong(), anyInt(), anyInt())).thenReturn(pageResponse);

        mockMvc.perform(get("/notification/unread")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk());
    }

    @Test
    void getUnreadCount_shouldReturn200() throws Exception {
        when(notificationService.getUnreadCount(10L)).thenReturn(5);

        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(5));
    }

    @Test
    void markAsRead_shouldReturn200() throws Exception {
        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk());
    }

    @Test
    void deleteNotification_shouldReturn200() throws Exception {
        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk());
    }

    @Test
    void getUserNotifications_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserNotifications_shouldReturn401_whenUserIdMissing() throws Exception {
        mockMvc.perform(get("/notification")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void markAsRead_shouldReturn404_whenNotFound() throws Exception {
        doThrow(new NotificationNotFoundException("Not found"))
                .when(notificationService).markAsRead(1L, 10L);

        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Not found"));
    }

    @Test
    void deleteNotification_shouldReturn403_whenUnauthorized() throws Exception {
        doThrow(new UnauthorizedException("Forbidden"))
                .when(notificationService).deleteNotification(1L, 10L);

        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Forbidden"));
    }

    @Test
    void getUnreadCount_shouldReturn500_onGenericError() throws Exception {
        when(notificationService.getUnreadCount(anyLong())).thenThrow(new RuntimeException("Oops"));

        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Internal server error"));
    }

    @Test
    void getUserNotifications_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUnreadNotifications_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(get("/notification/unread")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUnreadCount_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void markAsRead_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteNotification_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUnreadNotifications_shouldReturn403_whenRolesNull() throws Exception {
        mockMvc.perform(get("/notification/unread")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUnreadCount_shouldReturn403_whenRolesNull() throws Exception {
        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void markAsRead_shouldReturn403_whenRolesNull() throws Exception {
        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteNotification_shouldReturn403_whenRolesNull() throws Exception {
        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUnreadNotifications_shouldReturn401_whenUserIdNull() throws Exception {
        mockMvc.perform(get("/notification/unread")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUnreadCount_shouldReturn401_whenUserIdNull() throws Exception {
        mockMvc.perform(get("/notification/unread/count")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void markAsRead_shouldReturn401_whenUserIdNull() throws Exception {
        mockMvc.perform(put("/notification/1/read")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteNotification_shouldReturn401_whenUserIdNull() throws Exception {
        mockMvc.perform(delete("/notification/1")
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isUnauthorized());
    }
}
