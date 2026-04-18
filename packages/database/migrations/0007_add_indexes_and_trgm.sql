-- Migration: Add pg_trgm extension and GIN indexes for ILIKE keyword search
-- Also ensures all schema-defined indexes are applied

-- Enable pg_trgm extension for fast ILIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN indexes for company name keyword search (makes ILIKE '%keyword%' 10-100x faster)
CREATE INDEX CONCURRENTLY IF NOT EXISTS companies_display_name_trgm_idx
  ON companies USING gin (display_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS companies_legal_name_trgm_idx
  ON companies USING gin (legal_name gin_trgm_ops);

-- GIN index for contact name keyword search
CREATE INDEX CONCURRENTLY IF NOT EXISTS contacts_full_name_trgm_idx
  ON contacts USING gin (full_name gin_trgm_ops);
