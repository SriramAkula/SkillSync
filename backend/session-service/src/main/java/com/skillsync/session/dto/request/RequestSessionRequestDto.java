package com.skillsync.session.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestSessionRequestDto {
    @NotNull(message = "Mentor ID is required")
    private Long mentorId;
    
    @NotNull(message = "Skill ID is required")
    private Long skillId;
    
    @NotNull(message = "Scheduled time is required")
    @Future(message = "Session must be scheduled in future")
    private LocalDateTime scheduledAt;
    
    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Minimum duration is 15 minutes")
    @Max(value = 240, message = "Maximum duration is 240 minutes")
    private Integer durationMinutes = 60;
}
