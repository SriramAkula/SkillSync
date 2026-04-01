package com.skillsync.group.service;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import java.util.List;

public interface GroupService {
    GroupResponseDto createGroup(Long creatorId, CreateGroupRequestDto request);
    GroupResponseDto getGroupDetails(Long groupId);
    List<GroupResponseDto> getGroupsBySkill(Long skillId);
    List<GroupResponseDto> getGroupsByCreator(Long creatorId);
    GroupResponseDto joinGroup(Long groupId, Long userId);
    GroupResponseDto leaveGroup(Long groupId, Long userId);
    GroupResponseDto deleteGroup(Long groupId, Long creatorId);
}
