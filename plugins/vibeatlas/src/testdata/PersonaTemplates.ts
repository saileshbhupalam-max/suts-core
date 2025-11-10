/**
 * VibeAtlas-specific persona templates
 */

import type { PersonaProfile } from '@suts/core';

/**
 * Skeptical Developer persona
 */
export const skepticalDev: PersonaProfile = {
  id: 'skeptical-dev-001',
  archetype: 'Skeptical Developer',
  role: 'Senior Backend Engineer',
  experienceLevel: 'Expert',
  companySize: 'Enterprise',
  techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis'],
  painPoints: ['Tool bloat', 'Vendor lock-in', 'Hidden costs', 'Performance overhead'],
  goals: ['Maintain productivity', 'Control costs', 'Avoid distractions'],
  fears: ['Wasted time', 'Budget overruns', 'Dependency on proprietary tools'],
  values: ['Efficiency', 'Transparency', 'Control'],
  riskTolerance: 0.3,
  patienceLevel: 0.4,
  techAdoption: 'Late majority',
  learningStyle: 'Documentation',
  evaluationCriteria: ['ROI', 'Performance', 'Cost transparency', 'Exit strategy'],
  dealBreakers: ['Unclear pricing', 'Poor performance', 'Vendor lock-in'],
  delightTriggers: ['Exceeds expectations', 'Clear value', 'Saves time'],
  referralTriggers: ['Proven ROI', 'Team productivity gains'],
  typicalWorkflow: 'Deep focus sessions, minimal interruptions',
  timeAvailability: 'Limited',
  collaborationStyle: 'Solo',
  state: {},
  history: [],
  confidenceScore: 0.85,
  lastUpdated: new Date().toISOString(),
  source: 'VibeAtlas persona template',
};

/**
 * Early Adopter persona
 */
export const earlyAdopter: PersonaProfile = {
  id: 'early-adopter-001',
  archetype: 'Early Adopter',
  role: 'Full Stack Developer',
  experienceLevel: 'Intermediate',
  companySize: 'Startup',
  techStack: ['React', 'TypeScript', 'Python', 'AWS'],
  painPoints: ['Slow development', 'Context switching', 'Manual tasks'],
  goals: ['Ship faster', 'Learn new tools', 'Stay ahead of curve'],
  fears: ['Falling behind', 'Missing opportunities', 'Slow iteration'],
  values: ['Innovation', 'Speed', 'Growth'],
  riskTolerance: 0.8,
  patienceLevel: 0.7,
  techAdoption: 'Early adopter',
  learningStyle: 'Trial-error',
  evaluationCriteria: ['Innovation', 'Speed', 'Developer experience', 'Community'],
  dealBreakers: ['Poor UX', 'Slow iteration', 'Lack of updates'],
  delightTriggers: ['Novel features', 'Productivity boost', 'Great UX'],
  referralTriggers: ['Excited about features', 'Visible wins'],
  typicalWorkflow: 'Fast-paced, experimental, collaborative',
  timeAvailability: 'Flexible',
  collaborationStyle: 'Team',
  state: {},
  history: [],
  confidenceScore: 0.75,
  lastUpdated: new Date().toISOString(),
  source: 'VibeAtlas persona template',
};

/**
 * Pragmatic Team Lead persona
 */
export const pragmaticLead: PersonaProfile = {
  id: 'pragmatic-lead-001',
  archetype: 'Pragmatic Team Lead',
  role: 'Engineering Manager',
  experienceLevel: 'Expert',
  companySize: 'SMB',
  techStack: ['JavaScript', 'TypeScript', 'AWS', 'Docker'],
  painPoints: ['Team productivity', 'Knowledge silos', 'Onboarding time'],
  goals: ['Scale team', 'Improve metrics', 'Reduce friction'],
  fears: ['Team burnout', 'Missed deadlines', 'Poor quality'],
  values: ['Team success', 'Measurable results', 'Sustainability'],
  riskTolerance: 0.6,
  patienceLevel: 0.6,
  techAdoption: 'Early majority',
  learningStyle: 'Peer learning',
  evaluationCriteria: ['Team impact', 'Metrics', 'Adoption rate', 'Support'],
  dealBreakers: ['No team features', 'Poor metrics', 'Difficult onboarding'],
  delightTriggers: ['Team wins', 'Clear metrics', 'Easy sharing'],
  referralTriggers: ['Team productivity gains', 'Positive metrics'],
  typicalWorkflow: 'Meetings, code reviews, planning',
  timeAvailability: 'Limited',
  collaborationStyle: 'Team',
  state: {},
  history: [],
  confidenceScore: 0.8,
  lastUpdated: new Date().toISOString(),
  source: 'VibeAtlas persona template',
};

/**
 * Budget-Conscious Developer persona
 */
export const budgetConscious: PersonaProfile = {
  id: 'budget-conscious-001',
  archetype: 'Budget-Conscious Developer',
  role: 'Frontend Developer',
  experienceLevel: 'Novice',
  companySize: 'Startup',
  techStack: ['React', 'JavaScript', 'CSS'],
  painPoints: ['Limited budget', 'Cost uncertainty', 'Free tier limitations'],
  goals: ['Try before buy', 'Understand costs', 'Maximize value'],
  fears: ['Unexpected bills', 'Commitment without trial', 'Cost overruns'],
  values: ['Transparency', 'Value for money', 'Flexibility'],
  riskTolerance: 0.2,
  patienceLevel: 0.5,
  techAdoption: 'Late majority',
  learningStyle: 'Video',
  evaluationCriteria: ['Pricing clarity', 'Free trial', 'Value', 'No surprises'],
  dealBreakers: ['Hidden costs', 'No trial', 'Forced upgrade'],
  delightTriggers: ['Clear pricing', 'Generous trial', 'No surprises'],
  referralTriggers: ['Good value', 'Fair pricing'],
  typicalWorkflow: 'Careful evaluation, thorough testing',
  timeAvailability: 'Moderate',
  collaborationStyle: 'Solo',
  state: {},
  history: [],
  confidenceScore: 0.65,
  lastUpdated: new Date().toISOString(),
  source: 'VibeAtlas persona template',
};

/**
 * Power User persona
 */
export const powerUser: PersonaProfile = {
  id: 'power-user-001',
  archetype: 'Power User',
  role: 'Senior Full Stack Developer',
  experienceLevel: 'Expert',
  companySize: 'Enterprise',
  techStack: ['TypeScript', 'React', 'Node.js', 'Python', 'Rust'],
  painPoints: ['Tool limitations', 'Lack of customization', 'Missing features'],
  goals: ['Maximum productivity', 'Deep customization', 'Advanced features'],
  fears: ['Tool constraints', 'Wasted potential', 'Switching costs'],
  values: ['Power', 'Flexibility', 'Efficiency'],
  riskTolerance: 0.7,
  patienceLevel: 0.8,
  techAdoption: 'Early adopter',
  learningStyle: 'Documentation',
  evaluationCriteria: ['Advanced features', 'Customization', 'API access', 'Performance'],
  dealBreakers: ['Limited features', 'No API', 'Poor performance'],
  delightTriggers: ['Advanced features', 'Deep customization', 'Unexpected power'],
  referralTriggers: ['Features others dont have', 'Competitive advantage'],
  typicalWorkflow: 'Highly customized, automated, efficient',
  timeAvailability: 'High',
  collaborationStyle: 'Community-driven',
  state: {},
  history: [],
  confidenceScore: 0.9,
  lastUpdated: new Date().toISOString(),
  source: 'VibeAtlas persona template',
};

/**
 * Get all persona templates
 */
export function getAllPersonaTemplates(): PersonaProfile[] {
  return [skepticalDev, earlyAdopter, pragmaticLead, budgetConscious, powerUser];
}

/**
 * Get persona by archetype
 */
export function getPersonaByArchetype(archetype: string): PersonaProfile | undefined {
  const templates = getAllPersonaTemplates();
  return templates.find((p) => p.archetype === archetype);
}
