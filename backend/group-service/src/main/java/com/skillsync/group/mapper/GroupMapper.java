package com.skillsync.group.mapper;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.entity.Group;
import com.skillsync.group.entity.GroupMember;
import com.skillsync.group.entity.MemberRole;
import org.springframework.stereotype.Component;

@Component
public class GroupMapper {

    // CreateGroupRequestDto + creatorId -> Group entity
    public Group toEntity(Long creatorId, CreateGroupRequestDto request) {
        Group group = new Group();
        group.setCreatorId(creatorId);
        group.setName(request.getName());
        group.setSkillId(request.getSkillId());
        group.setMaxMembers(request.getMaxMembers());
        group.setDescription(request.getDescription());
        group.setIsActive(true);
        return group;
    }

    // Build GroupMember entity
    public GroupMember toMemberEntity(Long groupId, Long userId, MemberRole role) {
        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setRole(role);
        return member;
    }

    // Group entity + memberCount -> GroupResponseDto
    public GroupResponseDto toDto(Group group, Integer memberCount) {
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
