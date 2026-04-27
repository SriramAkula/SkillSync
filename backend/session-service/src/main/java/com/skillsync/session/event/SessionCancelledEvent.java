package com.skillsync.session.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionCancelledEvent {
    private Long sessionId;
    private Long mentorId;
    private Long learnerId;
}
