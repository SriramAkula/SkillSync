package com.skillsync.skill.service;

import java.util.List;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.PageResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;

/**
 * Skill Service Interface
 */
public interface SkillService {

	SkillResponseDto createSkill(CreateSkillRequestDto requestDto);

	SkillResponseDto getSkillById(Long id);

	PageResponse<SkillResponseDto> getAllActiveSkills(int page, int size);

	PageResponse<SkillResponseDto> searchSkills(String keyword, int page, int size);

	List<SkillResponseDto> getSkillsByCategory(String category);

	SkillResponseDto updateSkill(Long id, CreateSkillRequestDto requestDto);

	void deleteSkill(Long id);
	
	SkillResponseDto updatePopularity(Long id, boolean increment);
}
