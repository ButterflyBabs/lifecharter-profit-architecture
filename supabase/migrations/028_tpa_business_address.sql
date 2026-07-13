-- Migration: 028_tpa_business_address.sql
-- Add complete mailing address fields to tpa_businesses table

-- Add new address columns
ALTER TABLE public.tpa_businesses
  ADD COLUMN IF NOT EXISTS street_address_line_1 TEXT,
  ADD COLUMN IF NOT EXISTS street_address_line_2 TEXT,
  ADD COLUMN IF NOT EXISTS address_city TEXT,
  ADD COLUMN IF NOT EXISTS address_state CHAR(2),
  ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS address_country TEXT DEFAULT 'US',
  ADD COLUMN IF NOT EXISTS full_address TEXT GENERATED ALWAYS AS (
    NULLIF(CONCAT_WS(', ',
      NULLIF(CONCAT_WS(' ', street_address_line_1, street_address_line_2), ''),
      address_city,
      address_state,
      address_zip_code
    ), '')
  ) STORED;

-- Add validation for ZIP code format (5 digits or 5+4 format)
ALTER TABLE public.tpa_businesses
  ADD CONSTRAINT valid_zip_code_format CHECK (
    address_zip_code IS NULL OR 
    address_zip_code ~ '^\d{5}(-\d{4})?$'
  );

-- Add index for address lookups
CREATE INDEX IF NOT EXISTS tpa_businesses_address_state_idx ON public.tpa_businesses(address_state);
CREATE INDEX IF NOT EXISTS tpa_businesses_address_zip_idx ON public.tpa_businesses(address_zip_code);

-- Add comments
COMMENT ON COLUMN public.tpa_businesses.street_address_line_1 IS 'Primary street address (e.g., 123 Main Street)';
COMMENT ON COLUMN public.tpa_businesses.street_address_line_2 IS 'Secondary address line (e.g., Suite 100, Apt 4B)';
COMMENT ON COLUMN public.tpa_businesses.address_city IS 'City name';
COMMENT ON COLUMN public.tpa_businesses.address_state IS '2-letter state abbreviation (e.g., CO, CA, NY)';
COMMENT ON COLUMN public.tpa_businesses.address_zip_code IS 'ZIP code (5 digits or 5+4 format: 80202-1234)';
COMMENT ON COLUMN public.tpa_businesses.address_country IS 'Country code (default: US)';
COMMENT ON COLUMN public.tpa_businesses.full_address IS 'Computed full address for display purposes';

-- Note: Existing location_city and location_state columns are kept for backward compatibility
-- but are now optional since we have the full address fields
