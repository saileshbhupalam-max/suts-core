/**
 * Persona-related types
 */

/**
 * Persona profile representing a simulated user
 */
export interface PersonaProfile {
  id: string;
  archetype: string;
  role: string;
  experienceLevel: 'Novice' | 'Intermediate' | 'Expert';
  companySize: 'Startup' | 'SMB' | 'Enterprise';
  techStack: string[];
  painPoints: string[];
  goals: string[];
  fears: string[];
  values: string[];
  riskTolerance: number;
  patienceLevel: number;
  techAdoption: 'Early adopter' | 'Early majority' | 'Late majority' | 'Laggard';
  learningStyle: 'Trial-error' | 'Documentation' | 'Video' | 'Peer learning';
  evaluationCriteria: string[];
  dealBreakers: string[];
  delightTriggers: string[];
  referralTriggers: string[];
  typicalWorkflow: string;
  timeAvailability: string;
  collaborationStyle: 'Solo' | 'Team' | 'Community-driven';
  state: Record<string, unknown>;
  history: Array<Record<string, unknown>>;
  confidenceScore: number;
  lastUpdated: string;
  source: string;
}
