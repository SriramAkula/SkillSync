package com.skillsync.messaging.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Database Schema Fixer
 * Ensures that the messages table in MySQL correctly supports nullable receiver_id and group_id.
 * This is a self-healing component to fix legacy database constraints.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaFixer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Starting database schema check and repair...");
        try {
            // MySQL specific ALTER statements to relax NOT NULL constraints
            log.info("Repairing column nullability for 'messages' table...");
            
            jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN receiver_id BIGINT NULL");
            log.info("Successfully ensured 'receiver_id' is nullable.");
            
            jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN group_id BIGINT NULL");
            log.info("Successfully ensured 'group_id' is nullable.");
            
            log.info("Database schema repair completed successfully.");
        } catch (Exception e) {
            log.warn("Database schema repair note: {}. (This is normal if the columns are already correct or if using H2 for tests)", e.getMessage());
        }
    }
}
