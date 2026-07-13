-- Migration: 029_tpa_organization_type_expansion.sql
-- Expand organization_type to support detailed entity types with categories

-- Add new columns for expanded organization type
ALTER TABLE public.tpa_businesses
  ADD COLUMN IF NOT EXISTS organization_type_category TEXT CHECK (organization_type_category IN ('for_profit', 'non_profit', 'other')),
  ADD COLUMN IF NOT EXISTS organization_type_other TEXT;

-- Update the organization_type check constraint to allow any string value
-- (since we now have many entity types)
ALTER TABLE public.tpa_businesses
  DROP CONSTRAINT IF EXISTS tpa_businesses_organization_type_check;

-- Add index for organization type lookups
CREATE INDEX IF NOT EXISTS tpa_businesses_org_type_category_idx ON public.tpa_businesses(organization_type_category);

-- Add comments
COMMENT ON COLUMN public.tpa_businesses.organization_type_category IS 'High-level category: for_profit, non_profit, or other';
COMMENT ON COLUMN public.tpa_businesses.organization_type_other IS 'Custom organization type when Other is selected';
COMMENT ON COLUMN public.tpa_businesses.organization_type IS 'Specific entity type (e.g., llc, c_corp, 501c3, etc.)';

-- Data migration: Set organization_type_category based on existing organization_type values
UPDATE public.tpa_businesses
SET organization_type_category = CASE
  WHEN organization_type = 'for_profit' THEN 'for_profit'
  WHEN organization_type = 'nonprofit' THEN 'non_profit'
  WHEN organization_type = 'social_enterprise' THEN 'for_profit'
  WHEN organization_type = 'cooperative' THEN 'other'
  ELSE 'for_profit'
END
WHERE organization_type_category IS NULL;

-- Data migration: Update existing organization_type values to new entity types
UPDATE public.tpa_businesses
SET organization_type = CASE
  WHEN organization_type = 'for_profit' THEN 'llc'
  WHEN organization_type = 'nonprofit' THEN '501c3'
  WHEN organization_type = 'social_enterprise' THEN 'b_corp'
  WHEN organization_type = 'cooperative' THEN 'cooperative'
  ELSE organization_type
END
WHERE organization_type IN ('for_profit', 'nonprofit', 'social_enterprise', 'cooperative');
