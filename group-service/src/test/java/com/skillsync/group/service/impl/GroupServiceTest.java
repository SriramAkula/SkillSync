package com.skillsync.group.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.skillsync.group.repository.GroupMemberRepository;
import com.skillsync.group.repository.GroupRepository;
import com.skillsync.group.serviceImpl.GroupServiceImpl;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupRepository groupRepository;

    @Mock
    private GroupMemberRepository groupMemberRepository;

    @InjectMocks
    private GroupServiceImpl groupService;

    private Group group;
    private CreateGroupRequestDto createRequest;

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
    }

    @Test
    void createGroup_ShouldCreateGroupAndAddCreator() {
        // Arrange
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        GroupResponseDto response = groupService.createGroup(100L, createRequest);

        // Assert
        assertNotNull(response);
        verify(groupRepository, times(1)).save(any(Group.class));
        verify(groupMemberRepository, times(1)).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldSuccess_WhenNotFull() {
        // Arrange
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(anyLong())).thenReturn(2);

        // Act
        GroupResponseDto response = groupService.joinGroup(1L, 101L);

        // Assert
        assertNotNull(response);
        assertEquals(3, response.getCurrentMembers());
        verify(groupMemberRepository, times(1)).save(any(GroupMember.class));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenFull() {
        // Arrange
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());
        when(groupMemberRepository.countByGroupId(anyLong())).thenReturn(5);

        // Act & Assert
        assertThrows(GroupFullException.class, () -> groupService.joinGroup(1L, 101L));
    }

    @Test
    void joinGroup_ShouldThrowException_WhenAlreadyMember() {
        // Arrange
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.of(new GroupMember()));

        // Act & Assert
        assertThrows(AlreadyMemberException.class, () -> groupService.joinGroup(1L, 101L));
    }

    @Test
    void leaveGroup_ShouldDeleteMember() {
        // Arrange
        GroupMember member = new GroupMember();
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(groupMemberRepository.findByGroupIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.of(member));

        // Act
        groupService.leaveGroup(1L, 101L);

        // Assert
        verify(groupMemberRepository, times(1)).delete(member);
    }

    @Test
    void deleteGroup_ShouldDeactivateGroup() {
        // Arrange
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));
        when(groupRepository.save(any(Group.class))).thenReturn(group);

        // Act
        groupService.deleteGroup(1L, 100L);

        // Assert
        verify(groupRepository, times(1)).save(group);
        verify(groupMemberRepository, times(1)).deleteAll(any());
    }

    @Test
    void deleteGroup_ShouldThrowException_WhenNotCreator() {
        // Arrange
        when(groupRepository.findById(anyLong())).thenReturn(Optional.of(group));

        // Act & Assert
        assertThrows(GroupNotFoundException.class, () -> groupService.deleteGroup(1L, 999L));
        verify(groupRepository, never()).save(any());
    }
}
