package com.skillsync.group.service.impl;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
import com.skillsync.group.serviceImpl.GroupServiceImpl;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock private GroupRepository groupRepository;
    @Mock private GroupMemberRepository groupMemberRepository;
    @Mock private GroupMapper groupMapper;

    @InjectMocks private GroupServiceImpl groupService;

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
                .isActive(true).createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    void createGroup_ShouldCreateGroupAndAddCreator() {
        when(groupMapper.toEntity(100L, createRequest)).thenReturn(group);
        when(groupRepository.save(group)).thenReturn(group);
        when(groupMapper.toMemberEntity(eq(1L), eq(100L), eq(MemberRole.CREATOR))).thenReturn(new GroupMember());
        when(groupMapper.toDto(group, 1, true)).thenReturn(groupResponse);

        GroupResponseDto response = groupService.createGroup(100L, createRequest);

        assertNotNull(response);
        verify(groupRepository).save(group);
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldSuccess_WhenNotFull() {
        GroupResponseDto joinedResponse = GroupResponseDto.builder()
                .id(1L).creatorId(100L).name("Java Group").skillId(10L)
                .maxMembers(5).currentMembers(3).isActive(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(2);
        when(groupMapper.toMemberEntity(eq(1L), eq(101L), eq(MemberRole.MEMBER))).thenReturn(new GroupMember());
        when(groupMapper.toDto(group, 3, true)).thenReturn(joinedResponse);

        GroupResponseDto response = groupService.joinGroup(1L, 101L);

        assertNotNull(response);
        assertEquals(3, response.getCurrentMembers());
        verify(groupMemberRepository).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenFull() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(5);

        assertThrows(GroupFullException.class, () -> groupService.joinGroup(1L, 101L));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenAlreadyMember() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.of(new GroupMember()));

        assertThrows(AlreadyMemberException.class, () -> groupService.joinGroup(1L, 101L));
    }

    @Test
    void leaveGroup_ShouldDeleteMember() {
        GroupMember member = new GroupMember();
        GroupResponseDto leaveResponse = GroupResponseDto.builder()
                .id(1L).creatorId(100L).name("Java Group").skillId(10L)
                .maxMembers(5).currentMembers(1).isActive(true)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(1L, 101L)).thenReturn(Optional.of(member));
        when(groupMemberRepository.countByGroupId(1L)).thenReturn(1);
        when(groupMapper.toDto(group, 1, false)).thenReturn(leaveResponse);

        groupService.leaveGroup(1L, 101L);

        verify(groupMemberRepository).delete(member);
    }

    @Test
    void deleteGroup_ShouldDeactivateGroup() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));
        when(groupRepository.save(group)).thenReturn(group);
        when(groupMemberRepository.findByGroupId(1L)).thenReturn(List.of());
        // No call to toDto in deleteGroup anymore, return type changed to void

        groupService.deleteGroup(1L, 100L);

        verify(groupRepository).save(group);
        verify(groupMemberRepository).deleteAll(any());
    }

    @Test
    void deleteGroup_ShouldThrowException_WhenNotCreator() {
        when(groupRepository.findById(1L)).thenReturn(Optional.of(group));

        assertThrows(GroupNotFoundException.class, () -> groupService.deleteGroup(1L, 999L));
        verify(groupRepository, never()).save(any());
    }
}
