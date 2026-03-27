package com.skillsync.mentor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mentor Profile Entity
 */
@Entity
@Table(name = "mentor_profiles", uniqueConstraints = {
		@UniqueConstraint(columnNames = "userId")
})
public class MentorProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private MentorStatus status = MentorStatus.PENDING;

	@Column(nullable = false)
	private Boolean isApproved = false;

	@Column
	private Long approvedBy;

	@Column
	private LocalDateTime approvalDate;

	@Column(nullable = false)
	private String specialization;

	@Column(nullable = false)
	private Integer yearsOfExperience;

	@Column(nullable = false)
	private Double hourlyRate;

	@Enumerated(EnumType.STRING)
	private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

	@Column
	private Double rating = 0.0;

	@Column
	private Integer totalStudents = 0;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
		this.isApproved = false;
		this.rating = 0.0;
		this.totalStudents = 0;
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	// Manual Getters and Setters
	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public MentorStatus getStatus() { return status; }
	public void setStatus(MentorStatus status) { this.status = status; }
	public Boolean getIsApproved() { return isApproved; }
	public void setIsApproved(Boolean isApproved) { this.isApproved = isApproved; }
	public Long getApprovedBy() { return approvedBy; }
	public void setApprovedBy(Long approvedBy) { this.approvedBy = approvedBy; }
	public LocalDateTime getApprovalDate() { return approvalDate; }
	public void setApprovalDate(LocalDateTime approvalDate) { this.approvalDate = approvalDate; }
	public String getSpecialization() { return specialization; }
	public void setSpecialization(String specialization) { this.specialization = specialization; }
	public Integer getYearsOfExperience() { return yearsOfExperience; }
	public void setYearsOfExperience(Integer yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
	public Double getHourlyRate() { return hourlyRate; }
	public void setHourlyRate(Double hourlyRate) { this.hourlyRate = hourlyRate; }
	public AvailabilityStatus getAvailabilityStatus() { return availabilityStatus; }
	public void setAvailabilityStatus(AvailabilityStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }
	public Double getRating() { return rating; }
	public void setRating(Double rating) { this.rating = rating; }
	public Integer getTotalStudents() { return totalStudents; }
	public void setTotalStudents(Integer totalStudents) { this.totalStudents = totalStudents; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
	public LocalDateTime getUpdatedAt() { return updatedAt; }
	public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
