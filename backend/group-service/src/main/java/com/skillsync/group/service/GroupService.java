package com.skillsync.group.service;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.dto.response.PageResponse;
import java.util.List;

public interface GroupService {
    GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request);
    GroupResponseDto getGroupDetails(Long groupId, Long currentUserId);
    PageResponse<GroupResponseDto> getGroupsBySkill(Long skillId, int page, int size, Long currentUserId);
    List<GroupResponseDto> getGroupsByCreator(Long creatorId, Long currentUserId);
    void deleteGroup(Long groupId, Long userId, boolean isAdmin);
    GroupResponseDto joinGroup(Long groupId, Long userId);
    GroupResponseDto leaveGroup(Long groupId, Long userId);
    List<GroupResponseDto> getJoinedGroups(Long userId);
    List<GroupResponseDto> getRandomGroups(int limit, Long currentUserId);
}

