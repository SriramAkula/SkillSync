// ─── Skill ────────────────────────────────────────────────────────────────────
export interface SkillDto {
  id: number;
  skillName: string;
  description?: string;
  category?: string;
  popularityScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillRequest {
  skillName: string;
  description?: string;
  category?: string;
}
