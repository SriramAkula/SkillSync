package com.skillsync.mentor.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;

class AuditableTest {

    static class TestEntity extends Auditable {}

    @Test
    void settersAndGetters_shouldPerformCorrectly() {
        TestEntity entity = new TestEntity();
        LocalDateTime now = LocalDateTime.now();

        entity.setCreatedBy("creator");
        entity.setCreatedAt(now);
        entity.setLastModifiedBy("updater");
        entity.setUpdatedAt(now);

        assertThat(entity.getCreatedBy()).isEqualTo("creator");
        assertThat(entity.getCreatedAt()).isEqualTo(now);
        assertThat(entity.getLastModifiedBy()).isEqualTo("updater");
        assertThat(entity.getUpdatedAt()).isEqualTo(now);
    }
}
