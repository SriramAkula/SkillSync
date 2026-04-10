package com.skillsync.group.repository;

import com.skillsync.group.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {
    
    @Query("SELECT g FROM Group g WHERE g.skillId = :skillId AND g.isActive = true")
    org.springframework.data.domain.Page<Group> findBySkillId(Long skillId, org.springframework.data.domain.Pageable pageable);
    
    @Query("SELECT g FROM Group g WHERE g.creatorId = :creatorId AND g.isActive = true")
    List<Group> findByCreatorId(Long creatorId);
    
    @Query("SELECT g FROM Group g WHERE g.isActive = true")
    org.springframework.data.domain.Page<Group> findAllActiveGroups(org.springframework.data.domain.Pageable pageable);

    @Query(value = "SELECT * FROM learning_groups WHERE is_active = true ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<Group> findRandomGroups(@org.springframework.data.repository.query.Param("limit") int limit);
}
