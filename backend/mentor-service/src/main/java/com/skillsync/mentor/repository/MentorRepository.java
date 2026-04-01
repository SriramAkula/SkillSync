package com.skillsync.mentor.repository;

import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MentorRepository extends JpaRepository<MentorProfile, Long> {

    Optional<MentorProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    List<MentorProfile> findBySpecializationContainingIgnoreCase(String specialization);

    @Query("SELECT m FROM MentorProfile m WHERE m.status = :status ORDER BY m.rating DESC")
    List<MentorProfile> findByStatus(MentorStatus status);

    @Query("SELECT m FROM MentorProfile m WHERE m.isApproved = true ORDER BY m.rating DESC")
    List<MentorProfile> findAllApprovedMentors();

    @Query("SELECT m FROM MentorProfile m WHERE m.status = 'PENDING' ORDER BY m.createdAt ASC")
    List<MentorProfile> findPendingApplications();

    @Query("SELECT m FROM MentorProfile m WHERE LOWER(m.specialization) LIKE LOWER(CONCAT('%', :skill, '%')) AND m.isApproved = true")
    List<MentorProfile> searchBySpecialization(String skill);
}
