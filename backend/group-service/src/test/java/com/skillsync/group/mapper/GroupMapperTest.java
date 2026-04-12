package com.skillsync.group.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.dto.response.GroupResponseDto;
import com.skillsync.group.entity.Group;
import com.skillsync.group.entity.GroupMember;
import com.skillsync.group.entity.MemberRole;
import org.junit.jupiter.api.Test;

class GroupMapperTest {

    private final GroupMapper groupMapper = new GroupMapper();

    @Test
    void toEntity_shouldMapCorrectly() {
        CreateGroupRequestDto request = new CreateGroupRequestDto();
        request.setName("Test Group");
        request.setSkillId(1L);
        request.setMaxMembers(10);
        request.setDescription("Description");

        Group result = groupMapper.toEntity(100L, request);

        assertThat(result.getCreatorId()).isEqualTo(100L);
        assertThat(result.getName()).isEqualTo("Test Group");
        assertThat(result.getSkillId()).isEqualTo(1L);
        assertThat(result.getMaxMembers()).isEqualTo(10);
        assertThat(result.getDescription()).isEqualTo("Description");
        assertThat(result.getIsActive()).isTrue();
    }

    @Test
    void toMemberEntity_shouldMapCorrectly() {
        GroupMember result = groupMapper.toMemberEntity(1L, 2L, MemberRole.CREATOR);

        assertThat(result.getGroupId()).isEqualTo(1L);
        assertThat(result.getUserId()).isEqualTo(2L);
        assertThat(result.getRole()).isEqualTo(MemberRole.CREATOR);
    }

    @Test
    void toDto_shouldHandleNulls() {
        Group group = new Group();
        group.setId(1L);
        group.setCreatorId(10L);
        group.setName("Name");
        group.setSkillId(5L);
        group.setMaxMembers(20);
        group.setIsActive(true);

        GroupResponseDto result = groupMapper.toDto(group, null, null);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getCurrentMembers()).isEqualTo(0);
        assertThat(result.getIsJoined()).isFalse();
    }

    @Test
    void toDto_shouldHandleNonNulls() {
        Group group = new Group();
        group.setId(1L);
        group.setIsActive(true);

        GroupResponseDto result = groupMapper.toDto(group, 5, true);

        assertThat(result.getCurrentMembers()).isEqualTo(5);
        assertThat(result.getIsJoined()).isTrue();
    }
}
