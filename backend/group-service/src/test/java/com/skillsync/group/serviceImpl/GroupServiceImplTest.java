package com.skillsync.group.serviceImpl;

import static org.mockito.Mockito.*;

import com.skillsync.group.dto.request.CreateGroupRequestDto;
import com.skillsync.group.service.command.GroupCommandService;
import com.skillsync.group.service.query.GroupQueryService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GroupServiceImplTest {

    @Mock private GroupCommandService commandService;
    @Mock private GroupQueryService queryService;
    @InjectMocks private GroupServiceImpl groupService;

    @Test
    void delegateMethods_shouldCallInternalServices() {
        groupService.createGroup(1L, new CreateGroupRequestDto());
        verify(commandService).createGroup(eq(1L), any());

        groupService.joinGroup(1L, 2L);
        verify(commandService).joinGroup(1L, 2L);

        groupService.leaveGroup(1L, 2L);
        verify(commandService).leaveGroup(1L, 2L);

        groupService.deleteGroup(1L, 2L);
        verify(commandService).deleteGroup(1L, 2L);

        groupService.getGroupDetails(1L, 2L);
        verify(queryService).getGroupDetails(1L, 2L);

        groupService.getGroupsBySkill(1L, 0, 10, 2L);
        verify(queryService).getGroupsBySkill(1L, 0, 10, 2L);

        groupService.getGroupsByCreator(1L, 2L);
        verify(queryService).getGroupsByCreator(1L, 2L);

        groupService.getRandomGroups(5, 2L);
        verify(queryService).getRandomGroups(5, 2L);
    }
}
