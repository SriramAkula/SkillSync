package com.skillsync.group.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class GroupResponseDto {
    private Long id;
    private Long creatorId;
    private String name;
    private Long skillId;
    private Integer maxMembers;
    private Integer currentMembers;
    private String description;
    private Boolean isActive;
    private Boolean isJoined;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
