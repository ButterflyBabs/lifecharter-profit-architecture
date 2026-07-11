-- Seed data for The Profit Architecture Methodology Framework
-- Phase 3: Methodology Framework Seed Data

-- Note: Run this after applying migrations 015-020
-- This creates v1.0.0 of the methodology with all 12 components and ~40 indicators

BEGIN;

-- ============================================
-- 1. Create Initial Methodology Version
-- ============================================

INSERT INTO public.tpa_methodology_versions (
  version, name, description, status, effective_from, release_notes, changes_summary, breaking_changes
) VALUES (
  '1.0.0',
  'The Profit Architecture Core Methodology',
  'Initial release of The Profit Architecture assessment methodology. 12 components covering all aspects of business health and growth readiness.',
  'active',
  CURRENT_DATE,
  'Initial release of The Profit Architecture methodology framework.',
  'First version with 12 assessment components, ~40 indicators, and complete scoring guidance.',
  false
);

-- Get the methodology version ID for later use
DO $$
DECLARE
  v_methodology_id UUID;
BEGIN
  SELECT id INTO v_methodology_id FROM public.tpa_methodology_versions WHERE version = '1.0.0';
  
  -- ============================================
  -- 2. Create the 12 Components
  -- ============================================
  
  -- Component 1: Financial Health (15%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'financial_health', 'Financial Health', 
   'Overall financial stability including cash flow, profitability, debt management, and financial record keeping. The foundation of business sustainability.',
   15.00, 1, true, false, '{}', 'active');
   
  -- Component 2: Pricing and Profitability (15%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'pricing_profitability', 'Pricing and Profitability', 
   'Pricing strategy effectiveness, margin analysis, cost structure optimization, and profit capture mechanisms.',
   15.00, 2, true, false, '{}', 'active');
   
  -- Component 3: Customer and Market (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'customer_market', 'Customer and Market', 
   'Understanding of target customers, market positioning, competitive landscape, and market opportunity size.',
   10.00, 3, true, false, '{}', 'active');
   
  -- Component 4: Product, Program, or Offer (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'product_offer', 'Product, Program, or Offer', 
   'Quality and differentiation of offerings, product-market fit, offer stack design, and value proposition clarity.',
   10.00, 4, true, false, '{}', 'active');
   
  -- Component 5: Sales (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'sales', 'Sales', 
   'Sales process effectiveness, conversion rates, sales team capability, and revenue predictability.',
   10.00, 5, true, false, '{}', 'active');
   
  -- Component 6: Marketing (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'marketing', 'Marketing', 
   'Marketing strategy, lead generation effectiveness, brand awareness, and customer acquisition efficiency.',
   10.00, 6, true, false, '{}', 'active');
   
  -- Component 7: People and Team (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'people_team', 'People and Team', 
   'Team structure, talent quality, culture, retention, and organizational capability to execute.',
   10.00, 7, true, false, '{}', 'active');
   
  -- Component 8: Process and Operations (10%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'process_operations', 'Process and Operations', 
   'Operational efficiency, process documentation, quality control, and delivery consistency.',
   10.00, 8, true, false, '{}', 'active');
   
  -- Component 9: Owner and Leadership (5%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'owner_leadership', 'Owner and Leadership', 
   'Leadership effectiveness, owner capacity, decision-making quality, and strategic vision.',
   5.00, 9, true, false, '{}', 'active');
   
  -- Component 10: Customer Experience (5%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'customer_experience', 'Customer Experience', 
   'End-to-end customer journey quality, satisfaction levels, support effectiveness, and loyalty metrics.',
   5.00, 10, true, false, '{}', 'active');
   
  -- Component 11: Technology and Data (5%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'technology_data', 'Technology and Data', 
   'Technology infrastructure, data utilization, automation level, and digital maturity.',
   5.00, 11, true, false, '{}', 'active');
   
  -- Component 12: Growth Readiness (5%)
  INSERT INTO public.tpa_components (
    methodology_version_id, code, name, description, default_weight, sort_order, is_universal, pathway_specific, applicable_pathways, status
  ) VALUES
  (v_methodology_id, 'growth_readiness', 'Growth Readiness', 
   'Capacity to scale, growth infrastructure, funding access, and strategic growth planning.',
   5.00, 12, true, false, '{}', 'active');

END $$;

-- ============================================
-- 3. Create Indicators (~40 total)
-- ============================================

-- FINANCIAL HEALTH INDICATORS (4 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'cash_flow_stability', 'Cash Flow Stability', 'Consistency and predictability of cash inflows and outflows',
  'Severe cash flow crisis - unable to meet payroll or critical obligations',
  'Frequent cash shortages - regularly struggling to pay bills on time',
  'Inconsistent cash flow - unpredictable highs and lows, frequent stress',
  'Moderately stable - occasional tight months but generally manageable',
  'Stable cash flow - predictable patterns, comfortable buffer maintained',
  'Highly stable - strong cash reserves, excellent predictability, no stress',
  'Insufficient financial data to assess cash flow patterns',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'profitability_trend', 'Profitability Trend', 'Direction and sustainability of profit margins over time',
  'Severe losses - business is bleeding money, survival in question',
  'Declining profitability - margins shrinking, losses or near-break-even',
  'Flat/uncertain - inconsistent profits, unclear trend direction',
  'Modest profits - positive but thin margins, room for improvement',
  'Healthy profits - consistent margins, improving trend, sustainable',
  'Excellent profitability - strong margins, consistent growth, highly efficient',
  'Financial records insufficient to determine profitability trend',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'debt_management', 'Debt and Financial Obligations', 'Management of debt, credit, and financial commitments',
  'Crisis level - default risk, collections, unable to service debt',
  'High risk - maxed credit, missed payments, debt overwhelming revenue',
  'Concerning - high debt load, minimum payments only, limited flexibility',
  'Manageable - some debt but under control, reasonable terms',
  'Healthy - low debt, good credit, favorable terms, strategic leverage only',
  'Excellent - debt-free or minimal strategic debt, strong credit, full flexibility',
  'Debt situation unclear or not disclosed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'financial_records', 'Financial Record Quality', 'Accuracy, timeliness, and usefulness of financial records',
  'No records - flying blind, no bookkeeping system in place',
  'Poor records - outdated, inaccurate, or incomplete financial data',
  'Basic records - some tracking but inconsistent or hard to use',
  'Adequate records - regular bookkeeping, basic reports available',
  'Good records - accurate, timely, useful reports for decision-making',
  'Excellent records - real-time data, detailed analytics, fully actionable',
  'Unable to assess record quality',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- PRICING AND PROFITABILITY INDICATORS (4 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'pricing_strategy', 'Pricing Strategy Effectiveness', 'How well pricing captures value and supports profitability',
  'No pricing strategy - random pricing, undercharging significantly',
  'Weak pricing - competing on price, margins too thin, frequent discounting',
  'Basic pricing - cost-plus approach, limited value-based thinking',
  'Developing - some value-based elements, testing different approaches',
  'Strong pricing - value-based, good margins, strategic positioning',
  'Excellent pricing - premium positioning, optimal margins, price leadership',
  'Pricing approach unclear or not articulated',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'cost_structure', 'Cost Structure Optimization', 'Efficiency of cost base and expense management',
  'Severe bloat - major unnecessary expenses, no cost awareness',
  'High costs - significant waste, poor expense control, eroding margins',
  'Average costs - typical for industry but not optimized',
  'Improving - cost awareness, some optimization efforts underway',
  'Lean operations - efficient cost structure, good expense management',
  'Optimized - best-in-class efficiency, strategic cost management',
  'Cost structure not analyzed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'margin_health', 'Margin Health', 'Gross and net margin levels and sustainability',
  'Negative margins - losing money on every sale',
  'Poor margins - single-digit or negative net margins, unsustainable',
  'Thin margins - low teens, vulnerable to market shifts',
  'Adequate margins - industry average, sustainable but not exciting',
  'Healthy margins - above industry average, good cushion',
  'Excellent margins - significantly above industry, strong competitive advantage',
  'Margin data unavailable or unclear',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'profit_capture', 'Profit Capture Mechanisms', 'Systems to ensure profits are actually realized',
  'No systems - revenue leaks everywhere, no profit protection',
  'Weak capture - frequent write-offs, refunds, unbilled work, scope creep',
  'Basic capture - some controls but frequent exceptions',
  'Adequate - standard processes, most revenue captured properly',
  'Strong capture - robust systems, minimal leakage, good enforcement',
  'Excellent capture - airtight systems, proactive profit protection',
  'Unable to assess profit capture effectiveness',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- CUSTOMER AND MARKET INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'customer_clarity', 'Customer Clarity', 'How well the business understands its target customers',
  'No clarity - trying to serve everyone, no target customer definition',
  'Vague idea - general sense but no specific customer profile',
  'Basic profile - demographic info but limited psychographic understanding',
  'Clear profile - well-defined target with needs and behaviors mapped',
  'Deep understanding - detailed personas, journey mapping, strong empathy',
  'Exceptional clarity - predictive understanding, anticipates needs, intimate knowledge',
  'Customer understanding not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'market_position', 'Market Position', 'Competitive positioning and differentiation in the market',
  'No position - invisible in market, commodity player',
  'Weak position - undifferentiated, price competition, ignored by market',
  'Emerging position - some differentiation but not well recognized',
  'Established position - known in niche, some differentiation working',
  'Strong position - clear differentiation, respected brand, preferred choice',
  'Dominant position - market leader, category defining, premium status',
  'Market position unclear',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'market_opportunity', 'Market Opportunity Size', 'Assessment of addressable market and growth potential',
  'Tiny/niche - extremely limited market, growth ceiling very low',
  'Small market - limited opportunity, growth constrained by market size',
  'Moderate market - decent size but significant competition',
  'Good opportunity - sizeable market, room for growth',
  'Large opportunity - substantial market, strong growth potential',
  'Massive opportunity - huge addressable market, blue ocean potential',
  'Market size not analyzed',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- PRODUCT/OFFER INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'product_quality', 'Product/Service Quality', 'Quality level and consistency of core offerings',
  'Poor quality - frequent complaints, returns, failures',
  'Below average - quality issues common, customer dissatisfaction',
  'Average quality - meets basic expectations, unremarkable',
  'Good quality - solid offering, meets expectations consistently',
  'High quality - exceeds expectations, strong reputation for quality',
  'Exceptional quality - best-in-class, raving fans, premium justified',
  'Quality not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'product_market_fit', 'Product-Market Fit', 'How well offerings match market needs and demands',
  'No fit - product does not solve real customer problem',
  'Poor fit - significant mismatch between offering and market needs',
  'Partial fit - works for some customers but not broadly',
  'Good fit - meets market needs for target segment',
  'Strong fit - high demand, customers love it, word of mouth',
  'Perfect fit - must-have product, customers desperate for it, viral growth',
  'Product-market fit not validated',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'offer_design', 'Offer Design and Packaging', 'How well offerings are structured, priced, and presented',
  'Poor design - confusing offers, wrong packaging, hard to buy',
  'Weak design - unclear value, complicated options, friction in purchase',
  'Basic design - standard offers, nothing special, functional',
  'Good design - clear value proposition, logical structure, easy to buy',
  'Strong design - compelling offers, great packaging, high conversion',
  'Excellent design - irresistible offers, perfect packaging, premium pricing accepted',
  'Offer design not evaluated',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- SALES INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'sales_process', 'Sales Process Effectiveness', 'Quality and consistency of the sales process',
  'No process - chaotic, random approach, no methodology',
  'Weak process - ad-hoc selling, inconsistent results, high variability',
  'Basic process - some structure but not followed consistently',
  'Defined process - documented methodology, generally followed',
  'Strong process - well-designed, consistently executed, good results',
  'Excellent process - optimized, predictable, scalable, high conversion',
  'Sales process not documented or assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'conversion_rates', 'Conversion Rates', 'Effectiveness at moving prospects through the sales funnel',
  'Very poor - extremely low conversion at all stages',
  'Poor - below industry average, significant funnel leakage',
  'Average - industry standard conversion rates',
  'Good - above average conversion, improving trends',
  'Strong - significantly above industry norms, efficient funnel',
  'Excellent - best-in-class conversion, highly optimized funnel',
  'Conversion data unavailable',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'sales_capability', 'Sales Team Capability', 'Skills, capacity, and effectiveness of sales function',
  'No capability - no sales function or completely ineffective',
  'Weak capability - untrained, unmotivated, poor performance',
  'Basic capability - some skills but inconsistent performance',
  'Competent - adequate skills, meets expectations',
  'Strong capability - skilled team, high performance, good culture',
  'Excellent capability - elite sales organization, top performers, scalable',
  'Sales capability not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- MARKETING INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'lead_generation', 'Lead Generation Effectiveness', 'Ability to consistently generate qualified leads',
  'No leads - no systematic lead generation, relying on luck',
  'Weak generation - sporadic leads, poor quality, unpredictable',
  'Basic generation - some channels working but inconsistent',
  'Adequate generation - regular leads, reasonable quality',
  'Strong generation - multiple channels, consistent flow, good quality',
  'Excellent generation - abundant leads, high quality, predictable pipeline',
  'Lead generation not measured',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'brand_awareness', 'Brand Awareness and Reputation', 'Level of market awareness and brand perception',
  'Unknown - no brand recognition, invisible to market',
  'Minimal awareness - very few know the brand, no reputation',
  'Limited awareness - known in small circles, building reputation',
  'Moderate awareness - recognized in target market, decent reputation',
  'Strong awareness - well known in market, positive reputation',
  'Excellent awareness - widely recognized, trusted brand, thought leader',
  'Brand awareness not measured',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'marketing_roi', 'Marketing ROI and Efficiency', 'Return on marketing investment and cost efficiency',
  'Negative ROI - marketing loses money, unsustainable spend',
  'Poor ROI - high cost per acquisition, inefficient channels',
  'Break-even - marketing pays for itself but little profit contribution',
  'Positive ROI - marketing is profitable, reasonable efficiency',
  'Strong ROI - excellent return, efficient acquisition, scalable',
  'Excellent ROI - outstanding returns, best-in-class efficiency',
  'Marketing ROI not tracked',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- PEOPLE AND TEAM INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'team_quality', 'Team Quality and Capability', 'Skills, experience, and effectiveness of team members',
  'Poor quality - unskilled, unmotivated, high dysfunction',
  'Weak quality - significant skill gaps, performance issues',
  'Average quality - competent but not exceptional',
  'Good quality - skilled team, meets requirements',
  'Strong quality - talented team, high performers, good chemistry',
  'Excellent quality - exceptional talent, A-players, industry leaders',
  'Team quality not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'retention_engagement', 'Retention and Engagement', 'Ability to retain talent and maintain engagement',
  'Crisis - high turnover, disengaged team, toxic culture',
  'Poor - frequent departures, low morale, engagement issues',
  'Average - typical turnover, moderate engagement',
  'Good - reasonable retention, generally engaged team',
  'Strong - low turnover, high engagement, positive culture',
  'Excellent - exceptional retention, highly engaged, people love working here',
  'Retention metrics unavailable',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'organizational_structure', 'Organizational Structure', 'Clarity of roles, reporting, and organizational design',
  'Chaos - no structure, unclear roles, constant confusion',
  'Poor structure - overlapping responsibilities, gaps, frequent issues',
  'Basic structure - some clarity but frequent ambiguities',
  'Defined structure - clear roles and reporting, generally works',
  'Strong structure - well-designed, efficient, clear accountability',
  'Excellent structure - optimized, scalable, perfect clarity',
  'Organizational structure not documented',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- PROCESS AND OPERATIONS INDICATORS (3 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'process_documentation', 'Process Documentation', 'Extent and quality of documented procedures',
  'No documentation - everything in peoples heads',
  'Minimal docs - few processes documented, mostly tribal knowledge',
  'Basic docs - some key processes documented but incomplete',
  'Adequate docs - most critical processes documented',
  'Good docs - comprehensive documentation, regularly updated',
  'Excellent docs - complete, detailed, accessible, living documentation',
  'Documentation status unknown',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'operational_efficiency', 'Operational Efficiency', 'Speed, cost, and quality of operations',
  'Very inefficient - slow, expensive, error-prone operations',
  'Inefficient - frequent delays, high costs, quality issues',
  'Average efficiency - typical for industry, room for improvement',
  'Good efficiency - reasonably fast, cost-effective, good quality',
  'High efficiency - fast, lean, excellent quality, optimized',
  'Excellent efficiency - best-in-class speed, cost, and quality',
  'Operational efficiency not measured',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'quality_control', 'Quality Control and Consistency', 'Systems to ensure consistent quality output',
  'No QC - no quality checks, inconsistent output',
  'Weak QC - occasional checks, frequent quality issues',
  'Basic QC - some controls but gaps remain',
  'Adequate QC - standard checks, generally consistent',
  'Strong QC - robust systems, high consistency, proactive improvement',
  'Excellent QC - comprehensive, automated, near-perfect consistency',
  'Quality control not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- OWNER AND LEADERSHIP INDICATORS (2 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'leadership_effectiveness', 'Leadership Effectiveness', 'Quality of leadership and decision-making',
  'Ineffective - poor decisions, no vision, team lacks confidence',
  'Weak leadership - inconsistent direction, questionable decisions',
  'Adequate leadership - meets basic needs but not inspiring',
  'Good leadership - clear direction, solid decisions, team respects',
  'Strong leadership - inspiring vision, excellent decisions, high trust',
  'Exceptional leadership - transformational, visionary, highly effective',
  'Leadership not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'owner_capacity', 'Owner Capacity and Bandwidth', 'Availability and capacity of owner/founder',
  'Overwhelmed - completely maxed out, burnout risk, dropping balls',
  'Strained - too much on plate, working excessive hours, stressed',
  'Stretched - busy but managing, some delegation beginning',
  'Adequate - reasonable workload, some capacity for growth',
  'Good capacity - well-balanced, effective delegation, time for strategy',
  'Excellent capacity - optimal balance, strong team, time for vision',
  'Owner capacity not discussed',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- CUSTOMER EXPERIENCE INDICATORS (2 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'customer_satisfaction', 'Customer Satisfaction and Loyalty', 'Level of customer happiness and likelihood to recommend',
  'Very dissatisfied - complaints, churn, negative word of mouth',
  'Dissatisfied - frequent issues, low retention, complaints common',
  'Neutral - meets expectations but no enthusiasm',
  'Satisfied - meets expectations, reasonable retention',
  'Very satisfied - exceeds expectations, high retention, recommendations',
  'Delighted - raving fans, exceptional loyalty, strong advocacy',
  'Customer satisfaction not measured',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'customer_journey', 'Customer Journey Quality', 'End-to-end experience from awareness to post-purchase',
  'Broken journey - major friction points, customers struggle',
  'Poor journey - many pain points, frustrating experience',
  'Basic journey - functional but unremarkable, some friction',
  'Good journey - smooth experience, few issues',
  'Great journey - enjoyable experience, well-designed touchpoints',
  'Exceptional journey - delightful, effortless, memorable experience',
  'Customer journey not mapped',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- TECHNOLOGY AND DATA INDICATORS (2 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'tech_infrastructure', 'Technology Infrastructure', 'Quality and appropriateness of technology stack',
  'Inadequate - outdated, unreliable, hindering operations',
  'Poor - significant gaps, frequent issues, limiting growth',
  'Basic - meets minimum needs but not optimized',
  'Adequate - suitable tools, generally reliable',
  'Good - modern stack, reliable, supports operations well',
  'Excellent - best-in-class, scalable, enables competitive advantage',
  'Technology infrastructure not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'data_utilization', 'Data Utilization and Analytics', 'Use of data for decision-making and insights',
  'No data use - decisions based on gut feel only',
  'Minimal use - some data but rarely used for decisions',
  'Basic use - occasional data review, reactive approach',
  'Regular use - data informs decisions, basic dashboards',
  'Strong use - data-driven culture, proactive analytics',
  'Advanced use - predictive analytics, data as competitive advantage',
  'Data utilization not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
);

-- GROWTH READINESS INDICATORS (2 indicators)
INSERT INTO public.tpa_indicators (
  code, name, description,
  guidance_score_0, guidance_score_1, guidance_score_2, guidance_score_3, guidance_score_4, guidance_score_5, guidance_unknown,
  applies_to_pathways, applies_to_organization_types, applies_to_stages,
  default_weight, status
) VALUES
(
  'scalability_readiness', 'Scalability Readiness', 'Ability to handle growth without breaking',
  'Not scalable - would break under growth, major bottlenecks',
  'Limited scalability - significant constraints, growth would strain',
  'Moderate scalability - some constraints but could handle modest growth',
  'Good scalability - can handle reasonable growth with some adjustments',
  'High scalability - well-positioned for growth, systems ready',
  'Excellent scalability - built to scale, infrastructure ready for rapid growth',
  'Scalability not assessed',
  '{}', '{}', '{}',
  1.0, 'active'
),
(
  'growth_strategy', 'Growth Strategy and Planning', 'Clarity and feasibility of growth plans',
  'No strategy - no growth plan, reactive approach',
  'Weak strategy - vague ideas, no clear path, unrealistic',
  'Basic strategy - some planning but not well-developed',
  'Defined strategy - clear goals and plans, reasonable approach',
  'Strong strategy - well-planned, resourced, high probability of success',
  'Excellent strategy - comprehensive, innovative, executable, well-resourced',
  'Growth strategy not articulated',
  '{}', '{}', '{}',
  1.0, 'active'
);

COMMIT;
