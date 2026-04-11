package com.skillsync.mentor.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.*;

/**
 * Mentor Profile Entity
 */
import com.skillsync.mentor.audit.Auditable;

@Entity
@Table(name = "mentor_profiles", uniqueConstraints = {
		@UniqueConstraint(columnNames = "userId")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MentorProfile extends Auditable {

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

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
