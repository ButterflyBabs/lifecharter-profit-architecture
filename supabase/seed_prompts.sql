-- Seed data for AI Prompts
-- Creates the 10 core prompts for The Profit Architecture assessment engine

BEGIN;

-- ============================================
-- 1. Create Prompt Registry Entries
-- ============================================

-- Prompt 1: Classification Router
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'classification_router',
  'Business Classification Router',
  'Determines the appropriate Profit Architecture pathway for a business based on its characteristics, model, and goals.',
  'classification',
  'Analyze business profile data and route to the correct pathway (nonprofit, coaching_consulting, subscription_membership, ecommerce, service, hybrid)',
  ARRAY['business_name', 'industry', 'revenue_model', 'customer_type', 'product_type', 'organization_structure'],
  ARRAY['pathway', 'confidence_score', 'reasoning', 'alternative_pathways'],
  '{
    "type": "object",
    "properties": {
      "business_name": {"type": "string"},
      "industry": {"type": "string"},
      "revenue_model": {"type": "string"},
      "customer_type": {"type": "string"},
      "product_type": {"type": "string"},
      "organization_structure": {"type": "string"}
    },
    "required": ["business_name", "industry"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "pathway": {"type": "string", "enum": ["nonprofit", "coaching_consulting", "subscription_membership", "ecommerce", "service", "hybrid"]},
      "confidence_score": {"type": "number", "minimum": 0, "maximum": 1},
      "reasoning": {"type": "string"},
      "alternative_pathways": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["pathway", "confidence_score"]
  }'::jsonb,
  'active'
);

-- Prompt 2: Assessment Section Analyst
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'assessment_section_analyst',
  'Assessment Section Analyst',
  'Analyzes a specific component section of the business assessment based on interview data and documents.',
  'analysis',
  'Evaluate one of the 12 assessment components and provide indicator scores with supporting evidence',
  ARRAY['component_code', 'component_name', 'indicators', 'interview_transcript', 'supporting_documents', 'business_context'],
  ARRAY['indicator_scores', 'evidence', 'confidence_level', 'notes'],
  '{
    "type": "object",
    "properties": {
      "component_code": {"type": "string"},
      "component_name": {"type": "string"},
      "indicators": {"type": "array"},
      "interview_transcript": {"type": "string"},
      "supporting_documents": {"type": "array"},
      "business_context": {"type": "object"}
    },
    "required": ["component_code", "indicators"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "indicator_scores": {"type": "array"},
      "evidence": {"type": "string"},
      "confidence_level": {"type": "string", "enum": ["high", "medium", "low"]},
      "notes": {"type": "string"}
    },
    "required": ["indicator_scores"]
  }'::jsonb,
  'active'
);

-- Prompt 3: Financial Document Analyst
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'financial_document_analyst',
  'Financial Document Analyst',
  'Extracts key financial metrics and insights from uploaded financial documents.',
  'analysis',
  'Parse financial statements, tax returns, and other financial documents to extract standardized metrics',
  ARRAY['document_type', 'document_content', 'period_covered', 'business_context'],
  ARRAY['revenue', 'expenses', 'profit_margin', 'cash_flow', 'key_metrics', 'trends', 'red_flags'],
  '{
    "type": "object",
    "properties": {
      "document_type": {"type": "string", "enum": ["p&l", "balance_sheet", "cash_flow", "tax_return", "bank_statement"]},
      "document_content": {"type": "string"},
      "period_covered": {"type": "string"},
      "business_context": {"type": "object"}
    },
    "required": ["document_type", "document_content"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "revenue": {"type": "object"},
      "expenses": {"type": "object"},
      "profit_margin": {"type": "number"},
      "cash_flow": {"type": "object"},
      "key_metrics": {"type": "object"},
      "trends": {"type": "array"},
      "red_flags": {"type": "array"}
    }
  }'::jsonb,
  'active'
);

-- Prompt 4: Founder Capacity Analyst
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'founder_capacity_analyst',
  'Founder Capacity Analyst',
  'Analyzes owner/founder workload, capacity constraints, and delegation opportunities.',
  'analysis',
  'Assess founder capacity based on time allocation, responsibilities, and team structure',
  ARRAY['founder_name', 'role_distribution', 'hours_per_week', 'key_responsibilities', 'delegation_status', 'team_capabilities'],
  ARRAY['capacity_score', 'bottlenecks', 'delegation_opportunities', 'workload_distribution', 'recommendations'],
  '{
    "type": "object",
    "properties": {
      "founder_name": {"type": "string"},
      "role_distribution": {"type": "object"},
      "hours_per_week": {"type": "number"},
      "key_responsibilities": {"type": "array"},
      "delegation_status": {"type": "object"},
      "team_capabilities": {"type": "object"}
    },
    "required": ["founder_name"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "capacity_score": {"type": "number", "minimum": 0, "maximum": 5},
      "bottlenecks": {"type": "array"},
      "delegation_opportunities": {"type": "array"},
      "workload_distribution": {"type": "object"},
      "recommendations": {"type": "array"}
    },
    "required": ["capacity_score"]
  }'::jsonb,
  'active'
);

-- Prompt 5: Pathway Analyst
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'pathway_analyst',
  'Pathway-Specific Rules Analyst',
  'Applies pathway-specific rules and considerations to assessment findings.',
  'analysis',
  'Adjust indicator scoring and recommendations based on pathway-specific factors',
  ARRAY['pathway', 'component_scores', 'business_model_details', 'industry_factors'],
  ARRAY['adjusted_scores', 'pathway_specific_insights', 'priority_areas'],
  '{
    "type": "object",
    "properties": {
      "pathway": {"type": "string"},
      "component_scores": {"type": "object"},
      "business_model_details": {"type": "object"},
      "industry_factors": {"type": "object"}
    },
    "required": ["pathway", "component_scores"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "adjusted_scores": {"type": "object"},
      "pathway_specific_insights": {"type": "array"},
      "priority_areas": {"type": "array"}
    },
    "required": ["adjusted_scores"]
  }'::jsonb,
  'active'
);

-- Prompt 6: Finding Synthesizer
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'finding_synthesizer',
  'Finding Synthesizer',
  'Synthesizes assessment findings into strengths and vulnerabilities.',
  'synthesis',
  'Analyze all component scores and evidence to identify key strengths and critical vulnerabilities',
  ARRAY['component_scores', 'indicator_scores', 'evidence', 'business_context'],
  ARRAY['strengths', 'vulnerabilities', 'risk_areas', 'opportunities'],
  '{
    "type": "object",
    "properties": {
      "component_scores": {"type": "object"},
      "indicator_scores": {"type": "object"},
      "evidence": {"type": "array"},
      "business_context": {"type": "object"}
    },
    "required": ["component_scores"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "strengths": {"type": "array"},
      "vulnerabilities": {"type": "array"},
      "risk_areas": {"type": "array"},
      "opportunities": {"type": "array"}
    },
    "required": ["strengths", "vulnerabilities"]
  }'::jsonb,
  'active'
);

-- Prompt 7: Recommendation Builder
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'recommendation_builder',
  'Recommendation Builder',
  'Builds prioritized recommendations based on assessment findings.',
  'generation',
  'Generate specific, actionable recommendations prioritized by impact and effort',
  ARRAY['vulnerabilities', 'strengths', 'business_goals', 'founder_capacity', 'resource_constraints'],
  ARRAY['recommendations', 'priority_matrix', 'quick_wins', 'strategic_initiatives'],
  '{
    "type": "object",
    "properties": {
      "vulnerabilities": {"type": "array"},
      "strengths": {"type": "array"},
      "business_goals": {"type": "array"},
      "founder_capacity": {"type": "object"},
      "resource_constraints": {"type": "object"}
    },
    "required": ["vulnerabilities"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "recommendations": {"type": "array"},
      "priority_matrix": {"type": "object"},
      "quick_wins": {"type": "array"},
      "strategic_initiatives": {"type": "array"}
    },
    "required": ["recommendations"]
  }'::jsonb,
  'active'
);

-- Prompt 8: Report Generator
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'report_generator',
  'Assessment Report Generator',
  'Assembles the final assessment report with all findings and recommendations.',
  'generation',
  'Generate a comprehensive, well-structured assessment report for the business owner',
  ARRAY['business_profile', 'component_scores', 'indicator_scores', 'strengths', 'vulnerabilities', 'recommendations', 'action_plan'],
  ARRAY['executive_summary', 'detailed_findings', 'scoring_breakdown', 'recommendations_section', 'action_plan_section'],
  '{
    "type": "object",
    "properties": {
      "business_profile": {"type": "object"},
      "component_scores": {"type": "object"},
      "indicator_scores": {"type": "object"},
      "strengths": {"type": "array"},
      "vulnerabilities": {"type": "array"},
      "recommendations": {"type": "array"},
      "action_plan": {"type": "object"}
    },
    "required": ["business_profile", "component_scores"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "executive_summary": {"type": "string"},
      "detailed_findings": {"type": "object"},
      "scoring_breakdown": {"type": "object"},
      "recommendations_section": {"type": "object"},
      "action_plan_section": {"type": "object"}
    },
    "required": ["executive_summary"]
  }'::jsonb,
  'active'
);

-- Prompt 9: Action Plan Builder
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'action_plan_builder',
  'Action Plan Builder',
  'Creates a capacity-aware action plan with prioritized steps.',
  'generation',
  'Build a realistic action plan considering founder capacity, resources, and priorities',
  ARRAY['recommendations', 'founder_capacity', 'available_resources', 'timeframe', 'constraints'],
  ARRAY['phased_plan', 'immediate_actions', '30_day_goals', '90_day_goals', 'resource_requirements'],
  '{
    "type": "object",
    "properties": {
      "recommendations": {"type": "array"},
      "founder_capacity": {"type": "object"},
      "available_resources": {"type": "object"},
      "timeframe": {"type": "string"},
      "constraints": {"type": "object"}
    },
    "required": ["recommendations"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "phased_plan": {"type": "object"},
      "immediate_actions": {"type": "array"},
      "30_day_goals": {"type": "array"},
      "90_day_goals": {"type": "array"},
      "resource_requirements": {"type": "object"}
    },
    "required": ["phased_plan"]
  }'::jsonb,
  'active'
);

-- Prompt 10: Ongoing Advisor
INSERT INTO public.tpa_prompts (
  key, name, description, category, purpose, expected_inputs, expected_outputs, input_schema, output_schema, status
) VALUES (
  'ongoing_advisor',
  'Ongoing Advisor Session',
  'Conducts follow-up advisory sessions with business owners.',
  'advisory',
  'Guide ongoing advisory conversations, track progress, and provide continued guidance',
  ARRAY['session_history', 'current_challenges', 'progress_since_last', 'new_goals', 'business_updates'],
  ARRAY['session_agenda', 'discussion_points', 'progress_assessment', 'new_recommendations', 'homework'],
  '{
    "type": "object",
    "properties": {
      "session_history": {"type": "array"},
      "current_challenges": {"type": "array"},
      "progress_since_last": {"type": "object"},
      "new_goals": {"type": "array"},
      "business_updates": {"type": "object"}
    },
    "required": ["session_history"]
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "session_agenda": {"type": "array"},
      "discussion_points": {"type": "array"},
      "progress_assessment": {"type": "object"},
      "new_recommendations": {"type": "array"},
      "homework": {"type": "array"}
    },
    "required": ["session_agenda"]
  }'::jsonb,
  'active'
);

COMMIT;
