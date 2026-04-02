package com.skillsync.group.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.skillsync.group.dto.ApiResponse;
import lombok.Builder;
import lombok.Data;

@FeignClient(name = "skill-service", path = "/skill")
public interface SkillServiceClient {

    @GetMapping("/{id}")
    ApiResponse<SkillDto> getSkillById(@PathVariable("id") Long id);

    @Data
    @Builder
    class SkillDto {
        private Long id;
        private String skillName;
        private String category;
    }
}
