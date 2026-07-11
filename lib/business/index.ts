// lib/business/index.ts
// Export all business-related modules

// Export from classification (these are the source of truth for classification types)
export {
  classifyBusiness,
  calculateConfidence,
  getPathwayRules,
  getPathwayInfo,
  type OrganizationType,
  type BusinessModel,
  type CustomerType,
  type BusinessStage,
  type Pathway,
  type EvidenceItem,
  type BusinessClassification,
  type ClassificationInput,
} from './classification';

// Export from types (database entity types - no overlaps with classification)
export type {
  Business,
  BusinessGoal,
  BusinessConcern,
  BusinessAssignment,
  BusinessClassificationRecord,
  BusinessBaseline,
  BusinessTeamMember,
  BusinessGoalRecord,
  CreateBusinessInput,
  UpdateBusinessInput,
  CreateClassificationInput,
  CreateTeamMemberInput,
  CreateGoalInput,
  ClassificationWizardStep,
} from './types';

// Export constants from types
export { classificationWizardSteps, industries, usStates } from './types';
