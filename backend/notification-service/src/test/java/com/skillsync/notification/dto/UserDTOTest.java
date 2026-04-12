package com.skillsync.notification.dto;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserDTOTest {

    @Test
    void testUserDTO() {
        UserDTO user = new UserDTO();
        user.setId(1L);
        user.setFirstName("First");
        user.setLastName("Last");
        user.setEmail("test@test.com");
        user.setUsername("user1");

        assertEquals(1L, user.getId());
        assertEquals("First", user.getFirstName());
        assertEquals("Last", user.getLastName());
        assertEquals("test@test.com", user.getEmail());
        assertEquals("user1", user.getUsername());
    }

    @Test
    void testUserDTOAllArgs() {
        UserDTO user = new UserDTO(1L, "test@test.com", "First", "Last", "user1");
        assertEquals(1L, user.getId());
        assertEquals("First", user.getFirstName());
        assertEquals("Last", user.getLastName());
        assertEquals("test@test.com", user.getEmail());
        assertEquals("user1", user.getUsername());
    }
}
