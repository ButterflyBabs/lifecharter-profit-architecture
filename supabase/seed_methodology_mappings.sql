-- Seed data for Component-Indicator Mappings
-- Links the 12 components to their respective indicators

BEGIN;

-- Create mappings for each component to its indicators
DO $$
DECLARE
  v_methodology_id UUID;
  v_component_id UUID;
  v_indicator_id UUID;
BEGIN
  SELECT id INTO v_methodology_id FROM public.tpa_methodology_versions WHERE version = '1.0.0';
  
  -- ============================================
  -- FINANCIAL HEALTH (4 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'financial_health';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('cash_flow_stability', 'profitability_trend', 'debt_management', 'financial_records')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0, 
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'cash_flow_stability' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'profitability_trend' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'debt_management' THEN 3
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'financial_records' THEN 4
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- PRICING AND PROFITABILITY (4 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'pricing_profitability';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('pricing_strategy', 'cost_structure', 'margin_health', 'profit_capture')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'pricing_strategy' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'cost_structure' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'margin_health' THEN 3
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'profit_capture' THEN 4
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- CUSTOMER AND MARKET (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'customer_market';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('customer_clarity', 'market_position', 'market_opportunity')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'customer_clarity' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'market_position' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'market_opportunity' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- PRODUCT, PROGRAM, OR OFFER (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'product_offer';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('product_quality', 'product_market_fit', 'offer_design')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'product_quality' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'product_market_fit' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'offer_design' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- SALES (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'sales';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('sales_process', 'conversion_rates', 'sales_capability')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'sales_process' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'conversion_rates' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'sales_capability' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- MARKETING (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'marketing';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('lead_generation', 'brand_awareness', 'marketing_roi')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'lead_generation' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'brand_awareness' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'marketing_roi' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- PEOPLE AND TEAM (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'people_team';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('team_quality', 'retention_engagement', 'organizational_structure')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'team_quality' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'retention_engagement' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'organizational_structure' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- PROCESS AND OPERATIONS (3 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'process_operations';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('process_documentation', 'operational_efficiency', 'quality_control')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'process_documentation' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'operational_efficiency' THEN 2
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'quality_control' THEN 3
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- OWNER AND LEADERSHIP (2 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'owner_leadership';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('leadership_effectiveness', 'owner_capacity')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'leadership_effectiveness' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'owner_capacity' THEN 2
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- CUSTOMER EXPERIENCE (2 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'customer_experience';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('customer_satisfaction', 'customer_journey')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'customer_satisfaction' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'customer_journey' THEN 2
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- TECHNOLOGY AND DATA (2 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'technology_data';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('tech_infrastructure', 'data_utilization')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'tech_infrastructure' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'data_utilization' THEN 2
      END, 'active');
  END LOOP;
  
  -- ============================================
  -- GROWTH READINESS (2 indicators)
  -- ============================================
  SELECT id INTO v_component_id FROM public.tpa_components 
  WHERE methodology_version_id = v_methodology_id AND code = 'growth_readiness';
  
  FOR v_indicator_id IN 
    SELECT id FROM public.tpa_indicators WHERE code IN ('scalability_readiness', 'growth_strategy')
  LOOP
    INSERT INTO public.tpa_component_indicators (component_id, indicator_id, weight, sort_order, status)
    VALUES (v_component_id, v_indicator_id, 1.0,
      CASE 
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'scalability_readiness' THEN 1
        WHEN (SELECT code FROM public.tpa_indicators WHERE id = v_indicator_id) = 'growth_strategy' THEN 2
      END, 'active');
  END LOOP;

END $$;

COMMIT;
