package com.skillsync.group.service.query;

import static org.junit.jupiter.api.Assertions.*;
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
    void getRandomGroups_ShouldReturnList() {
        when(groupRepository.findRandomGroups(anyInt())).thenReturn(List.of(group));
        when(groupMemberRepository.countByGroupId(anyLong())).thenReturn(1);
        when(groupMapper.toDto(any(), anyInt(), anyBoolean())).thenReturn(groupResponse);

        List<GroupResponseDto> response = groupQueryService.getRandomGroups(5, 100L);

        assertNotNull(response);
        assertEquals(1, response.size());
    }
}
