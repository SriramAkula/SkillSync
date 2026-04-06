package com.skillsync.user.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO for blocking a user
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserRequest {
	
	@NotBlank(message = "Block reason cannot be empty")
	private String reason;
}
