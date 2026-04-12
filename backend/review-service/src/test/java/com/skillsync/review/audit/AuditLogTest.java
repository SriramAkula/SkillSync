package com.skillsync.review.audit;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AuditLogTest {

    @Test
    void gettersAndSetters_shouldWorkCorrectly() {
        AuditLog log = new AuditLog();
        
        log.setEntityName("Entity");
        log.setEntityId(3L);
        log.setAction("ACTION");
        log.setPerformedBy("user");
        log.setDetails("Details");
        
        assertThat(log.getId()).isNull();
        assertThat(log.getEntityName()).isEqualTo("Entity");
        assertThat(log.getEntityId()).isEqualTo(3L);
        assertThat(log.getAction()).isEqualTo("ACTION");
        assertThat(log.getPerformedBy()).isEqualTo("user");
        assertThat(log.getDetails()).isEqualTo("Details");
        
        log.onCreate();
        assertThat(log.getTimestamp()).isNotNull();
    }
}
