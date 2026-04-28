package com.skillsync.messaging.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.skillsync.messaging.dto.MessageRequestDTO;
import com.skillsync.messaging.dto.MessageResponseDTO;
import com.skillsync.messaging.exception.GlobalExceptionHandler;
import com.skillsync.messaging.exception.MessageNotFoundException;
import com.skillsync.messaging.service.MessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.domain.Pageable;
import com.skillsync.messaging.dto.PagedResponse;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class MessageControllerTest {

    private MockMvc mockMvc;

    @Mock
    private MessageService messageService;

    @InjectMocks
    private MessageController messageController;

    private ObjectMapper objectMapper;

    private MessageResponseDTO responseDTO;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(messageController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();

        responseDTO = MessageResponseDTO.builder()
                .id(1L)
                .senderId(100L)
                .receiverId(200L)
                .content("Hello!")
                .createdAt(Instant.now())
                .build();
    }

    // --- POST /messaging ---

    @Test
    @DisplayName("POST /messaging - success returns 201")
    void sendMessage_WithValidRequest_Returns201() throws Exception {

        MessageRequestDTO request = new MessageRequestDTO();
        request.setSenderId(100L);
        request.setReceiverId(200L);
        request.setContent("Hello!");

        when(messageService.sendMessage(any(MessageRequestDTO.class)))
                .thenReturn(responseDTO);

        mockMvc.perform(post("/messaging")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.senderId").value(100))
                .andExpect(jsonPath("$.data.receiverId").value(200))
                .andExpect(jsonPath("$.data.content").value("Hello!"));
    }

    @Test
    @DisplayName("POST /messaging - missing senderId returns 400")
    void sendMessage_WithMissingSenderId_Returns400() throws Exception {

        MessageRequestDTO request = new MessageRequestDTO();
        request.setReceiverId(200L);
        request.setContent("Hello!");

        mockMvc.perform(post("/messaging")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /messaging - blank content returns 400")
    void sendMessage_WithBlankContent_Returns400() throws Exception {

        MessageRequestDTO request = new MessageRequestDTO();
        request.setSenderId(100L);
        request.setReceiverId(200L);
        request.setContent(""); // important

        mockMvc.perform(post("/messaging")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    // --- GET /messaging/{id} ---

    @Test
    @DisplayName("GET /messaging/{id} - success returns 200")
    void getMessageById_WhenFound_Returns200() throws Exception {
        when(messageService.getMessageById(1L)).thenReturn(responseDTO);

        mockMvc.perform(get("/messaging/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.content").value("Hello!"));
    }

    @Test
    @DisplayName("GET /messaging/{id} - not found returns 404")
    void getMessageById_WhenNotFound_Returns404() throws Exception {
        when(messageService.getMessageById(999L)).thenThrow(new MessageNotFoundException(999L));

        mockMvc.perform(get("/messaging/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.data").doesNotExist()) // In error cases, usually message is at root or similar
                .andExpect(jsonPath("$.message").value("Message not found with id: 999"));
    }

    // --- GET /messaging/conversation/{user1}/{user2} ---

    @Test
    @DisplayName("GET /messaging/conversation/{user1}/{user2} - returns conversation")
    void getConversation_ReturnsMessages() throws Exception {
        MessageResponseDTO response2 = MessageResponseDTO.builder()
                .id(2L).senderId(200L).receiverId(100L)
                .content("Reply!").createdAt(Instant.now()).build();

        PagedResponse<MessageResponseDTO> mockPage = PagedResponse.<MessageResponseDTO>builder()
                .content(Arrays.asList(responseDTO, response2))
                .build();

        when(messageService.getConversation(eq(100L), eq(200L), any(Pageable.class)))
                .thenReturn(mockPage);

        mockMvc.perform(get("/messaging/conversation/100/200"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].content").value("Hello!"))
                .andExpect(jsonPath("$.data.content[1].content").value("Reply!"));
    }

    // --- GET /messaging/partners/{userId} ---

    @Test
    @DisplayName("GET /messaging/partners/{userId} - returns partner IDs")
    void getConversationPartners_ReturnsPartnerIds() throws Exception {
        when(messageService.getConversationPartners(100L))
                .thenReturn(List.of(200L, 300L));

        mockMvc.perform(get("/messaging/partners/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0]").value(200))
                .andExpect(jsonPath("$.data[1]").value(300));
    }

    // --- GET /messaging/group/{groupId} ---

    @Test
    @DisplayName("GET /messaging/group/{groupId} - returns group conversation")
    void getGroupConversation_ReturnsMessages() throws Exception {
        PagedResponse<MessageResponseDTO> mockPage = PagedResponse.<MessageResponseDTO>builder()
                .content(List.of(responseDTO))
                .build();

        when(messageService.getGroupConversation(eq(500L), any(Pageable.class)))
                .thenReturn(mockPage);

        mockMvc.perform(get("/messaging/group/500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].content").value("Hello!"));
    }
}
