package com.skillsync.skill.service.impl;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import com.skillsync.skill.repository.SkillRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillServiceImplTest {

    @Mock private SkillRepository skillRepository;
    @InjectMocks private SkillServiceImpl skillService;

    private Skill skill;
    private CreateSkillRequestDto createRequest;

    @BeforeEach
    void setUp() {
        skill = new Skill();
        skill.setId(1L);
        skill.setSkillName("Java");
        skill.setDescription("Java programming language");
        skill.setCategory("Programming");
        skill.setPopularityScore(100);
        skill.setIsActive(true);
        skill.setCreatedAt(LocalDateTime.now());
        skill.setUpdatedAt(LocalDateTime.now());

        createRequest = new CreateSkillRequestDto("Java", "Java programming language", "Programming");
    }

    // ─── createSkill ─────────────────────────────────────────────────────────

    @Test
    void createSkill_shouldReturnDto_whenValid() {
        when(skillRepository.save(any(Skill.class))).thenReturn(skill);

        SkillResponseDto result = skillService.createSkill(createRequest);

        assertThat(result.getSkillName()).isEqualTo("Java");
        assertThat(result.getCategory()).isEqualTo("Programming");
        assertThat(result.getId()).isEqualTo(1L);
        verify(skillRepository).save(argThat(s ->
                s.getSkillName().equals("Java") &&
                s.getCategory().equals("Programming")
        ));
    }

    @Test
    void createSkill_shouldSetAllFields_whenSaved() {
        when(skillRepository.save(any(Skill.class))).thenReturn(skill);

        SkillResponseDto result = skillService.createSkill(createRequest);

        assertThat(result.getDescription()).isEqualTo("Java programming language");
        assertThat(result.getIsActive()).isTrue();
        assertThat(result.getPopularityScore()).isEqualTo(100);
    }

    @Test
    void createSkill_shouldThrow_whenRepositoryFails() {
        when(skillRepository.save(any())).thenThrow(new RuntimeException("DB error"));

        assertThatThrownBy(() -> skillService.createSkill(createRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("DB error");
    }

    // ─── getSkillById ─────────────────────────────────────────────────────────

    @Test
    void getSkillById_shouldReturnDto_whenExists() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));

        SkillResponseDto result = skillService.getSkillById(1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSkillName()).isEqualTo("Java");
    }

    @Test
    void getSkillById_shouldThrow_whenNotFound() {
        when(skillRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> skillService.getSkillById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Skill not found");
    }

    // ─── getAllActiveSkills ───────────────────────────────────────────────────

    @Test
    void getAllActiveSkills_shouldReturnList_whenSkillsExist() {
        when(skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc())
                .thenReturn(List.of(skill));

        List<SkillResponseDto> result = skillService.getAllActiveSkills();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSkillName()).isEqualTo("Java");
        assertThat(result.get(0).getIsActive()).isTrue();
    }

    @Test
    void getAllActiveSkills_shouldReturnEmpty_whenNoSkills() {
        when(skillRepository.findByIsActiveTrueOrderByPopularityScoreDesc())
                .thenReturn(List.of());

        assertThat(skillService.getAllActiveSkills()).isEmpty();
    }

    // ─── searchSkills ─────────────────────────────────────────────────────────

    @Test
    void searchSkills_shouldReturnMatches_whenKeywordMatches() {
        when(skillRepository.searchByName("java")).thenReturn(List.of(skill));

        List<SkillResponseDto> result = skillService.searchSkills("java");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSkillName()).isEqualTo("Java");
    }

    @Test
    void searchSkills_shouldReturnEmpty_whenNoMatch() {
        when(skillRepository.searchByName("unknown")).thenReturn(List.of());

        assertThat(skillService.searchSkills("unknown")).isEmpty();
    }

    // ─── getSkillsByCategory ──────────────────────────────────────────────────

    @Test
    void getSkillsByCategory_shouldReturnList_whenCategoryExists() {
        when(skillRepository.findByCategory("Programming")).thenReturn(List.of(skill));

        List<SkillResponseDto> result = skillService.getSkillsByCategory("Programming");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCategory()).isEqualTo("Programming");
    }

    @Test
    void getSkillsByCategory_shouldReturnEmpty_whenCategoryNotFound() {
        when(skillRepository.findByCategory("Unknown")).thenReturn(List.of());

        assertThat(skillService.getSkillsByCategory("Unknown")).isEmpty();
    }

    // ─── updateSkill ──────────────────────────────────────────────────────────

    @Test
    void updateSkill_shouldReturnUpdatedDto_whenExists() {
        CreateSkillRequestDto updateRequest = new CreateSkillRequestDto("Python", "Python language", "Programming");
        Skill updatedSkill = new Skill();
        updatedSkill.setId(1L);
        updatedSkill.setSkillName("Python");
        updatedSkill.setDescription("Python language");
        updatedSkill.setCategory("Programming");
        updatedSkill.setPopularityScore(90);
        updatedSkill.setIsActive(true);
        updatedSkill.setCreatedAt(LocalDateTime.now());
        updatedSkill.setUpdatedAt(LocalDateTime.now());

        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any(Skill.class))).thenReturn(updatedSkill);

        SkillResponseDto result = skillService.updateSkill(1L, updateRequest);

        assertThat(result.getSkillName()).isEqualTo("Python");
        verify(skillRepository).save(argThat(s ->
                s.getSkillName().equals("Python") &&
                s.getDescription().equals("Python language")
        ));
    }

    @Test
    void updateSkill_shouldThrow_whenNotFound() {
        when(skillRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> skillService.updateSkill(99L, createRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Skill not found");

        verify(skillRepository, never()).save(any());
    }

    // ─── deleteSkill ──────────────────────────────────────────────────────────

    @Test
    void deleteSkill_shouldSetInactive_whenExists() {
        when(skillRepository.findById(1L)).thenReturn(Optional.of(skill));
        when(skillRepository.save(any())).thenReturn(skill);

        skillService.deleteSkill(1L);

        verify(skillRepository).save(argThat(s -> !s.getIsActive()));
    }

    @Test
    void deleteSkill_shouldThrow_whenNotFound() {
        when(skillRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> skillService.deleteSkill(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Skill not found");

        verify(skillRepository, never()).save(any());
    }
}
