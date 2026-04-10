package com.skillsync.skill.service.impl;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.service.SkillService;
import com.skillsync.skill.service.command.SkillCommandService;
import com.skillsync.skill.service.query.SkillQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SkillServiceImpl implements SkillService {

    private final SkillCommandService skillCommandService;
    private final SkillQueryService skillQueryService;

    @Override
    public SkillResponseDto createSkill(CreateSkillRequestDto requestDto) {
        return skillCommandService.createSkill(requestDto);
    }

    @Override
    public SkillResponseDto updateSkill(Long id, CreateSkillRequestDto requestDto) {
        return skillCommandService.updateSkill(id, requestDto);
    }

    @Override
    public void deleteSkill(Long id) {
        skillCommandService.deleteSkill(id);
    }

    @Override
    public SkillResponseDto getSkillById(Long id) {
        return skillQueryService.getSkillById(id);
    }

    @Override
    public PageResponse<SkillResponseDto> getAllActiveSkills(int page, int size) {
        return skillQueryService.getAllActiveSkills(page, size);
    }

    @Override
    public PageResponse<SkillResponseDto> searchSkills(String keyword, int page, int size) {
        return skillQueryService.searchSkills(keyword, page, size);
    }

    @Override
    public List<SkillResponseDto> getSkillsByCategory(String category) {
        return skillQueryService.getSkillsByCategory(category);
    }

    @Override
    public SkillResponseDto updatePopularity(Long id, boolean increment) {
        return skillCommandService.updatePopularity(id, increment);
    }
}
