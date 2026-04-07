package com.skillsync.mentor.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorRatingDto {
    private Long mentorId;
    private Double averageRating;
    private Integer totalReviews;
    private Integer totalLearners;
}
