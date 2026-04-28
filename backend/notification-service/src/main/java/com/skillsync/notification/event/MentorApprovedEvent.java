package com.skillsync.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorApprovedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long mentorId;
    private Long userId;
    private String mentorName;
}
