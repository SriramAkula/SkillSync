package com.skillsync.group.service.query;

import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.dto.response.PageResponse;
import com.skillsync.group.exception.GroupNotFoundException;
import com.skillsync.group.mapper.GroupMapper;
import com.skillsync.group.repository.GroupMemberRepository;
import com.skillsync.group.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GroupQueryService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMapper groupMapper;

    @Cacheable(value = "group", key = "#groupId + '_' + (#currentUserId != null ? #currentUserId : 'anon')")
    public GroupResponseDto getGroupDetails(Long groupId, Long currentUserId) {
        log.info("Cache MISS - fetching groupId={} (user={}) from DB", groupId, currentUserId);
        com.skillsync.group.entity.Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found with ID: " + groupId));
        boolean joined = currentUserId != null && groupMemberRepository.findByGroupIdAndUserId(groupId, currentUserId).isPresent();
        return groupMapper.toDto(group, groupMemberRepository.countByGroupId(groupId), joined);
    }

    public com.skillsync.group.dto.response.PageResponse<GroupResponseDto> getGroupsBySkill(Long skillId, int page, int size, Long currentUserId) {
        log.info("Fetching paginated groups for skillId={} (user={}), page={}, size={}", skillId, currentUserId, page, size);
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<com.skillsync.group.entity.Group> groupPage = groupRepository.findBySkillId(skillId, pageable);
        
        return com.skillsync.group.dto.response.PageResponse.<GroupResponseDto>builder()
                .content(groupPage.getContent().stream()
                        .map(g -> groupMapper.toDto(g, groupMemberRepository.countByGroupId(g.getId()),
                                currentUserId != null && groupMemberRepository.findByGroupIdAndUserId(g.getId(), currentUserId).isPresent()))
                        .collect(java.util.stream.Collectors.toList()))
                .currentPage(groupPage.getNumber())
                .totalElements(groupPage.getTotalElements())
                .totalPages(groupPage.getTotalPages())
                .pageSize(groupPage.getSize())
                .build();
    }

    @Cacheable(value = "group", key = "'creator_' + #creatorId + '_' + (#currentUserId != null ? #currentUserId : 'anon')")
    public List<GroupResponseDto> getGroupsByCreator(Long creatorId, Long currentUserId) {
        log.info("Cache MISS - fetching groups for creatorId={} (user={}) from DB", creatorId, currentUserId);
        return groupRepository.findByCreatorId(creatorId).stream()
                .map(g -> groupMapper.toDto(g, groupMemberRepository.countByGroupId(g.getId()),
                        currentUserId != null && groupMemberRepository.findByGroupIdAndUserId(g.getId(), currentUserId).isPresent()))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "group", key = "'random_' + #limit + '_' + (#currentUserId != null ? #currentUserId : 'anon')")
    public List<GroupResponseDto> getRandomGroups(int limit, Long currentUserId) {
        log.info("Fetching {} random groups (user={})", limit, currentUserId);
        return groupRepository.findRandomGroups(limit).stream()
                .map(g -> groupMapper.toDto(g, groupMemberRepository.countByGroupId(g.getId()),
                        currentUserId != null && groupMemberRepository.findByGroupIdAndUserId(g.getId(), currentUserId).isPresent()))
                .collect(Collectors.toList());
    }
}
