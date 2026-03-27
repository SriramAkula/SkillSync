package com.skillsync.skill.dto.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Skill Response DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SkillResponseDto {

	private Long id;
	private String skillName;
	private String description;
	private String category;
	private Integer popularityScore;
	private Boolean isActive;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}
