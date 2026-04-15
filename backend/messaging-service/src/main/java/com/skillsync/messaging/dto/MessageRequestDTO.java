package com.skillsync.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageRequestDTO {

    @NotNull(message = "Sender ID is required")
    private Long senderId;

    private Long receiverId;

    private Long groupId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;
}
