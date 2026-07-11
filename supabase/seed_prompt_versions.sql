-- Seed data for Prompt Versions
-- Creates initial draft versions for all 10 prompts

BEGIN;

DO $$
DECLARE
  v_prompt_id UUID;
BEGIN
  -- ============================================
  -- Prompt Version 1: Classification Router
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'classification_router';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Analyze the following business profile and determine the most appropriate Profit Architecture pathway:\n\nBusiness Name: {{business_name}}\nIndustry: {{industry}}\nRevenue Model: {{revenue_model}}\nCustomer Type: {{customer_type}}\nProduct/Service Type: {{product_type}}\nOrganization Structure: {{organization_structure}}\n\nAvailable Pathways:\n1. nonprofit - Organizations focused on mission over profit\n2. coaching_consulting - Expertise-based service businesses\n3. subscription_membership - Recurring revenue through subscriptions\n4. ecommerce - Online product sales\n5. service - Project or ongoing service delivery\n6. hybrid - Combination of multiple models\n\nAnalyze the characteristics and provide:\n1. The primary pathway recommendation\n2. Confidence score (0-1)\n3. Detailed reasoning\n4. Alternative pathways to consider\n\nRespond in JSON format.',
    'handlebars',
    'You are an expert business analyst specializing in business model classification. Your task is to accurately categorize businesses into the appropriate Profit Architecture pathway based on their characteristics.',
    '{"temperature": 0.3, "max_tokens": 2000}'::jsonb,
    'draft',
    'Initial draft of classification router prompt'
  );
  
  -- ============================================
  -- Prompt Version 2: Assessment Section Analyst
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'assessment_section_analyst';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'You are analyzing the following assessment component for a business:\n\nComponent: {{component_name}} ({{component_code}})\n\nIndicators to evaluate:\n{{#each indicators}}\n- {{name}}: {{description}}\n  Score 0: {{guidance_score_0}}\n  Score 1: {{guidance_score_1}}\n  Score 2: {{guidance_score_2}}\n  Score 3: {{guidance_score_3}}\n  Score 4: {{guidance_score_4}}\n  Score 5: {{guidance_score_5}}\n{{/each}}\n\nInterview Transcript:\n{{interview_transcript}}\n\nSupporting Documents:\n{{#each supporting_documents}}\n- {{type}}: {{content}}\n{{/each}}\n\nBusiness Context:\n{{business_context}}\n\nEvaluate each indicator on a scale of 0-5 based on the evidence provided. For each indicator:\n1. Assign a score (0-5 or null if insufficient data)\n2. Provide specific evidence supporting the score\n3. Note any uncertainties\n\nRespond in JSON format with indicator_scores array.',
    'handlebars',
    'You are an expert business assessor. Your role is to objectively evaluate businesses across multiple dimensions using evidence-based scoring. Be thorough, fair, and consistent in your assessments.',
    '{"temperature": 0.2, "max_tokens": 4000}'::jsonb,
    'draft',
    'Initial draft of assessment section analyst prompt'
  );
  
  -- ============================================
  -- Prompt Version 3: Financial Document Analyst
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'financial_document_analyst';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Analyze the following financial document:\n\nDocument Type: {{document_type}}\nPeriod Covered: {{period_covered}}\n\nDocument Content:\n{{document_content}}\n\nBusiness Context:\n{{business_context}}\n\nExtract and analyze:\n1. Revenue figures (total, recurring, by category if available)\n2. Expense breakdown (COGS, operating expenses, etc.)\n3. Profit margins (gross, net, by product/service if available)\n4. Cash flow indicators\n5. Key financial ratios and metrics\n6. Trends compared to previous periods if data available\n7. Red flags or areas of concern\n\nRespond in structured JSON format with all extracted metrics.',
    'handlebars',
    'You are a financial analyst expert. Extract key financial metrics from documents accurately and identify trends, patterns, and red flags. Be precise with numbers and calculations.',
    '{"temperature": 0.1, "max_tokens": 3000}'::jsonb,
    'draft',
    'Initial draft of financial document analyst prompt'
  );
  
  -- ============================================
  -- Prompt Version 4: Founder Capacity Analyst
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'founder_capacity_analyst';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Analyze the capacity and workload of the business owner/founder:\n\nFounder: {{founder_name}}\n\nHours per Week: {{hours_per_week}}\n\nKey Responsibilities:\n{{#each key_responsibilities}}\n- {{this}}\n{{/each}}\n\nRole Distribution:\n{{role_distribution}}\n\nCurrent Delegation Status:\n{{delegation_status}}\n\nTeam Capabilities:\n{{team_capabilities}}\n\nAssess:\n1. Overall capacity score (0-5)\n2. Current bottlenecks where founder is constrained\n3. Delegation opportunities with highest impact\n4. Recommended workload redistribution\n5. Specific recommendations for capacity expansion\n\nRespond in JSON format.',
    'handlebars',
    'You are an expert in organizational design and founder coaching. Assess founder capacity objectively and provide practical recommendations for delegation and workload optimization.',
    '{"temperature": 0.3, "max_tokens": 2500}'::jsonb,
    'draft',
    'Initial draft of founder capacity analyst prompt'
  );
  
  -- ============================================
  -- Prompt Version 5: Pathway Analyst
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'pathway_analyst';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Apply pathway-specific analysis to the following business assessment:\n\nPathway: {{pathway}}\n\nComponent Scores:\n{{component_scores}}\n\nBusiness Model Details:\n{{business_model_details}}\n\nIndustry Factors:\n{{industry_factors}}\n\nConsider pathway-specific factors:\n- Nonprofit: Mission alignment, funding diversity, donor relationships\n- Coaching/Consulting: Expertise depth, client capacity, IP development\n- Subscription/Membership: Retention metrics, LTV/CAC, churn patterns\n- Ecommerce: Unit economics, inventory management, channel diversity\n- Service: Project pipeline, utilization rates, delivery capacity\n- Hybrid: Integration challenges, complexity management\n\nProvide:\n1. Adjusted scores considering pathway context\n2. Pathway-specific insights and considerations\n3. Priority areas unique to this pathway\n\nRespond in JSON format.',
    'handlebars',
    'You are an expert in business model analysis across multiple pathways. Apply pathway-specific knowledge to refine assessment findings and identify model-specific opportunities and risks.',
    '{"temperature": 0.3, "max_tokens": 3000}'::jsonb,
    'draft',
    'Initial draft of pathway analyst prompt'
  );
  
  -- ============================================
  -- Prompt Version 6: Finding Synthesizer
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'finding_synthesizer';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Synthesize the following assessment data into key findings:\n\nComponent Scores:\n{{component_scores}}\n\nIndicator Scores:\n{{indicator_scores}}\n\nEvidence:\n{{#each evidence}}\n- {{source}}: {{content}}\n{{/each}}\n\nBusiness Context:\n{{business_context}}\n\nIdentify and categorize:\n1. STRENGTHS: Areas scoring 4+ with solid evidence\n2. VULNERABILITIES: Areas scoring 0-2 or showing concerning patterns\n3. RISK AREAS: Components with inconsistent scores or conflicting evidence\n4. OPPORTUNITIES: Areas with potential for improvement based on context\n\nFor each finding, include:\n- The specific component/indicator\n- The score or pattern\n- Supporting evidence\n- Business impact assessment\n\nRespond in structured JSON format.',
    'handlebars',
    'You are an expert business strategist. Synthesize assessment data into actionable insights. Be balanced in identifying both strengths and vulnerabilities, and prioritize findings by business impact.',
    '{"temperature": 0.3, "max_tokens": 4000}'::jsonb,
    'draft',
    'Initial draft of finding synthesizer prompt'
  );
  
  -- ============================================
  -- Prompt Version 7: Recommendation Builder
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'recommendation_builder';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Build prioritized recommendations based on the following assessment:\n\nVulnerabilities:\n{{#each vulnerabilities}}\n- {{component}}: {{description}} (Impact: {{impact}}, Score: {{score}})\n{{/each}}\n\nStrengths:\n{{#each strengths}}\n- {{component}}: {{description}}\n{{/each}}\n\nBusiness Goals:\n{{business_goals}}\n\nFounder Capacity:\n{{founder_capacity}}\n\nResource Constraints:\n{{resource_constraints}}\n\nGenerate recommendations that:\n1. Address critical vulnerabilities first\n2. Leverage existing strengths\n3. Align with stated business goals\n4. Are feasible given capacity and resources\n5. Include estimated impact and effort for each\n\nCategorize as:\n- Quick Wins (high impact, low effort)\n- Strategic Initiatives (high impact, high effort)\n- Improvements (lower priority but valuable)\n\nRespond in JSON format with full recommendation details.',
    'handlebars',
    'You are an expert business advisor. Create practical, prioritized recommendations that balance impact with feasibility. Consider the whole business context, not just isolated issues.',
    '{"temperature": 0.4, "max_tokens": 4000}'::jsonb,
    'draft',
    'Initial draft of recommendation builder prompt'
  );
  
  -- ============================================
  -- Prompt Version 8: Report Generator
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'report_generator';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Generate a comprehensive assessment report for:\n\nBusiness Profile:\n{{business_profile}}\n\nComponent Scores:\n{{component_scores}}\n\nIndicator Scores:\n{{indicator_scores}}\n\nStrengths:\n{{strengths}}\n\nVulnerabilities:\n{{vulnerabilities}}\n\nRecommendations:\n{{recommendations}}\n\nAction Plan:\n{{action_plan}}\n\nCreate a well-structured report with:\n1. EXECUTIVE SUMMARY: Overall health score, key findings, top priorities\n2. DETAILED FINDINGS: Component-by-component analysis with evidence\n3. SCORING BREAKDOWN: Visual representation of scores\n4. RECOMMENDATIONS: Prioritized action items with rationale\n5. ACTION PLAN: Phased implementation approach\n\nTone should be professional, constructive, and actionable. Balance honesty about vulnerabilities with recognition of strengths.\n\nRespond with the complete report text.',
    'handlebars',
    'You are an expert business report writer. Create clear, professional assessment reports that business owners can understand and act upon. Balance thoroughness with readability.',
    '{"temperature": 0.4, "max_tokens": 6000}'::jsonb,
    'draft',
    'Initial draft of report generator prompt'
  );
  
  -- ============================================
  -- Prompt Version 9: Action Plan Builder
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'action_plan_builder';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Create a capacity-aware action plan:\n\nRecommendations:\n{{recommendations}}\n\nFounder Capacity Assessment:\n{{founder_capacity}}\n\nAvailable Resources:\n{{available_resources}}\n\nTimeframe: {{timeframe}}\n\nConstraints:\n{{constraints}}\n\nBuild a realistic action plan with:\n1. IMMEDIATE ACTIONS (Week 1): Quick wins requiring minimal resources\n2. 30-DAY GOALS: High-priority items that can be accomplished in first month\n3. 90-DAY GOALS: Medium-term objectives requiring more effort\n4. ONGOING INITIATIVES: Longer-term strategic work\n\nFor each action item include:\n- Specific task description\n- Owner/responsible party\n- Estimated time required\n- Resources needed\n- Success criteria\n- Dependencies\n\nEnsure the plan respects founder capacity and resource constraints.\n\nRespond in structured JSON format.',
    'handlebars',
    'You are an expert implementation planner. Create actionable plans that respect real-world constraints. Be realistic about what can be accomplished given capacity and resources.',
    '{"temperature": 0.3, "max_tokens": 5000}'::jsonb,
    'draft',
    'Initial draft of action plan builder prompt'
  );
  
  -- ============================================
  -- Prompt Version 10: Ongoing Advisor
  -- ============================================
  SELECT id INTO v_prompt_id FROM public.tpa_prompts WHERE key = 'ongoing_advisor';
  
  INSERT INTO public.tpa_prompt_versions (
    prompt_id, version, template, template_format, system_prompt, model_config, status, change_summary
  ) VALUES (
    v_prompt_id,
    '1.0.0',
    E'Prepare for an ongoing advisory session:\n\nSession History:\n{{#each session_history}}\n- Date: {{date}}, Topics: {{topics}}, Actions: {{actions}}\n{{/each}}\n\nCurrent Challenges:\n{{current_challenges}}\n\nProgress Since Last Session:\n{{progress_since_last}}\n\nNew Goals:\n{{new_goals}}\n\nBusiness Updates:\n{{business_updates}}\n\nCreate a session agenda including:\n1. PROGRESS REVIEW: What has been accomplished since last session\n2. CHALLENGE DISCUSSION: Current obstacles and blockers\n3. GOAL ALIGNMENT: Review and adjust goals as needed\n4. NEW RECOMMENDATIONS: Additional guidance based on updates\n5. HOMEWORK: Specific action items for next period\n\nTone should be supportive but challenging, focused on accountability and progress.\n\nRespond in JSON format with session structure.',
    'handlebars',
    'You are an experienced business advisor and coach. Guide ongoing advisory relationships with a balance of support and accountability. Focus on progress, learning, and continuous improvement.',
    '{"temperature": 0.4, "max_tokens": 3500}'::jsonb,
    'draft',
    'Initial draft of ongoing advisor prompt'
  );

END $$;

COMMIT;
