package com.skillsync.session.audit;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class AuditLogTest {

    @Test
    void testAuditLogAccessors() {
        AuditLog log = new AuditLog();
        log.setEntityName("Session");
        log.setEntityId(1L);
        log.setAction("CREATE");
        log.setPerformedBy("user1");
        log.setDetails("details");

        assertEquals("Session", log.getEntityName());
        assertEquals(1L, log.getEntityId());
        assertEquals("CREATE", log.getAction());
        assertEquals("user1", log.getPerformedBy());
        assertEquals("details", log.getDetails());
        
        // Exercise @PrePersist
        log.onCreate();
        assertNotNull(log.getTimestamp());
        assertNull(log.getId());
    }
}
