package com.skillsync.skill.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Create Skill Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSkillRequestDto {

	@NotBlank(message = "Skill name is required")
	@Size(min = 2, max = 100, message = "Skill name must be between 2 and 100 characters")
	private String skillName;

	@Size(max = 500, message = "Description can be maximum 500 characters")
	private String description;

	private String category;
}
