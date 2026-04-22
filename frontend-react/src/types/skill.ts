export interface Skill {
  id: number;
  skillName: string;
  category: string;
  description?: string;
  popularityScore?: number;
  isActive?: boolean;
}

export interface SkillCategoryGroup {
  category: string;
  skills: Skill[];
}
