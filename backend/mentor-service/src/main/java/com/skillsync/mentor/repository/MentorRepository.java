package com.skillsync.mentor.repository;

import com.skillsync.mentor.entity.MentorProfile;
import com.skillsync.mentor.entity.MentorStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    Page<MentorProfile> findByStatus(MentorStatus status, Pageable pageable);

    @Query("SELECT m FROM MentorProfile m WHERE m.isApproved = true ORDER BY m.rating DESC")
    Page<MentorProfile> findAllApprovedMentors(Pageable pageable);

    @Query("SELECT m FROM MentorProfile m WHERE m.status = 'PENDING' ORDER BY m.createdAt ASC")
    Page<MentorProfile> findPendingApplications(Pageable pageable);

    @Query("SELECT m FROM MentorProfile m WHERE LOWER(m.specialization) LIKE LOWER(CONCAT('%', :skill, '%')) AND m.isApproved = true")
    List<MentorProfile> searchBySpecialization(String skill);

    @Query("SELECT m FROM MentorProfile m WHERE m.isApproved = true " +
           "AND (:skill IS NULL OR :skill = '' OR LOWER(m.specialization) LIKE LOWER(CONCAT('%', :skill, '%'))) " +
           "AND (:minExperience IS NULL OR m.yearsOfExperience >= :minExperience) " +
           "AND (:maxExperience IS NULL OR m.yearsOfExperience <= :maxExperience) " +
           "AND (:maxRate IS NULL OR m.hourlyRate <= :maxRate) " +
           "AND (:minRating IS NULL OR m.rating >= :minRating) " +
           "ORDER BY m.rating DESC")
    Page<MentorProfile> searchMentorsWithFilters(
            @org.springframework.data.repository.query.Param("skill") String skill,
            @org.springframework.data.repository.query.Param("minExperience") Integer minExperience,
            @org.springframework.data.repository.query.Param("maxExperience") Integer maxExperience,
            @org.springframework.data.repository.query.Param("maxRate") Double maxRate,
            @org.springframework.data.repository.query.Param("minRating") Double minRating,
            Pageable pageable);
}
