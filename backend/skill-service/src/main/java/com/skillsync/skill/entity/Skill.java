package com.skillsync.skill.entity;

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
 * Skill Entity
 */
import com.skillsync.skill.audit.Auditable;

@Entity
@Table(name = "skills", uniqueConstraints = {
	@jakarta.persistence.UniqueConstraint(columnNames = "skillName")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Skill extends Auditable {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String skillName;

	@Column(length = 500)
	private String description;

	@Column
	private String category;

	@Column(nullable = false)
	private Integer popularityScore = 0;

	@Column(nullable = false)
	private Boolean isActive = true;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	protected void onCreate() {
		this.createdAt = LocalDateTime.now();
		this.updatedAt = LocalDateTime.now();
		this.isActive = true;
		this.popularityScore = 0;
	}

	@PreUpdate
	protected void onUpdate() {
		this.updatedAt = LocalDateTime.now();
	}
}
