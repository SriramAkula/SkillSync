package com.skillsync.group.service.query;

import static org.junit.jupiter.api.Assertions.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.entity.Group;
import com.skillsync.group.mapper.GroupMapper;
import com.skillsync.group.repository.GroupMemberRepository;
import com.skillsync.group.repository.GroupRepository;

@ExtendWith(MockitoExtension.class)
class GroupQueryServiceTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private GroupMapper groupMapper;

    @InjectMocks private GroupQueryService groupQueryService;

    private Group group;
    private GroupResponseDto groupResponse;

    @BeforeEach
    void setUp() {
        group = new Group();
        group.setId(1L);
        group.setName("Java Group");
        group.setIsActive(true);

        groupResponse = GroupResponseDto.builder()
                .id(1L).name("Java Group").isActive(true).build();
    }

    @Test
    void getGroupDetails_ShouldReturnDto_WhenFound() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(3);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 100L)).thenReturn(Optional.empty());
        when(groupMapper.toDto(group, 3, false)).thenReturn(groupResponse);

        GroupResponseDto response = groupQueryService.getGroupDetails(1L, 100L);

        assertNotNull(response);
        assertEquals("Java Group", response.getName());
    }

    @Test
    void getGroupsBySkill_ShouldReturnPage() {
        org.springframework.data.domain.Page<Group> mockPage = mock(org.springframework.data.domain.Page.class);
        when(mockPage.getContent()).thenReturn(List.of(group));
        when(mockPage.getNumber()).thenReturn(0);
        when(mockPage.getTotalElements()).thenReturn(1L);
        when(mockPage.getTotalPages()).thenReturn(1);
        when(mockPage.getSize()).thenReturn(10);
        
        when(groupRepository.findBySkillId(eq(10L), any())).thenReturn(mockPage);
        when(groupMemberRepository.countByGroupId(anyLong())).thenReturn(1);
        when(groupMapper.toDto(any(), anyInt(), anyBoolean())).thenReturn(groupResponse);

        com.skillsync.group.dto.response.PageResponse<GroupResponseDto> response = 
            groupQueryService.getGroupsBySkill(10L, 0, 10, 100L);

        assertNotNull(response);
    }

    @Test
    void getGroupDetails_ShouldReturnJoinedTrue_WhenMemberExists() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(3);
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 100L)).thenReturn(Optional.of(new com.skillsync.group.entity.GroupMember()));
        when(groupMapper.toDto(group, 3, true)).thenReturn(groupResponse);

        groupQueryService.getGroupDetails(1L, 100L);

        verify(groupMapper).toDto(group, 3, true);
    }

    @Test
    void getGroupDetails_ShouldReturnJoinedFalse_WhenAnonUser() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(3);
        when(groupMapper.toDto(group, 3, false)).thenReturn(groupResponse);

        groupQueryService.getGroupDetails(1L, null);

        verify(groupMapper).toDto(group, 3, false);
    }

    @Test
    void getGroupsBySkill_ShouldHandleDifferentUserStates() {
        org.springframework.data.domain.Page<Group> mockPage = mock(org.springframework.data.domain.Page.class);
        when(mockPage.getContent()).thenReturn(List.of(group));
        when(groupRepository.findBySkillId(anyLong(), any())).thenReturn(mockPage);

        // Path 1: User null
        groupQueryService.getGroupsBySkill(10L, 0, 10, null);
        
        // Path 2: User not null, isMember
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.of(new com.skillsync.group.entity.GroupMember()));
        groupQueryService.getGroupsBySkill(10L, 0, 10, 100L);

        // Path 3: User not null, notMember
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());
        groupQueryService.getGroupsBySkill(10L, 0, 10, 100L);

        verify(groupMapper, times(3)).toDto(any(), anyInt(), anyBoolean());
    }

    @Test
    void getGroupsByCreator_ShouldHandleDifferentUserStates() {
        when(groupRepository.findByCreatorId(100L)).thenReturn(List.of(group));

        // Path 1: User null
        groupQueryService.getGroupsByCreator(100L, null);

        // Path 2: User not null, isMember
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.of(new com.skillsync.group.entity.GroupMember()));
        groupQueryService.getGroupsByCreator(100L, 101L);

        verify(groupMapper, times(2)).toDto(any(), anyInt(), anyBoolean());
    }

    @Test
    void getRandomGroups_ShouldHandleDifferentUserStates() {
        when(groupRepository.findRandomGroups(5)).thenReturn(List.of(group));

        // Path 1: User null
        groupQueryService.getRandomGroups(5, null);

        // Path 2: User not null, isMember
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.of(new com.skillsync.group.entity.GroupMember()));
        groupQueryService.getRandomGroups(5, 100L);

        verify(groupMapper, times(2)).toDto(any(), anyInt(), anyBoolean());
    }

    @Test
    void getGroupDetails_ShouldThrowNotFound_WhenMissing() {
        when(groupRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(com.skillsync.group.exception.GroupNotFoundException.class, 
            () -> groupQueryService.getGroupDetails(99L, 100L));
    }
}
