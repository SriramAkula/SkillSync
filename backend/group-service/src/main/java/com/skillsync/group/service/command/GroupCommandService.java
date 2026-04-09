package com.skillsync.group.service.command;

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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupCommandService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMapper groupMapper;
    private final SkillServiceClient skillServiceClient;
    private final UserServiceClient userServiceClient;

    @Transactional
    @CacheEvict(value = "group", allEntries = true)
    public GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request) {
        log.info("Creating group '{}' with skill {} by creator {}", request.getName(), request.getSkillId(), creatorId);
        try {
            skillServiceClient.getSkillById(request.getSkillId());
        } catch (Exception e) {
            throw new GroupNotFoundException("Referenced skill (ID: " + request.getSkillId() + ") does not exist or skill-service is down. Cause: " + e.getMessage());
        }
        try {
            userServiceClient.getProfile(creatorId);
        } catch (Exception e) {
            throw new GroupNotFoundException("Creator user (ID: " + creatorId + ") does not exist or user-service is down. Cause: " + e.getMessage());
        }
        Group savedGroup = groupRepository.save(groupMapper.toEntity(creatorId, request));
        groupMemberRepository.save(groupMapper.toMemberEntity(savedGroup.getId(), creatorId, MemberRole.CREATOR));
        log.info("Group {} created with ID {}", request.getName(), savedGroup.getId());
        return groupMapper.toDto(savedGroup, 1, true);
    }

    @Transactional
    @CacheEvict(value = "group", allEntries = true)
    public GroupResponseDto joinGroup(Long groupId, Long userId) {
        log.info("User {} joining group {}", userId, groupId);
        try {
            userServiceClient.getProfile(userId);
        } catch (Exception e) {
            throw new GroupNotFoundException("User (ID: " + userId + ") does not exist or user-service is down. Cause: " + e.getMessage());
        }
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        Optional<GroupMember> existing = groupMemberRepository.findByGroupIdAndUserId(groupId, userId);
        if (existing.isPresent()) {
            throw new AlreadyMemberException("User is already a member of this group");
        }
        Integer currentMembers = groupMemberRepository.countByGroupId(groupId);
        if (currentMembers >= group.getMaxMembers()) {
            throw new GroupFullException("Group has reached maximum member capacity");
        }
        groupMemberRepository.save(groupMapper.toMemberEntity(groupId, userId, MemberRole.MEMBER));
        log.info("User {} joined group {}", userId, groupId);
        return groupMapper.toDto(group, currentMembers + 1, true);
    }

    @Transactional
    @CacheEvict(value = "group", allEntries = true)
    public GroupResponseDto leaveGroup(Long groupId, Long userId) {
        log.info("User {} leaving group {}", userId, groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new GroupNotFoundException("User is not a member of this group"));
        if (member.getRole() == MemberRole.CREATOR) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Creator cannot leave the group. You must delete the group instead.");
        }
        groupMemberRepository.delete(member);
        log.info("User {} left group {}", userId, groupId);
        return groupMapper.toDto(group, groupMemberRepository.countByGroupId(groupId), false);
    }

    @Transactional
    @CacheEvict(value = "group", allEntries = true)
    public void deleteGroup(Long groupId, Long creatorId) {
        log.info("Deleting group {} by creator {}", groupId, creatorId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        if (!group.getCreatorId().equals(creatorId)) {
            throw new GroupNotFoundException("Only creator can delete the group");
        }
        group.setIsActive(false);
        groupRepository.save(group);
        groupMemberRepository.deleteAll(groupMemberRepository.findByGroupId(groupId));
        log.info("Group {} deleted", groupId);
    }
}
