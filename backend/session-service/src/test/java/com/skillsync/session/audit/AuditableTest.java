package com.skillsync.session.audit;

import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import static org.junit.jupiter.api.Assertions.*;

class AuditableTest {

    static class TestAuditable extends Auditable {}

    @Test
    void testAuditableAccessors() {
        TestAuditable auditable = new TestAuditable();
        LocalDateTime now = LocalDateTime.now();
        
        auditable.setCreatedBy("user1");
        auditable.setLastModifiedBy("user2");
        auditable.setCreatedAt(now);
        auditable.setUpdatedAt(now);

        assertEquals("user1", auditable.getCreatedBy());
        assertEquals("user2", auditable.getLastModifiedBy());
        assertEquals(now, auditable.getCreatedAt());
        assertEquals(now, auditable.getUpdatedAt());
    }
}
