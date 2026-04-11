package com.skillsync.skill.service.query;

import com.skillsync.skill.dto.response.PageResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import com.skillsync.skill.mapper.SkillMapper;
import com.skillsync.skill.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillQueryServiceTest {

    @Mock private SkillRepository skillRepository;
    @Mock private SkillMapper skillMapper;
    @InjectMocks private SkillQueryService skillQueryService;

    private Skill skill;

    @BeforeEach
    void setUp() {
        skill = new Skill();
        skill.setId(1L);
        skill.setSkillName("Java");
        skill.setCategory("Programming");
        skill.setIsActive(true);
    }

    @Test
    void getSkillById_shouldReturnDto_whenExists() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillMapper.toDto(skill)).thenReturn(new SkillResponseDto());

        SkillResponseDto result = skillQueryService.getSkillById(1L);

        assertThat(result).isNotNull();
    }

    @Test
    void getSkillById_shouldThrow_whenNotFound() {
        when(skillRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> skillQueryService.getSkillById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Skill not found");
    }

    @Test
    void getAllActiveSkills_shouldReturnPage() {
        Page<Skill> page = new PageImpl<>(List.of(skill));
        when(skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc(any())).thenReturn(page);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        PageResponse<SkillResponseDto> response = skillQueryService.getAllActiveSkills(0, 10);

        assertThat(response.getContent()).hasSize(1);
    }

    @Test
    void searchSkills_shouldReturnPage() {
        Page<Skill> page = new PageImpl<>(List.of(skill));
        when(skillRepository.searchByName(anyString(), any())).thenReturn(page);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        PageResponse<SkillResponseDto> response = skillQueryService.searchSkills("java", 0, 10);

        assertThat(response.getContent()).hasSize(1);
    }

    @Test
    void getSkillsByCategory_shouldReturnList() {
        when(skillRepository.findByCategory("Programming")).thenReturn(List.of(skill));
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        List<SkillResponseDto> result = skillQueryService.getSkillsByCategory("Programming");

        assertThat(result).hasSize(1);
    }
}
