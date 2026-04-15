package com.skillsync.user.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Profile Update Request DTO
 * Validates user profile updates with consistent constraints matched across frontend and backend
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequestDto {

	@NotNull(message = "Username is required")
	@Size(min = 2, max = 50, message = "Username must be between 2 and 50 characters")
	private String username;

	@NotBlank(message = "Name is required")
	@Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
	private String name;

	@Size(max = 500, message = "Bio can be maximum 500 characters")
	private String bio;

	@jakarta.validation.constraints.Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits and contain only numbers")
	private String phoneNumber;

	@Size(max = 500, message = "Skills can be maximum 500 characters")
	private String skills;
}
