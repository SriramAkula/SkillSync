package com.skillsync.skill.service.query;

import com.skillsync.skill.dto.response.PageResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.mapper.SkillMapper;
import com.skillsync.skill.repository.SkillRepository;
import com.skillsync.skill.entity.Skill;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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

    @Cacheable(value = "skills", key = "'p' + #page + '_s' + #size")
    public PageResponse<SkillResponseDto> getAllActiveSkills(int page, int size) {
        log.info("Cache MISS - fetching active skills from DB - page: {}, size: {}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Skill> skillPage = skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc(pageable);
        return toPageResponse(skillPage);
    }

    public PageResponse<SkillResponseDto> searchSkills(String keyword, int page, int size) {
        log.info("Searching skills with keyword: {}, page: {}, size: {}", keyword, page, size);
        Pageable pageable = PageRequest.of(page, size);
        Page<Skill> skillPage = skillRepository.searchByName(keyword, pageable);
        return toPageResponse(skillPage);
    }

    private PageResponse<SkillResponseDto> toPageResponse(Page<Skill> page) {
        List<SkillResponseDto> content = page.getContent().stream()
                .map(skillMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<SkillResponseDto>builder()
                .content(content)
                .currentPage(page.getNumber())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .pageSize(page.getSize())
                .build();
    }

    public List<SkillResponseDto> getSkillsByCategory(String category) {
        log.info("Fetching skills for category: {}", category);
        return skillRepository.findByCategory(category)
                .stream().map(skillMapper::toDto).collect(Collectors.toList());
    }
}
