package com.skillsync.messaging.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "receiver_id", nullable = true)
    private Long receiverId;

    @Column(name = "group_id", nullable = true)
    private Long groupId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @Column(name = "sender_username")
    private String senderUsername;

    @Column(name = "sender_profile_pic_url")
    private String senderProfilePicUrl;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
