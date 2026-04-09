package com.skillsync.skill.service.query;

import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.mapper.SkillMapper;
import com.skillsync.skill.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillQueryService {

    private final SkillRepository skillRepository;
    private final SkillMapper skillMapper;

    @Cacheable(value = "skill", key = "#id")
    public SkillResponseDto getSkillById(Long id) {
        log.info("Cache MISS - fetching skillId={} from DB", id);
        return skillRepository.findById(id)
                .map(skillMapper::toDto)
                .orElseThrow(() -> new RuntimeException("Skill not found"));
    }

    @Cacheable(value = "skills")
    public List<SkillResponseDto> getAllActiveSkills() {
        log.info("Cache MISS - fetching all active skills from DB");
        return skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc()
                .stream().map(skillMapper::toDto).collect(Collectors.toList());
    }

    public List<SkillResponseDto> searchSkills(String keyword) {
        log.info("Searching skills with keyword: {}", keyword);
        return skillRepository.searchByName(keyword)
                .stream().map(skillMapper::toDto).collect(Collectors.toList());
    }

    public List<SkillResponseDto> getSkillsByCategory(String category) {
        log.info("Fetching skills for category: {}", category);
        return skillRepository.findByCategory(category)
                .stream().map(skillMapper::toDto).collect(Collectors.toList());
    }
}
