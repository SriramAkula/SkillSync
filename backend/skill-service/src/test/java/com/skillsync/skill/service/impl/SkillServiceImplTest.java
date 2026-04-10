package com.skillsync.skill.service.impl;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.PageResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.service.command.SkillCommandService;
import com.skillsync.skill.service.query.SkillQueryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SkillServiceImplTest {

    @Mock private SkillCommandService skillCommandService;
    @Mock private SkillQueryService skillQueryService;
    @InjectMocks private SkillServiceImpl skillService;

    private SkillResponseDto skillResponse;
    private CreateSkillRequestDto createRequest;

    @BeforeEach
    void setUp() {
        skillResponse = new SkillResponseDto();
        skillResponse.setId(1L);
        skillResponse.setSkillName("Java");
        skillResponse.setCategory("Programming");
        skillResponse.setIsActive(true);

        createRequest = new CreateSkillRequestDto("Java", "Java programming language", "Programming");
    }

    @Test
    void createSkill_shouldDelegateToCommandService() {
        when(skillCommandService.createSkill(any())).thenReturn(skillResponse);

        SkillResponseDto result = skillService.createSkill(createRequest);

        assertThat(result).isEqualTo(skillResponse);
        verify(skillCommandService).createSkill(createRequest);
    }

    @Test
    void updateSkill_shouldDelegateToCommandService() {
        when(skillCommandService.updateSkill(anyLong(), any())).thenReturn(skillResponse);

        SkillResponseDto result = skillService.updateSkill(1L, createRequest);

        assertThat(result).isEqualTo(skillResponse);
        verify(skillCommandService).updateSkill(1L, createRequest);
    }

    @Test
    void deleteSkill_shouldDelegateToCommandService() {
        doNothing().when(skillCommandService).deleteSkill(anyLong());

        skillService.deleteSkill(1L);

        verify(skillCommandService).deleteSkill(1L);
    }

    @Test
    void getSkillById_shouldDelegateToQueryService() {
        when(skillQueryService.getSkillById(anyLong())).thenReturn(skillResponse);

        SkillResponseDto result = skillService.getSkillById(1L);

        assertThat(result).isEqualTo(skillResponse);
        verify(skillQueryService).getSkillById(1L);
    }

    @Test
    void getAllActiveSkills_shouldDelegateToQueryService() {
        PageResponse<SkillResponseDto> pageResponse = PageResponse.<SkillResponseDto>builder()
                .content(List.of(skillResponse))
                .currentPage(0)
                .totalElements(1L)
                .build();

        when(skillQueryService.getAllActiveSkills(anyInt(), anyInt())).thenReturn(pageResponse);

        PageResponse<SkillResponseDto> result = skillService.getAllActiveSkills(0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(skillQueryService).getAllActiveSkills(0, 10);
    }

    @Test
    void searchSkills_shouldDelegateToQueryService() {
        PageResponse<SkillResponseDto> pageResponse = PageResponse.<SkillResponseDto>builder()
                .content(List.of(skillResponse))
                .currentPage(0)
                .totalElements(1L)
                .build();

        when(skillQueryService.searchSkills(anyString(), anyInt(), anyInt())).thenReturn(pageResponse);

        PageResponse<SkillResponseDto> result = skillService.searchSkills("java", 0, 10);

        assertThat(result).isEqualTo(pageResponse);
        verify(skillQueryService).searchSkills("java", 0, 10);
    }

    @Test
    void getSkillsByCategory_shouldDelegateToQueryService() {
        when(skillQueryService.getSkillsByCategory(anyString())).thenReturn(List.of(skillResponse));

        List<SkillResponseDto> result = skillService.getSkillsByCategory("Programming");

        assertThat(result).hasSize(1);
        verify(skillQueryService).getSkillsByCategory("Programming");
    }

    @Test
    void updatePopularity_shouldDelegateToCommandService() {
        when(skillCommandService.updatePopularity(anyLong(), anyBoolean())).thenReturn(skillResponse);

        SkillResponseDto result = skillService.updatePopularity(1L, true);

        assertThat(result).isEqualTo(skillResponse);
        verify(skillCommandService).updatePopularity(1L, true);
    }
}
