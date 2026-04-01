package com.skillsync.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Profile Update Request DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDto {

	@NotBlank(message = "Name is required")
	@Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
	private String name;

	@Size(max = 500, message = "Bio can be maximum 500 characters")
	private String bio;

	@Size(max = 20, message = "Phone number can be maximum 20 characters")
	private String phoneNumber;

	@Size(max = 500, message = "Skills can be maximum 500 characters")
	private String skills;
}
