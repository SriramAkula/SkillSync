package com.skillsync.skill.service.command;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
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

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillCommandServiceTest {

    @Mock private SkillRepository skillRepository;
    @Mock private SkillMapper skillMapper;
    @InjectMocks private SkillCommandService skillCommandService;

    private Skill skill;
    private CreateSkillRequestDto requestDto;

    @BeforeEach
    void setUp() {
        skill = new Skill();
        skill.setId(1L);
        skill.setSkillName("Java");
        skill.setPopularityScore(10);

        requestDto = new CreateSkillRequestDto("Java", "Java Description", "Programming");
    }

    @Test
    void createSkill_shouldSaveAndReturnDto() {
        when(skillMapper.toEntity(any())).thenReturn(skill);
        when(skillRepository.save(any())).thenReturn(skill);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        SkillResponseDto result = skillCommandService.createSkill(requestDto);

        assertThat(result).isNotNull();
        verify(skillRepository).save(skill);
    }

    @Test
    void updateSkill_shouldUpdateAndReturnDto_whenExists() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any())).thenReturn(skill);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        SkillResponseDto result = skillCommandService.updateSkill(1L, requestDto);

        assertThat(result).isNotNull();
        verify(skillMapper).updateEntity(skill, requestDto);
    }

    @Test
    void updateSkill_shouldThrow_whenNotFound() {
        when(skillRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> skillCommandService.updateSkill(99L, requestDto))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Skill not found");
    }

    @Test
    void deleteSkill_shouldSetInactive() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        
        skillCommandService.deleteSkill(1L);

        assertThat(skill.getIsActive()).isFalse();
        verify(skillRepository).save(skill);
    }

    @Test
    void updatePopularity_shouldIncrement() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any())).thenReturn(skill);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        skillCommandService.updatePopularity(1L, true);

        assertThat(skill.getPopularityScore()).isEqualTo(11);
    }

    @Test
    void updatePopularity_shouldDecrement() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any())).thenReturn(skill);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        skillCommandService.updatePopularity(1L, false);

        assertThat(skill.getPopularityScore()).isEqualTo(9);
    }

    @Test
    void updatePopularity_shouldNotDecrementBelowZero() {
        skill.setPopularityScore(0);
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any())).thenReturn(skill);
        when(skillMapper.toDto(any())).thenReturn(new SkillResponseDto());

        skillCommandService.updatePopularity(1L, false);

        assertThat(skill.getPopularityScore()).isEqualTo(0);
    }
}
