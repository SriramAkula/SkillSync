package com.skillsync.notification.controller;

import com.skillsync.notification.dto.NotificationDto;
import com.skillsync.notification.dto.response.PageResponse;
import com.skillsync.notification.service.NotificationService;
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
import static org.mockito.Mockito.when;
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
}
