package com.skillsync.review.dto.response;

public class MentorRatingDto {
    private Long mentorId;
    private Double averageRating;
    private Integer totalReviews;
    private Integer totalLearners;

    public MentorRatingDto() {
    }

    public MentorRatingDto(Long mentorId, Double averageRating, Integer totalReviews, Integer totalLearners) {
        this.mentorId = mentorId;
        this.averageRating = averageRating;
        this.totalReviews = totalReviews;
        this.totalLearners = totalLearners;
    }

    public Long getMentorId() {
        return mentorId;
    }

    public void setMentorId(Long mentorId) {
        this.mentorId = mentorId;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Integer getTotalLearners() {
        return totalLearners;
    }

    public void setTotalLearners(Integer totalLearners) {
        this.totalLearners = totalLearners;
    }

    public static MentorRatingDtoBuilder builder() {
        return new MentorRatingDtoBuilder();
    }

    public static class MentorRatingDtoBuilder {
        private Long mentorId;
        private Double averageRating;
        private Integer totalReviews;
        private Integer totalLearners;

        public MentorRatingDtoBuilder mentorId(Long mentorId) {
            this.mentorId = mentorId;
            return this;
        }

        public MentorRatingDtoBuilder averageRating(Double averageRating) {
            this.averageRating = averageRating;
            return this;
        }

        public MentorRatingDtoBuilder totalReviews(Integer totalReviews) {
            this.totalReviews = totalReviews;
            return this;
        }

        public MentorRatingDtoBuilder totalLearners(Integer totalLearners) {
            this.totalLearners = totalLearners;
            return this;
        }

        public MentorRatingDto build() {
            return new MentorRatingDto(this.mentorId, this.averageRating, this.totalReviews, this.totalLearners);
        }
    }
}
