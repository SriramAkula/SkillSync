package com.skillsync.authservice.service;

import com.skillsync.authservice.dto.request.LoginRequest;
import com.skillsync.authservice.dto.request.RegisterRequest;
import com.skillsync.authservice.dto.response.AuthResponse;

public interface AuthService {
	void sendOtp(String email);
	void verifyOtp(String email, String otp);
	AuthResponse register(RegisterRequest request);
	AuthResponse login(LoginRequest request);
	AuthResponse refreshToken(String token);
	void sendForgotPasswordOtp(String email);
	void verifyForgotPasswordOtp(String email, String otp);
	void resetPassword(String email, String newPassword);
}
