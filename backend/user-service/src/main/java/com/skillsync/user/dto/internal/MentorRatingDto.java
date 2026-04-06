package com.skillsync.user.dto.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MentorRatingDto {
    private Long mentorId;
    private Double averageRating;
    private Integer totalReviews;
}
