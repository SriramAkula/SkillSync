package com.skillsync.group.serviceImpl;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.service.GroupService;
import com.skillsync.group.service.command.GroupCommandService;
import com.skillsync.group.service.query.GroupQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupCommandService groupCommandService;
    private final GroupQueryService groupQueryService;

    @Override
    public GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request) {
        return groupCommandService.createGroup(creatorId, request);
    }

    @Override
    public GroupResponseDto joinGroup(Long groupId, Long userId) {
        return groupCommandService.joinGroup(groupId, userId);
    }

    @Override
    public GroupResponseDto leaveGroup(Long groupId, Long userId) {
        return groupCommandService.leaveGroup(groupId, userId);
    }

    @Override
    public void deleteGroup(Long groupId, Long userId, boolean isAdmin) {
        groupCommandService.deleteGroup(groupId, userId, isAdmin);
    }

    @Override
    public GroupResponseDto getGroupDetails(Long groupId, Long currentUserId) {
        return groupQueryService.getGroupDetails(groupId, currentUserId);
    }

    @Override
    public com.skillsync.group.dto.response.PageResponse<GroupResponseDto> getGroupsBySkill(Long skillId, int page, int size, Long currentUserId) {
        return groupQueryService.getGroupsBySkill(skillId, page, size, currentUserId);
    }

    @Override
    public List<GroupResponseDto> getGroupsByCreator(Long creatorId, Long currentUserId) {
        return groupQueryService.getGroupsByCreator(creatorId, currentUserId);
    }

    @Override
    public List<GroupResponseDto> getRandomGroups(int limit, Long currentUserId) {
        return groupQueryService.getRandomGroups(limit, currentUserId);
    }
}
