package com.skillsync.notification;

import com.skillsync.notification.client.MentorProfileData;
import com.skillsync.notification.client.MentorProfileResponse;
import com.skillsync.notification.dto.UserDTO;
import com.skillsync.notification.dto.UserProfileResponse;
import com.skillsync.notification.dto.ApiResponse;
import com.skillsync.notification.event.*;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventAndDtoTest {

    @Test
    void testEvents() {
        LocalDateTime now = LocalDateTime.now();

        MentorApprovedEvent e1 = new MentorApprovedEvent(1L, 101L, "Test Mentor");
        assertThat(e1.getUserId()).isEqualTo(101L);
        e1.setUserId(2L);
        assertThat(e1.getUserId()).isEqualTo(2L);

        ReviewSubmittedEvent e2 = new ReviewSubmittedEvent();
        e2.setMentorId(1L);
        e2.setRating(5);
        e2.setComment("c");
        assertThat(e2.getMentorId()).isEqualTo(1L);
        assertThat(e2.getRating()).isEqualTo(5);
        assertThat(e2.getComment()).isEqualTo("c");

        SessionAcceptedEvent e3 = new SessionAcceptedEvent();
        e3.setLearnerId(1L);
        assertThat(e3.getLearnerId()).isEqualTo(1L);

        SessionCancelledEvent e4 = new SessionCancelledEvent();
        e4.setMentorId(1L);
        e4.setLearnerId(2L);
        assertThat(e4.getMentorId()).isEqualTo(1L);
        assertThat(e4.getLearnerId()).isEqualTo(2L);

        SessionRejectedEvent e5 = new SessionRejectedEvent();
        e5.setLearnerId(1L);
        e5.setRejectionReason("r");
        assertThat(e5.getLearnerId()).isEqualTo(1L);
        assertThat(e5.getRejectionReason()).isEqualTo("r");

        SessionRequestedEvent e6 = new SessionRequestedEvent();
        e6.setMentorId(1L);
        e6.setScheduledAt(now);
        e6.setDurationMinutes(30);
        assertThat(e6.getMentorId()).isEqualTo(1L);
        assertThat(e6.getScheduledAt()).isEqualTo(now);
        assertThat(e6.getDurationMinutes()).isEqualTo(30);
    }

    @Test
    void testClientDtos() {
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setEmail("e");
        user.setFirstName("f");
        user.setLastName("l");
        user.setUsername("u");
        assertThat(user.getId()).isEqualTo(1L);
        assertThat(user.getEmail()).isEqualTo("e");
        assertThat(user.getFirstName()).isEqualTo("f");
        assertThat(user.getLastName()).isEqualTo("l");
        assertThat(user.getUsername()).isEqualTo("u");

        UserProfileResponse res = new UserProfileResponse("m", user);
        res.setMessage("m2");
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
    }
}
