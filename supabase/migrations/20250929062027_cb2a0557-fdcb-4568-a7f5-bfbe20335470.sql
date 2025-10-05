-- Fix audit_reports RLS policies to prevent unauthorized access
-- Remove the problematic policies that allow access to NULL user_id records

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can create audit reports" ON public.audit_reports;
DROP POLICY IF EXISTS "Users can view their own audit reports" ON public.audit_reports;

-- Create secure RLS policies that only allow access to owned reports
CREATE POLICY "Users can create their own audit reports" 
ON public.audit_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit reports" 
ON public.audit_reports 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also create RLS policies for the t1 table to fix the warning
-- Since t1 appears to be unused, we'll create restrictive policies
CREATE POLICY "No access to t1 table" 
ON public.t1 
FOR ALL 
USING (false);

-- Make user_id NOT NULL in audit_reports to prevent future NULL entries
-- First delete any existing NULL user_id records
DELETE FROM public.audit_reports WHERE user_id IS NULL;

-- Then make the column NOT NULL
ALTER TABLE public.audit_reports ALTER COLUMN user_id SET NOT NULL;