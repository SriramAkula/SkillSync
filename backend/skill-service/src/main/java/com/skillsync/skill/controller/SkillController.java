package com.skillsync.skill.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.skillsync.skill.dto.request.CreateSkillRequestDto;
import com.skillsync.skill.dto.response.ApiResponse;
import com.skillsync.skill.dto.response.SkillResponseDto;
import com.skillsync.skill.service.SkillService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Skill Controller
 * Handles skill management endpoints
 */
@RestController
@RequestMapping("/skill")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Skill Management", description = "Skill CRUD and search operations")
public class SkillController {

	private final SkillService skillService;

	/**
	 * POST /api/skill
	 * Create new skill (Admin only)
	 */
	@PostMapping
	@Operation(summary = "Create new skill", description = "Create a new skill (Admin only)")
	@ApiResponses(value = {
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Skill created successfully"),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request body"),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied. Only admins can create skills")
	})
	public ResponseEntity<ApiResponse<SkillResponseDto>> createSkill(
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@Valid @RequestBody CreateSkillRequestDto requestDto) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Only admins can create skills");
		}

		log.info("Creating skill: {}", requestDto.getSkillName());
		SkillResponseDto response = skillService.createSkill(requestDto);

		return ResponseEntity
			.status(HttpStatus.CREATED)
			.body(new ApiResponse<>(
				true,
				"Skill created successfully",
				response,
				201
			));
	}

	/**
	 * GET /api/skill/{id}
	 * Get skill by ID
	 */
	@GetMapping("/{id}")
	@Operation(summary = "Get skill by ID", description = "Retrieve skill details by skill ID")
	@ApiResponses(value = {
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Skill fetched successfully"),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Skill not found")
	})
	public ResponseEntity<ApiResponse<SkillResponseDto>> getSkillById(@PathVariable Long id) {
		log.info("Fetching skill with ID: {}", id);

		SkillResponseDto response = skillService.getSkillById(id);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skill fetched successfully",
				response,
				200
			));
	}

	/**
	 * GET /api/skill
	 * Get all active skills
	 */
	@GetMapping
	@Operation(summary = "Get all skills", description = "Retrieve list of all active skills")
	@ApiResponses(value = {
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Skills fetched successfully"),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "500", description = "Internal server error")
	})
	public ResponseEntity<ApiResponse<List<SkillResponseDto>>> getAllSkills() {
		log.info("Fetching all active skills");

		List<SkillResponseDto> response = skillService.getAllActiveSkills();

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skills fetched successfully",
				response,
				200
			));
	}

	/**
	 * GET /api/skill/search?keyword=java
	 * Search skills by keyword
	 */
	@GetMapping("/search")	@Operation(summary = "Search skills", description = "Search and filter skills by keyword")
	@ApiResponses(value = {
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Skills found successfully"),
		@io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid search parameters")
	})	public ResponseEntity<ApiResponse<List<SkillResponseDto>>> searchSkills(
			@RequestParam String keyword) {

		log.info("Searching skills with keyword: {}", keyword);

		List<SkillResponseDto> response = skillService.searchSkills(keyword);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skills found",
				response,
				200
			));
	}

	/**
	 * GET /api/skill/category/{category}
	 * Get skills by category
	 */
	@GetMapping("/category/{category}")
	public ResponseEntity<ApiResponse<List<SkillResponseDto>>> getByCategory(
			@PathVariable String category) {

		log.info("Fetching skills for category: {}", category);

		List<SkillResponseDto> response = skillService.getSkillsByCategory(category);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skills fetched successfully",
				response,
				200
			));
	}

	/**
	 * PUT /api/skill/{id}
	 * Update skill (Admin only)
	 */
	@PutMapping("/{id}")
	public ResponseEntity<ApiResponse<SkillResponseDto>> updateSkill(
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@PathVariable Long id,
			@Valid @RequestBody CreateSkillRequestDto requestDto) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Only admins can update skills");
		}

		log.info("Updating skill with ID: {}", id);
		SkillResponseDto response = skillService.updateSkill(id, requestDto);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skill updated successfully",
				response,
				200
			));
	}

	/**
	 * DELETE /api/skill/{id}
	 * Delete skill (Admin only)
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<ApiResponse<Void>> deleteSkill(
			@Parameter(hidden = true) @RequestHeader(value = "roles", required = false) String roles,
			@PathVariable Long id) {

		if (roles == null || !roles.contains("ROLE_ADMIN")) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Only admins can delete skills");
		}

		log.info("Deleting skill with ID: {}", id);
		skillService.deleteSkill(id);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Skill deleted successfully",
				null,
				200
			));
	}

	/**
	 * POST /api/skill/{id}/popularity
	 * Increment or decrement skill popularity
	 */
	@io.swagger.v3.oas.annotations.Operation(summary = "Update skill popularity", description = "Increment or decrement a skill's learner count")
	@org.springframework.web.bind.annotation.PostMapping("/{id}/popularity")
	public ResponseEntity<ApiResponse<SkillResponseDto>> updatePopularity(
			@PathVariable Long id,
			@RequestParam boolean increment) {

		log.info("{} popularity for skill with ID: {}", increment ? "Incrementing" : "Decrementing", id);
		SkillResponseDto response = skillService.updatePopularity(id, increment);

		return ResponseEntity
			.ok(new ApiResponse<>(
				true,
				"Popularity updated successfully",
				response,
				200
			));
	}
}

