package com.skillsync.session;

import com.skillsync.session.audit.AuditLog;
import com.skillsync.session.dto.ApiResponse;
import com.skillsync.session.dto.request.RequestSessionRequestDto;
import com.skillsync.session.dto.response.PageResponse;
import com.skillsync.session.dto.response.SessionResponseDto;
import com.skillsync.session.dto.response.UserProfileResponseDto;
import com.skillsync.session.event.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventAndDtoTest {

    @Test
    void testEvents() {
        LocalDateTime now = LocalDateTime.now();

        // 1. SessionRequestedEvent
        SessionRequestedEvent e1 = new SessionRequestedEvent(1L, 10L, 20L, now, 60);
        assertThat(e1.getSessionId()).isEqualTo(1L);
        assertThat(e1.getMentorId()).isEqualTo(10L);
        assertThat(e1.getLearnerId()).isEqualTo(20L);
        assertThat(e1.getScheduledAt()).isEqualTo(now);
        assertThat(e1.getDurationMinutes()).isEqualTo(60);

        e1 = new SessionRequestedEvent();
        e1.setSessionId(2L);
        e1.setMentorId(11L);
        e1.setLearnerId(21L);
        e1.setScheduledAt(now.plusDays(1));
        e1.setDurationMinutes(30);
        assertThat(e1.getSessionId()).isEqualTo(2L);
        assertThat(e1.getMentorId()).isEqualTo(11L);
        assertThat(e1.getLearnerId()).isEqualTo(21L);
        assertThat(e1.getScheduledAt()).isEqualTo(now.plusDays(1));
        assertThat(e1.getDurationMinutes()).isEqualTo(30);

        // 2. SessionAcceptedEvent
        SessionAcceptedEvent e2 = new SessionAcceptedEvent(1L, 10L, 20L);
        assertThat(e2.getSessionId()).isEqualTo(1L);
        assertThat(e2.getMentorId()).isEqualTo(10L);
        assertThat(e2.getLearnerId()).isEqualTo(20L);

        e2 = new SessionAcceptedEvent();
        e2.setSessionId(2L);
        e2.setMentorId(11L);
        e2.setLearnerId(21L);
        assertThat(e2.getSessionId()).isEqualTo(2L);
        assertThat(e2.getMentorId()).isEqualTo(11L);
        assertThat(e2.getLearnerId()).isEqualTo(21L);

        // 3. SessionRejectedEvent
        SessionRejectedEvent e3 = new SessionRejectedEvent(1L, 10L, 20L, "Busy");
        assertThat(e3.getSessionId()).isEqualTo(1L);
        assertThat(e3.getMentorId()).isEqualTo(10L);
        assertThat(e3.getLearnerId()).isEqualTo(20L);
        assertThat(e3.getRejectionReason()).isEqualTo("Busy");

        e3 = new SessionRejectedEvent();
        e3.setSessionId(2L);
        e3.setMentorId(11L);
        e3.setLearnerId(21L);
        e3.setRejectionReason("Away");
        assertThat(e3.getSessionId()).isEqualTo(2L);
        assertThat(e3.getMentorId()).isEqualTo(11L);
        assertThat(e3.getLearnerId()).isEqualTo(21L);
        assertThat(e3.getRejectionReason()).isEqualTo("Away");

        // 4. SessionCancelledEvent
        SessionCancelledEvent e4 = new SessionCancelledEvent(1L, 10L, 20L);
        assertThat(e4.getSessionId()).isEqualTo(1L);
        assertThat(e4.getMentorId()).isEqualTo(10L);
        assertThat(e4.getLearnerId()).isEqualTo(20L);

        e4 = new SessionCancelledEvent();
        e4.setSessionId(2L);
        e4.setMentorId(11L);
        e4.setLearnerId(21L);
        assertThat(e4.getSessionId()).isEqualTo(2L);
        assertThat(e4.getMentorId()).isEqualTo(11L);
        assertThat(e4.getLearnerId()).isEqualTo(21L);
    }

    @Test
    void testDtos() {
        LocalDateTime now = LocalDateTime.now();

        // ApiResponse
        ApiResponse<String> res = ApiResponse.ok("data", "msg");
        assertThat(res.getData()).isEqualTo("data");
        assertThat(res.getMessage()).isEqualTo("msg");
        assertThat(res.isSuccess()).isTrue();
        
        ApiResponse<Void> err = ApiResponse.error("error", 400);
        assertThat(err.getMessage()).isEqualTo("error");
        assertThat(err.getStatusCode()).isEqualTo(400);
        assertThat(err.isSuccess()).isFalse();

        ApiResponse<String> builderRes = ApiResponse.<String>builder()
                .success(true)
                .data("d")
                .message("m")
                .statusCode(200)
                .build();
        assertThat(builderRes.getData()).isEqualTo("d");

        // PageResponse
        PageResponse<String> page = new PageResponse<>(List.of("a"), 0, 1L, 1, 10);
        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getCurrentPage()).isEqualTo(0);
        page = new PageResponse<>();
        page.setContent(List.of("b"));
        page.setCurrentPage(1);
        page.setTotalElements(2L);
        page.setTotalPages(1);
        page.setPageSize(15);
        assertThat(page.getContent()).containsExactly("b");

        // SessionResponseDto
        SessionResponseDto sRes = new SessionResponseDto(1L, 10L, 20L, 30L, now, 60, "ACTIVE", "n/a", now, now);
        assertThat(sRes.getId()).isEqualTo(1L);
        assertThat(sRes.getStatus()).isEqualTo("ACTIVE");
        
        sRes = new SessionResponseDto();
        sRes.setId(2L);
        sRes.setMentorId(11L);
        sRes.setLearnerId(21L);
        sRes.setSkillId(31L);
        sRes.setScheduledAt(now);
        sRes.setDurationMinutes(30);
        sRes.setStatus("PENDING");
        sRes.setRejectionReason("r");
        sRes.setCreatedAt(now);
        sRes.setUpdatedAt(now);
        assertThat(sRes.getId()).isEqualTo(2L);
        assertThat(sRes.getMentorId()).isEqualTo(11L);

        // UserProfileResponseDto
        UserProfileResponseDto uRes = new UserProfileResponseDto(1L, "u", "e", false);
        assertThat(uRes.getUserId()).isEqualTo(1L);
        assertThat(uRes.getIsBlocked()).isFalse();
        
        uRes = new UserProfileResponseDto();
        uRes.setUserId(2L);
        uRes.setUsername("u2");
        uRes.setEmail("e2");
        uRes.setIsBlocked(true);
        assertThat(uRes.getUserId()).isEqualTo(2L);
        assertThat(uRes.getUsername()).isEqualTo("u2");

        // RequestSessionRequestDto
        RequestSessionRequestDto sq = new RequestSessionRequestDto();
        sq.setMentorId(1L);
        sq.setSkillId(2L);
        sq.setScheduledAt(now.plusHours(1));
        sq.setDurationMinutes(45);
        assertThat(sq.getMentorId()).isEqualTo(1L);
        assertThat(sq.getSkillId()).isEqualTo(2L);
        assertThat(sq.getScheduledAt()).isEqualTo(now.plusHours(1));
        assertThat(sq.getDurationMinutes()).isEqualTo(45);
    }

    @Test
    void testAuditLog() {
        AuditLog log = new AuditLog();
        LocalDateTime now = LocalDateTime.now();
        log.setEntityName("Session");
        log.setEntityId(1L);
        log.setAction("CREATE");
        log.setPerformedBy("user");
        log.setDetails("{}");
        
        assertThat(log.getEntityName()).isEqualTo("Session");
        assertThat(log.getEntityId()).isEqualTo(1L);
        assertThat(log.getAction()).isEqualTo("CREATE");
        assertThat(log.getPerformedBy()).isEqualTo("user");
        assertThat(log.getDetails()).isEqualTo("{}");
        assertThat(log.getId()).isNull();
        assertThat(log.getTimestamp()).isNull();
    }
}
