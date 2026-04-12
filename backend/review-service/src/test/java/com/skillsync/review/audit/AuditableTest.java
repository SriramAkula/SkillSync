package com.skillsync.review.audit;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

class AuditableTest {

    static class TestEntity extends Auditable {
    }

    @Test
    void gettersAndSetters_shouldWorkCorrectly() {
        TestEntity entity = new TestEntity();
        
        entity.setCreatedBy("user1");
        entity.setLastModifiedBy("user2");
        
        assertThat(entity.getCreatedBy()).isEqualTo("user1");
        assertThat(entity.getLastModifiedBy()).isEqualTo("user2");
    }
}
