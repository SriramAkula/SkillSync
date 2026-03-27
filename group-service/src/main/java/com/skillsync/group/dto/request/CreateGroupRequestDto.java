package com.skillsync.group.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateGroupRequestDto {
    
    @NotBlank(message = "Group name is required")
    @Size(min = 3, max = 100, message = "Group name must be between 3 and 100 characters")
    private String name;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    @NotNull(message = "Max members is required")
    @Min(value = 2, message = "Minimum 2 members required")
    @Max(value = 100, message = "Maximum 100 members allowed")
    private Integer maxMembers;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}
