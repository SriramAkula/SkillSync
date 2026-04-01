package com.skillsync.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API Response Wrapper
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

	private String message;
	private T data;

	public ApiResponse(String message) {
		this.message = message;
	}
}
