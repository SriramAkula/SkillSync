package com.skillsync.skill.mapper;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.entity.Skill;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SkillMapperTest {

    private final SkillMapper skillMapper = new SkillMapper();

    @Test
    void toEntity_shouldMapCorrectly() {
        CreateSkillRequestDto request = new CreateSkillRequestDto("Java", "Java Description", "Programming");
        Skill result = skillMapper.toEntity(request);

        assertThat(result.getSkillName()).isEqualTo("Java");
        assertThat(result.getDescription()).isEqualTo("Java Description");
        assertThat(result.getCategory()).isEqualTo("Programming");
    }

    @Test
    void updateEntity_shouldUpdateFields() {
        Skill skill = new Skill();
        CreateSkillRequestDto request = new CreateSkillRequestDto("Python", "Python Description", "Data Science");

        skillMapper.updateEntity(skill, request);

        assertThat(skill.getSkillName()).isEqualTo("Python");
        assertThat(skill.getDescription()).isEqualTo("Python Description");
        assertThat(skill.getCategory()).isEqualTo("Data Science");
    }

    @Test
    void toDto_shouldMapAllFields() {
        Skill skill = new Skill();
        skill.setId(1L);
        skill.setSkillName("Java");
        skill.setDescription("Java Description");
        skill.setCategory("Programming");
        skill.setPopularityScore(100);
        skill.setIsActive(true);

        SkillResponseDto result = skillMapper.toDto(skill);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSkillName()).isEqualTo("Java");
        assertThat(result.getDescription()).isEqualTo("Java Description");
        assertThat(result.getCategory()).isEqualTo("Programming");
        assertThat(result.getPopularityScore()).isEqualTo(100);
        assertThat(result.getIsActive()).isTrue();
    }
}
