package com.skillsync.group.serviceImpl;

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
import com.skillsync.group.service.GroupService;
import com.skillsync.group.client.SkillServiceClient;
import com.skillsync.group.client.UserServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheConfig;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@CacheConfig(cacheNames = "group")
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMapper groupMapper;
    private final SkillServiceClient skillServiceClient;
    private final UserServiceClient userServiceClient;

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request) {
        log.info("Creating group '{}' with skill {} by creator {}",
                request.getName(), request.getSkillId(), creatorId);

        // Cross-service validation: Skill Sync
        try {
            skillServiceClient.getSkillById(request.getSkillId());
        } catch (Exception e) {
            throw new GroupNotFoundException("Referenced skill (ID: " + request.getSkillId() + ") does not exist or skill-service is down.");
        }

        // Cross-service validation: User Sync
        try {
            userServiceClient.getProfile(creatorId);
        } catch (Exception e) {
            throw new GroupNotFoundException("Creator user (ID: " + creatorId + ") does not exist or user-service is down.");
        }

        Group group = groupMapper.toEntity(creatorId, request);
        Group savedGroup = groupRepository.save(group);
        groupMemberRepository.save(groupMapper.toMemberEntity(savedGroup.getId(), creatorId, MemberRole.CREATOR));
        log.info("Group {} created with ID {}", request.getName(), savedGroup.getId());
        return groupMapper.toDto(savedGroup, 1);
    }

    @Override
    @Cacheable(key = "#groupId")
    public GroupResponseDto getGroupDetails(Long groupId) {
        log.info("Cache MISS - fetching groupId={} from DB", groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with ID: " + groupId));
        return groupMapper.toDto(group, groupMemberRepository.countByGroupId(groupId));
    }

    @Override
    @Cacheable(key = "'skill_' + #skillId")
    public List<GroupResponseDto> getGroupsBySkill(Long skillId) {
        log.info("Cache MISS - fetching groups for skillId={} from DB", skillId);
        return groupRepository.findBySkillId(skillId).stream()
                .map(g -> groupMapper.toDto(g, groupMemberRepository.countByGroupId(g.getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(key = "'creator_' + #creatorId")
    public List<GroupResponseDto> getGroupsByCreator(Long creatorId) {
        log.info("Cache MISS - fetching groups for creatorId={} from DB", creatorId);
        return groupRepository.findByCreatorId(creatorId).stream()
                .map(g -> groupMapper.toDto(g, groupMemberRepository.countByGroupId(g.getId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto joinGroup(Long groupId, Long userId) {
        log.info("User {} joining group {}", userId, groupId);

        // Cross-service validation: User Sync
        try {
            userServiceClient.getProfile(userId);
        } catch (Exception e) {
            throw new GroupNotFoundException("User (ID: " + userId + ") does not exist or user-service is down.");
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
        return groupMapper.toDto(group, currentMembers + 1);
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto leaveGroup(Long groupId, Long userId) {
        log.info("User {} leaving group {}", userId, groupId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new GroupNotFoundException("User is not a member of this group"));
        groupMemberRepository.delete(member);
        Integer memberCount = groupMemberRepository.countByGroupId(groupId);
        log.info("User {} left group {}", userId, groupId);
        return groupMapper.toDto(group, memberCount);
    }

    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto deleteGroup(Long groupId, Long creatorId) {
        log.info("Deleting group {} by creator {}", groupId, creatorId);
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        if (!group.getCreatorId().equals(creatorId)) {
            throw new GroupNotFoundException("Only creator can delete the group");
        }
        group.setIsActive(false);
        Group updated = groupRepository.save(group);
        groupMemberRepository.deleteAll(groupMemberRepository.findByGroupId(groupId));
        log.info("Group {} deleted", groupId);
        return groupMapper.toDto(updated, 0);
    }
}
