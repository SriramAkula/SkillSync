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
public class ReviewSubmittedEvent implements Serializable {
    
    private static final long serialVersionUID = 1L;
    private Long reviewId;
    private Long mentorId;
    private Long learnerId;
    private Integer rating;
    private String comment;
}
