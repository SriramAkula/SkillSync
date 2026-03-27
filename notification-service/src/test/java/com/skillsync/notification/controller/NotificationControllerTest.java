package com.skillsync.notification.controller;

import com.skillsync.notification.entity.Notification;
import com.skillsync.notification.exception.NotificationNotFoundException;
import com.skillsync.notification.exception.UnauthorizedException;
import com.skillsync.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    controllers = NotificationController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    },
    excludeFilters = {
        @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.skillsync\\.notification\\.consumer\\..*"),
        @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = com.skillsync.notification.filter.GatewayRequestFilter.class)
    }
)
class NotificationControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean NotificationService notificationService;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = new Notification();
        notification.setId(1L);
        notification.setUserId(10L);
        notification.setType("SESSION_REQUESTED");
        notification.setMessage("New session request");
        notification.setIsRead(false);
        notification.setSentAt(LocalDateTime.now());
    }

    // ─── GET /notification ───────────────────────────────────────────────────

    @Test
    void getUserNotifications_shouldReturn200_whenAuthenticated() throws Exception {
        when(notificationService.getUserNotifications(10L)).thenReturn(List.of(notification));

        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].userId").value(10));
    }

    @Test
    void getUserNotifications_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserNotifications_shouldReturn403_whenRolesEmpty() throws Exception {
        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L)
                        .header("roles", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    void getUserNotifications_shouldReturnEmptyList_whenNoNotifications() throws Exception {
        when(notificationService.getUserNotifications(10L)).thenReturn(List.of());

        mockMvc.perform(get("/notification")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data").isEmpty());
    }

    // ─── GET /notification/unread ────────────────────────────────────────────

    @Test
    void getUnreadNotifications_shouldReturn200_whenAuthenticated() throws Exception {
        when(notificationService.getUserUnreadNotifications(10L)).thenReturn(List.of(notification));

        mockMvc.perform(get("/notification/unread")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].isRead").value(false));
    }

    @Test
    void getUnreadNotifications_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(get("/notification/unread")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    // ─── GET /notification/unread/count ─────────────────────────────────────

    @Test
    void getUnreadCount_shouldReturn200_withCount() throws Exception {
        when(notificationService.getUnreadCount(10L)).thenReturn(3);

        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(3));
    }

    @Test
    void getUnreadCount_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(get("/notification/unread/count")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    // ─── PUT /notification/{id}/read ─────────────────────────────────────────

    @Test
    void markAsRead_shouldReturn200_whenOwner() throws Exception {
        doNothing().when(notificationService).markAsRead(1L, 10L);

        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification marked as read"));
    }

    @Test
    void markAsRead_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(put("/notification/1/read")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void markAsRead_shouldReturn404_whenNotificationNotFound() throws Exception {
        doThrow(new NotificationNotFoundException("Not found"))
                .when(notificationService).markAsRead(99L, 10L);

        mockMvc.perform(put("/notification/99/read")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound());
    }

    // ─── DELETE /notification/{id} ───────────────────────────────────────────

    @Test
    void deleteNotification_shouldReturn200_whenOwner() throws Exception {
        doNothing().when(notificationService).deleteNotification(1L, 10L);

        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification deleted successfully"));
    }

    @Test
    void deleteNotification_shouldReturn403_whenRolesMissing() throws Exception {
        mockMvc.perform(delete("/notification/1")
                        .header("X-User-Id", 10L))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteNotification_shouldReturn404_whenNotFound() throws Exception {
        doThrow(new NotificationNotFoundException("Not found"))
                .when(notificationService).deleteNotification(99L, 10L);

        mockMvc.perform(delete("/notification/99")
                        .header("X-User-Id", 10L)
                        .header("roles", "ROLE_LEARNER"))
                .andExpect(status().isNotFound());
    }
}
