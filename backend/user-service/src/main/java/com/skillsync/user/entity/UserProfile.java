package com.skillsync.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * UserProfile Entity - Extended user information
 * Created when user registers in Auth Service
 */
import com.skillsync.user.audit.Auditable;

@Entity
@Table(name = "user_profiles", uniqueConstraints = {
	@jakarta.persistence.UniqueConstraint(columnNames = "userId")
})
@Data
@lombok.EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile extends Auditable {
	
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Long userId;

	@Column(unique = true)
	private String username;

	@Column(nullable = false, unique = true)
	private String email;

	@Column
	private String role;

	@Column
	private String name;

	@Column(length = 500)
	private String bio;

	@Column
	private String phoneNumber;

	@Column
	private String profileImageUrl;

	@Column
	private String resumeUrl;

	@Column(length = 500)
	private String skills;

	@Column
	private Double rating = 0.0;

	@Column
	private Integer totalReviews = 0;

	@Column(nullable = false)
	private Boolean profileComplete = false;

	// ─── Admin Fields ───────────────────────────────────────────
	@Column(nullable = false)
	private Boolean isBlocked = false;

	@Column(length = 500)
	private String blockReason;

	@Column
	private LocalDateTime blockDate;

	@Column
	private Long blockedBy;
	// ─────────────────────────────────────────────────────────────

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
		this.rating = 0.0;
		this.totalReviews = 0;
		this.profileComplete = false;
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}
}
