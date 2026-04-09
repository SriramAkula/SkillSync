package com.skillsync.skill.service.command;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import com.skillsync.skill.mapper.SkillMapper;
import com.skillsync.skill.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillCommandService {

    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;

    @Transactional
    @CacheEvict(value = {"skills", "skill"}, allEntries = true)
    public SkillResponseDto createSkill(CreateSkillRequestDto requestDto) {
        log.info("Creating skill: {}", requestDto.getSkillName());
        Skill saved = skillRepository.save(skillMapper.toEntity(requestDto));
        log.info("Skill created with ID: {}", saved.getId());
        return skillMapper.toDto(saved);
    }

    @Transactional
    @CacheEvict(value = {"skills", "skill"}, allEntries = true)
    public SkillResponseDto updateSkill(Long id, CreateSkillRequestDto requestDto) {
        log.info("Updating skill with ID: {}", id);
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        skillMapper.updateEntity(skill, requestDto);
        return skillMapper.toDto(skillRepository.save(skill));
    }

    @Transactional
    @CacheEvict(value = {"skills", "skill"}, allEntries = true)
    public void deleteSkill(Long id) {
        log.info("Deleting skill with ID: {}", id);
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
        skill.setIsActive(false);
        skillRepository.save(skill);
    }
}
