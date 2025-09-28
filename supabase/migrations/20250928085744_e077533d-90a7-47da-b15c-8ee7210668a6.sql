-- Fix critical security vulnerability in token_scans table
-- Step 1: Clean up existing NULL user_id records and fix policies

-- First, delete any existing records with NULL user_id to remove exposed data
DELETE FROM public.token_scans WHERE user_id IS NULL;

-- Drop existing vulnerable policies
DROP POLICY IF EXISTS "Users can create token scans" ON public.token_scans;
DROP POLICY IF EXISTS "Users can view their own token scans" ON public.token_scans;
DROP POLICY IF EXISTS "Users can update their own token scans" ON public.token_scans;
DROP POLICY IF EXISTS "Users can delete their own token scans" ON public.token_scans;

-- Create secure policies that require authentication
CREATE POLICY "Authenticated users can create their own token scans"
ON public.token_scans
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view only their own token scans"
ON public.token_scans
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update only their own token scans"
ON public.token_scans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete only their own token scans"
ON public.token_scans
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Make user_id NOT NULL to prevent future NULL insertions
ALTER TABLE public.token_scans 
ALTER COLUMN user_id SET NOT NULL;