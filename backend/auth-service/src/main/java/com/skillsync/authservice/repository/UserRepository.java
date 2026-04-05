package com.skillsync.authservice.repository;

import com.skillsync.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used for login
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<User> findByEmail(String email);

    // Used for validation during registration
    @org.springframework.data.jpa.repository.Query("SELECT COUNT(u) > 0 FROM User u WHERE LOWER(u.email) = LOWER(:email)")
    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);
    
    // Optional: If you want to find by username for login instead of email
    Optional<User> findByUsername(String username);
}