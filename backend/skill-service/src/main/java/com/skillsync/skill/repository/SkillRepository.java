package com.skillsync.skill.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.skillsync.skill.entity.Skill;

/**
 * Skill Repository
 */
@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

	Page<Skill> findByIsActiveTrueOrderByPopularityScoreDesc(Pageable pageable);

	@Query("SELECT s FROM Skill s WHERE LOWER(s.skillName) LIKE LOWER(CONCAT('%', ?1, '%')) AND s.isActive = true")
	Page<Skill> searchByName(String skillName, Pageable pageable);

	List<Skill> findByCategory(String category);
}
