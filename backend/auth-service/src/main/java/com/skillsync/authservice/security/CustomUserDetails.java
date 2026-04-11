package com.skillsync.authservice.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.skillsync.authservice.entity.User;

public class CustomUserDetails implements UserDetails{

	private final String email;
	private final String password;
	private final boolean isActive;
	
	public CustomUserDetails(User user)
	{
		this.email = user.getEmail();
		this.password = user.getPassword();
		this.isActive = user.getIsActive();
	}
	
	//Convert UserRole to 
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public String getPassword() {
		return password;
	}

	@Override
	public String getUsername() {
		return email;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return isActive;
	}
}
