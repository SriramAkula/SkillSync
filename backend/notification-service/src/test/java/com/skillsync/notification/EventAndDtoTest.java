package com.skillsync.notification;

import com.skillsync.notification.client.MentorProfileData;
import com.skillsync.notification.client.MentorProfileResponse;
import com.skillsync.notification.dto.UserDTO;
import com.skillsync.notification.dto.UserProfileResponse;
import com.skillsync.notification.dto.ApiResponse;
import com.skillsync.notification.event.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EventAndDtoTest {

    @Test
    void testEvents() {
        LocalDateTime now = LocalDateTime.now();

        // 1. MentorApprovedEvent
        MentorApprovedEvent e1 = new MentorApprovedEvent(1L, 101L, "Mentor A");
        assertThat(e1.getMentorId()).isEqualTo(1L);
        assertThat(e1.getUserId()).isEqualTo(101L);
        assertThat(e1.getMentorName()).isEqualTo("Mentor A");
        e1.setMentorId(2L);
        e1.setUserId(102L);
        e1.setMentorName("Mentor B");
        assertThat(e1.getMentorId()).isEqualTo(2L);
        assertThat(e1.getUserId()).isEqualTo(102L);
        assertThat(e1.getMentorName()).isEqualTo("Mentor B");

        // 2. ReviewSubmittedEvent
        ReviewSubmittedEvent e2 = new ReviewSubmittedEvent(10L, 1L, 2L, 5, "Great!");
        assertThat(e2.getReviewId()).isEqualTo(10L);
        assertThat(e2.getMentorId()).isEqualTo(1L);
        assertThat(e2.getLearnerId()).isEqualTo(2L);
        assertThat(e2.getRating()).isEqualTo(5);
        assertThat(e2.getComment()).isEqualTo("Great!");
        e2.setReviewId(11L);
        e2.setLearnerId(3L);
        assertThat(e2.getReviewId()).isEqualTo(11L);
        assertThat(e2.getLearnerId()).isEqualTo(3L);

        // 3. SessionAcceptedEvent
        SessionAcceptedEvent e3 = new SessionAcceptedEvent(20L, 1L, 2L);
        assertThat(e3.getSessionId()).isEqualTo(20L);
        assertThat(e3.getMentorId()).isEqualTo(1L);
        assertThat(e3.getLearnerId()).isEqualTo(2L);
        e3.setSessionId(21L);
        e3.setMentorId(3L);
        assertThat(e3.getSessionId()).isEqualTo(21L);
        assertThat(e3.getMentorId()).isEqualTo(3L);

        // 4. SessionCancelledEvent
        SessionCancelledEvent e4 = new SessionCancelledEvent(30L, 1L, 2L);
        assertThat(e4.getSessionId()).isEqualTo(30L);
        assertThat(e4.getMentorId()).isEqualTo(1L);
        assertThat(e4.getLearnerId()).isEqualTo(2L);
        e4.setSessionId(31L);
        assertThat(e4.getSessionId()).isEqualTo(31L);

        // 5. SessionRejectedEvent
        SessionRejectedEvent e5 = new SessionRejectedEvent(40L, 1L, 2L, "Busy");
        assertThat(e5.getSessionId()).isEqualTo(40L);
        assertThat(e5.getMentorId()).isEqualTo(1L);
        assertThat(e5.getLearnerId()).isEqualTo(2L);
        assertThat(e5.getRejectionReason()).isEqualTo("Busy");
        e5.setSessionId(41L);
        e5.setMentorId(3L);
        assertThat(e5.getSessionId()).isEqualTo(41L);
        assertThat(e5.getMentorId()).isEqualTo(3L);

        // 6. SessionRequestedEvent
        SessionRequestedEvent e6 = new SessionRequestedEvent(50L, 1L, 2L, now, 60);
        assertThat(e6.getSessionId()).isEqualTo(50L);
        assertThat(e6.getMentorId()).isEqualTo(1L);
        assertThat(e6.getLearnerId()).isEqualTo(2L);
        assertThat(e6.getScheduledAt()).isEqualTo(now);
        assertThat(e6.getDurationMinutes()).isEqualTo(60);
        e6.setSessionId(51L);
        e6.setLearnerId(3L);
        assertThat(e6.getSessionId()).isEqualTo(51L);
        assertThat(e6.getLearnerId()).isEqualTo(3L);
    }

    @Test
    void testClientDtos() {
        UserDTO user = UserDTO.builder()
                .id(1L)
                .email("e")
                .firstName("f")
                .lastName("l")
                .username("u")
                .build();
        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("e");
        assertThat(user.getFirstName()).isEqualTo("f");
        assertThat(user.getLastName()).isEqualTo("l");
        assertThat(user.getUsername()).isEqualTo("u");
        
        user.setId(2L);
        user.setEmail("e2");
        assertThat(user.getId()).isEqualTo(2L);
        assertThat(user.getEmail()).isEqualTo("e2");

        UserProfileResponse res = new UserProfileResponse("m", user);
        res.setMessage("m2");
        res.setData(user);
        assertThat(res.getMessage()).isEqualTo("m2");
        assertThat(res.getData()).isEqualTo(user);

        MentorProfileData mData = new MentorProfileData();
        mData.setUserId(1L);
        mData.setId(2L);
        mData.setStatus("ACTIVE");
        mData.setIsApproved(true);
        mData.setSpecialization("Java");
        mData.setYearsOfExperience(5);
        mData.setHourlyRate(50.0);
        mData.setRating(4.8);
        mData.setTotalStudents(100);
        mData.setAvailabilityStatus("AVAILABLE");
        
        assertThat(mData.getUserId()).isEqualTo(1L);
        assertThat(mData.getId()).isEqualTo(2L);
        assertThat(mData.getStatus()).isEqualTo("ACTIVE");
        assertThat(mData.getIsApproved()).isTrue();
        assertThat(mData.getSpecialization()).isEqualTo("Java");
        assertThat(mData.getYearsOfExperience()).isEqualTo(5);
        assertThat(mData.getHourlyRate()).isEqualTo(50.0);
        assertThat(mData.getRating()).isEqualTo(4.8);
        assertThat(mData.getTotalStudents()).isEqualTo(100);
        assertThat(mData.getAvailabilityStatus()).isEqualTo("AVAILABLE");

        MentorProfileResponse mRes = new MentorProfileResponse(true, mData, "m", 200);
        mRes.setData(mData);
        mRes.setMessage("m2");
        mRes.setSuccess(false);
        mRes.setStatusCode(400);
        assertThat(mRes.getSuccess()).isFalse();
        assertThat(mRes.getData()).isEqualTo(mData);
        assertThat(mRes.getMessage()).isEqualTo("m2");
        assertThat(mRes.getStatusCode()).isEqualTo(400);
    }

    @Test
    void testApiResponse() {
        ApiResponse<String> res = ApiResponse.ok("d", "m");
        assertThat(res.getData()).isEqualTo("d");
        assertThat(res.getMessage()).isEqualTo("m");
        assertThat(res.getSuccess()).isTrue();
        
        ApiResponse<Void> res2 = ApiResponse.error("error", 500);
        assertThat(res2.getMessage()).isEqualTo("error");
        assertThat(res2.getStatusCode()).isEqualTo(500);
        assertThat(res2.getSuccess()).isFalse();
        
        ApiResponse<String> res3 = ApiResponse.<String>builder()
                .success(true)
                .data("data")
                .message("msg")
                .statusCode(200)
                .build();
        assertThat(res3.getData()).isEqualTo("data");
    }

    @Test
    void testPageResponse() {
        com.skillsync.notification.dto.response.PageResponse<String> page = com.skillsync.notification.dto.response.PageResponse.<String>builder()
                .content(List.of("a", "b"))
                .totalElements(2L)
                .totalPages(1)
                .pageSize(10)
                .currentPage(0)
                .build();
        
        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(2L);
        assertThat(page.getTotalPages()).isEqualTo(1);
        assertThat(page.getPageSize()).isEqualTo(10);
        assertThat(page.getCurrentPage()).isEqualTo(0);

        page.setContent(List.of("c"));
        page.setTotalElements(1L);
        page.setTotalPages(1);
        page.setPageSize(10);
        page.setCurrentPage(0);
        assertThat(page.getContent()).containsExactly("c");
    }
}
