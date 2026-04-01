package com.skillsync.group.repository;

import com.skillsync.group.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
    
    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.groupId = :groupId")
    Integer countByGroupId(Long groupId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.groupId = :groupId")
    List<GroupMember> findByGroupId(Long groupId);
    
    @Query("SELECT gm FROM GroupMember gm WHERE gm.userId = :userId")
    List<GroupMember> findByUserId(Long userId);
}
