package com.skillsync.skill.mapper;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import org.springframework.stereotype.Component;

@Component
public class SkillMapper {

    // CreateSkillRequestDto -> Skill entity
    public Skill toEntity(CreateSkillRequestDto request) {
        Skill skill = new Skill();
        skill.setSkillName(request.getSkillName());
        skill.setDescription(request.getDescription());
        skill.setCategory(request.getCategory());
        return skill;
    }

    // Apply update fields onto existing entity
    public void updateEntity(Skill skill, CreateSkillRequestDto request) {
        skill.setSkillName(request.getSkillName());
        skill.setDescription(request.getDescription());
        skill.setCategory(request.getCategory());
    }

    // Skill entity -> SkillResponseDto
    public SkillResponseDto toDto(Skill skill) {
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
