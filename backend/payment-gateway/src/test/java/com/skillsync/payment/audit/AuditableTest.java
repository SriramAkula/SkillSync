package com.skillsync.payment.audit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;

class AuditableTest {

    private static class TestEntity extends Auditable {}

    @Test
    void settersAndGetters_shouldPerformCorrectly() {
        TestEntity entity = new TestEntity();
        LocalDateTime now = LocalDateTime.now();

        entity.setCreatedBy("creator");
        entity.setLastModifiedBy("updater");

        assertThat(entity.getCreatedBy()).isEqualTo("creator");
        assertThat(entity.getLastModifiedBy()).isEqualTo("updater");
    }
}
