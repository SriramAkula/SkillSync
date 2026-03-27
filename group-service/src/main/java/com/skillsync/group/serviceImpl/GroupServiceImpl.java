package com.skillsync.group.serviceImpl;

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
import com.skillsync.group.service.GroupService;
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
    
    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request) {
        log.info("Creating group '{}' with skill {} by creator {}", 
            request.getName(), request.getSkillId(), creatorId);
        
        Group group = new Group();
        group.setCreatorId(creatorId);
        group.setName(request.getName());
        group.setSkillId(request.getSkillId());
        group.setMaxMembers(request.getMaxMembers());
        group.setDescription(request.getDescription());
        group.setIsActive(true);
        
        Group savedGroup = groupRepository.save(group);
        
        // Add creator as member with CREATOR role
        GroupMember creatorMember = new GroupMember();
        creatorMember.setGroupId(savedGroup.getId());
        creatorMember.setUserId(creatorId);
        creatorMember.setRole(MemberRole.CREATOR);
        groupMemberRepository.save(creatorMember);
        
        log.info("Group {} created with ID {}", request.getName(), savedGroup.getId());
        return mapToResponseDto(savedGroup, 1);
    }
    
    @Override
    @Cacheable(key = "#groupId")
    public GroupResponseDto getGroupDetails(Long groupId) {
        log.info("Cache MISS — fetching groupId={} from DB", groupId);
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new GroupNotFoundException("Group not found with ID: " + groupId));
        
        Integer memberCount = groupMemberRepository.countByGroupId(groupId);
        return mapToResponseDto(group, memberCount);
    }
    
    @Override
    @Cacheable(key = "'skill_' + #skillId")
    public List<GroupResponseDto> getGroupsBySkill(Long skillId) {
        log.info("Cache MISS — fetching groups for skillId={} from DB", skillId);
        return groupRepository.findBySkillId(skillId).stream()
            .map(group -> {
                Integer memberCount = groupMemberRepository.countByGroupId(group.getId());
                return mapToResponseDto(group, memberCount);
            })
            .collect(Collectors.toList());
    }
    
    @Override
    @Cacheable(key = "'creator_' + #creatorId")
    public List<GroupResponseDto> getGroupsByCreator(Long creatorId) {
        log.info("Cache MISS — fetching groups for creatorId={} from DB", creatorId);
        return groupRepository.findByCreatorId(creatorId).stream()
            .map(group -> {
                Integer memberCount = groupMemberRepository.countByGroupId(group.getId());
                return mapToResponseDto(group, memberCount);
            })
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    @CacheEvict(allEntries = true)
    public GroupResponseDto joinGroup(Long groupId, Long userId) {
        log.info("User {} joining group {}", userId, groupId);
        
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        
        // Check if already member
        Optional<GroupMember> existingMember = groupMemberRepository
            .findByGroupIdAndUserId(groupId, userId);
        if (existingMember.isPresent()) {
            throw new AlreadyMemberException("User is already a member of this group");
        }
        
        // Check if group is full
        Integer currentMembers = groupMemberRepository.countByGroupId(groupId);
        if (currentMembers >= group.getMaxMembers()) {
            throw new GroupFullException("Group has reached maximum member capacity");
        }
        
        // Add user as member
        GroupMember newMember = new GroupMember();
        newMember.setGroupId(groupId);
        newMember.setUserId(userId);
        newMember.setRole(MemberRole.MEMBER);
        groupMemberRepository.save(newMember);
        
        log.info("User {} joined group {}", userId, groupId);
        return mapToResponseDto(group, currentMembers + 1);
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
        return mapToResponseDto(group, memberCount);
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
        
        // Delete all members
        List<GroupMember> members = groupMemberRepository.findByGroupId(groupId);
        groupMemberRepository.deleteAll(members);
        
        log.info("Group {} deleted", groupId);
        return mapToResponseDto(updated, 0);
    }
    
    private GroupResponseDto mapToResponseDto(Group group, Integer memberCount) {
        return GroupResponseDto.builder()
            .id(group.getId())
            .creatorId(group.getCreatorId())
            .name(group.getName())
            .skillId(group.getSkillId())
            .maxMembers(group.getMaxMembers())
            .currentMembers(memberCount != null ? memberCount : 0)
            .description(group.getDescription())
            .isActive(group.getIsActive())
            .createdAt(group.getCreatedAt())
            .updatedAt(group.getUpdatedAt())
            .build();
    }
}
