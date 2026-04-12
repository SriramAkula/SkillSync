package com.skillsync.payment.audit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AuditLogTest {

    @Test
    void entityProperties_shouldWork() {
        AuditLog log = new AuditLog();
        log.setEntityName("Test");
        log.setEntityId(10L);
        log.setAction("ACTION");
        log.setPerformedBy("User");
        log.setDetails("Details");

        assertThat(log.getEntityName()).isEqualTo("Test");
        assertThat(log.getEntityId()).isEqualTo(10L);
        assertThat(log.getAction()).isEqualTo("ACTION");
        assertThat(log.getPerformedBy()).isEqualTo("User");
        assertThat(log.getDetails()).isEqualTo("Details");
    }

    @Test
    void prePersist_shouldSetTimestamp() {
        AuditLog log = new AuditLog();
        log.onCreate();
        assertThat(log.getTimestamp()).isNotNull();
    }
}
