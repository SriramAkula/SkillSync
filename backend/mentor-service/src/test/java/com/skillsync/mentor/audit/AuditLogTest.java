package com.skillsync.mentor.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

class AuditLogTest {

    @Test
    void settersAndGetters_shouldPerformCorrectly() {
        AuditLog log = new AuditLog();
        LocalDateTime now = LocalDateTime.now();

        log.setEntityName("TestEntity");
        log.setEntityId(123L);
        log.setAction("TEST_ACTION");
        log.setPerformedBy("tester");
        log.setDetails("Test details");
        log.onCreate(); // Explicitly call PrePersist method

        assertThat(log.getEntityName()).isEqualTo("TestEntity");
        assertThat(log.getEntityId()).isEqualTo(123L);
        assertThat(log.getAction()).isEqualTo("TEST_ACTION");
        assertThat(log.getPerformedBy()).isEqualTo("tester");
        assertThat(log.getDetails()).isEqualTo("Test details");
        assertThat(log.getTimestamp()).isNotNull();
        assertThat(log.getId()).isNull();
    }
}
