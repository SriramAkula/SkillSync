package com.skillsync.user.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.skillsync.user.entity.UserProfile;

/**
 * UserProfile Repository
 */
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

	Optional<UserProfile> findByUserId(Long userId);

	Optional<UserProfile> findByEmail(String email);
	
	List<UserProfile> findByIsBlockedTrue();

	boolean existsByUsername(String username);

	boolean existsByUsernameAndUserIdNot(String username, Long userId);
}
