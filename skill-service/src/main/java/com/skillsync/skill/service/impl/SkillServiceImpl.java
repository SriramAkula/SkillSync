package com.skillsync.skill.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import com.skillsync.skill.repository.SkillRepository;
import com.skillsync.skill.service.SkillService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Skill Service Implementation
 * Handles skill CRUD and search operations
 * Uses Redis caching for performance
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SkillServiceImpl implements SkillService {

	private final SkillRepository skillRepository;

	@Override
	@Transactional
	@CacheEvict(value = "skills", allEntries = true)
	public SkillResponseDto createSkill(CreateSkillRequestDto requestDto) {
		log.info("Creating skill: {}", requestDto.getSkillName());

		Skill skill = new Skill();
		skill.setSkillName(requestDto.getSkillName());
		skill.setDescription(requestDto.getDescription());
		skill.setCategory(requestDto.getCategory());

		Skill savedSkill = skillRepository.save(skill);
		log.info("Skill created with ID: {}", savedSkill.getId());

		return mapToResponseDto(savedSkill);
	}

	@Override
	@Cacheable(value = "skill", key = "#id")
	public SkillResponseDto getSkillById(Long id) {
		log.info("Cache MISS — fetching skillId={} from DB", id);

		Skill skill = skillRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("Skill not found"));

		return mapToResponseDto(skill);
	}

	@Override
	@Cacheable(value = "skills")
	public List<SkillResponseDto> getAllActiveSkills() {
		log.info("Cache MISS — fetching all active skills from DB");

		return skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc()
			.stream()
			.map(this::mapToResponseDto)
			.collect(Collectors.toList());
	}

	@Override
	public List<SkillResponseDto> searchSkills(String keyword) {
		log.info("Searching skills with keyword: {}", keyword);

		return skillRepository.searchByName(keyword)
			.stream()
			.map(this::mapToResponseDto)
			.collect(Collectors.toList());
	}

	@Override
	public List<SkillResponseDto> getSkillsByCategory(String category) {
		log.info("Fetching skills for category: {}", category);

		return skillRepository.findByCategory(category)
			.stream()
			.map(this::mapToResponseDto)
			.collect(Collectors.toList());
	}

	@Override
	@Transactional
	@CacheEvict(value = {"skills", "skill"}, allEntries = true)
	public SkillResponseDto updateSkill(Long id, CreateSkillRequestDto requestDto) {
		log.info("Updating skill with ID: {}", id);

		Skill skill = skillRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("Skill not found"));

		skill.setSkillName(requestDto.getSkillName());
		skill.setDescription(requestDto.getDescription());
		skill.setCategory(requestDto.getCategory());

		Skill updatedSkill = skillRepository.save(skill);
		return mapToResponseDto(updatedSkill);
	}

	@Override
	@Transactional
	@CacheEvict(value = {"skills", "skill"}, allEntries = true)
	public void deleteSkill(Long id) {
		log.info("Deleting skill with ID: {}", id);

		Skill skill = skillRepository.findById(id)
			.orElseThrow(() -> new RuntimeException("Skill not found"));

		skill.setIsActive(false);
		skillRepository.save(skill);
	}

	// =============================================
	// HELPER METHODS
	// =============================================

	private SkillResponseDto mapToResponseDto(Skill skill) {
		SkillResponseDto dto = new SkillResponseDto();
		dto.setId(skill.getId());
		dto.setSkillName(skill.getSkillName());
		dto.setDescription(skill.getDescription());
		dto.setCategory(skill.getCategory());
		dto.setPopularityScore(skill.getPopularityScore());
		dto.setIsActive(skill.getIsActive());
		dto.setCreatedAt(skill.getCreatedAt());
		dto.setUpdatedAt(skill.getUpdatedAt());
		return dto;
	}
}
