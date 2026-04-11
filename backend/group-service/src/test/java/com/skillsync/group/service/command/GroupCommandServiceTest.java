package com.skillsync.group.service.command;

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

import com.skillsync.group.client.SkillServiceClient;
import com.skillsync.group.client.UserServiceClient;
import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.entity.Group;
import com.skillsync.group.entity.GroupMember;
import com.skillsync.group.entity.MemberRole;
import com.skillsync.group.exception.AlreadyMemberException;
import com.skillsync.group.exception.GroupFullException;
import com.skillsync.group.exception.GroupNotFoundException;
import com.skillsync.group.mapper.GroupMapper;
import com.skillsync.group.repository.GroupMemberRepository;
import com.skillsync.group.repository.GroupRepository;

@ExtendWith(MockitoExtension.class)
class GroupCommandServiceTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private GroupMapper groupMapper;
    @Mock private SkillServiceClient skillServiceClient;
    @Mock private UserServiceClient userServiceClient;

    @InjectMocks private GroupCommandService groupCommandService;

    private Group group;
    private CreateGroupRequestDto createRequest;
    private GroupResponseDto groupResponse;

    @BeforeEach
    void setUp() {
        group = new Group();
        group.setId(1L);
        group.setName("Java Group");
        group.setCreatorId(100L);
        group.setMaxMembers(5);
        group.setIsActive(true);

        createRequest = new CreateGroupRequestDto();
        createRequest.setName("Java Group");
        createRequest.setMaxMembers(5);
        createRequest.setSkillId(10L);

        groupResponse = GroupResponseDto.builder()
                .id(1L).creatorId(100L).name("Java Group")
                .skillId(10L).maxMembers(5).currentMembers(1)
                .isActive(true).build();
    }

    @Test
    void createGroup_ShouldCreateGroupAndAddCreator() {
        when(skillServiceClient.getSkillById(10L)).thenReturn(null); // Just ensuring no exception
        when(userServiceClient.getProfile(100L)).thenReturn(null);
        when(groupMapper.toEntity(100L, createRequest)).thenReturn(group);
        when(groupRepository.save(group)).thenReturn(group);
        when(groupMapper.toMemberEntity(eq(1L), eq(100L), eq(MemberRole.CREATOR))).thenReturn(new GroupMember());
        when(groupMapper.toDto(group, 1, true)).thenReturn(groupResponse);

        GroupResponseDto response = groupCommandService.createGroup(100L, createRequest);

        assertNotNull(response);
        verify(groupRepository).save(group);
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldSuccess_WhenNotFull() {
        when(userServiceClient.getProfile(101L)).thenReturn(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(2);
        when(groupMapper.toMemberEntity(eq(1L), eq(101L), eq(MemberRole.MEMBER))).thenReturn(new GroupMember());
        when(groupMapper.toDto(group, 3, true)).thenReturn(groupResponse);

        GroupResponseDto response = groupCommandService.joinGroup(1L, 101L);

        assertNotNull(response);
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenFull() {
        when(userServiceClient.getProfile(101L)).thenReturn(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(5);

        assertThrows(GroupFullException.class, () -> groupCommandService.joinGroup(1L, 101L));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenAlreadyMember() {
        when(userServiceClient.getProfile(101L)).thenReturn(null);
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.of(new GroupMember()));

        assertThrows(AlreadyMemberException.class, () -> groupCommandService.joinGroup(1L, 101L));
    }

    @Test
    void createGroup_ShouldThrowException_WhenSkillServiceDown() {
        when(skillServiceClient.getSkillById(10L)).thenThrow(new RuntimeException("Service down"));

        assertThrows(GroupNotFoundException.class, () -> groupCommandService.createGroup(100L, createRequest));
    }

    @Test
    void leaveGroup_ShouldSuccess_WhenNotCreator() {
        GroupMember member = new GroupMember();
        member.setUserId(101L);
        member.setRole(MemberRole.MEMBER);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.of(member));
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(1);
        when(groupMapper.toDto(group, 1, false)).thenReturn(GroupResponseDto.builder().build());

        groupCommandService.leaveGroup(1L, 101L);

        verify(groupMemberRepository).delete(member);
    }

    @Test
    void leaveGroup_ShouldThrowException_WhenCreator() {
        GroupMember member = new GroupMember();
        member.setUserId(100L);
        member.setRole(MemberRole.CREATOR);

        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 100L)).thenReturn(Optional.of(member));

        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> groupCommandService.leaveGroup(1L, 100L));
    }

    @Test
    void deleteGroup_ShouldDeactivateGroup() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupRepository.save(group)).thenReturn(group);
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of());

        groupCommandService.deleteGroup(1L, 100L);

        verify(groupRepository).save(group);
        assertFalse(group.getIsActive());
    }

    @Test
    void deleteGroup_ShouldThrowException_WhenNotCreator() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThrows(GroupNotFoundException.class, () -> groupCommandService.deleteGroup(1L, 999L));
    }
}
