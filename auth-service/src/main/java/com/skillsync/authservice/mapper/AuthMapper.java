package com.skillsync.authservice.mapper;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;
import com.skillsync.authservice.entity.User;

@Component
public class AuthMapper {
	//Convert RegisterRequest to user
	public User toUser(RegisterRequest request, PasswordEncoder encoder)
	{
		User user = new User();
		user.setEmail(request.email());
		user.setPassword(encoder.encode(request.password()));
		user.setIsActive(true);
		return user;
	}
	
	//Convert token to AuthResponse
	public AuthResponse toAuthResponse(String token, List<String> roles)
	{
		return new AuthResponse(token,roles);
	}
}
