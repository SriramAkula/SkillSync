package com.skillsync.authservice.repository;

import com.skillsync.authservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Used for login
    Optional<User> findByEmail(String email);

    // Used for validation during registration
    Boolean existsByEmail(String email);

    Boolean existsByUsername(String username);
    
    // Optional: If you want to find by username for login instead of email
    Optional<User> findByUsername(String username);
}