-- Setup profiles table with RLS and role-based policies (FIXED - no recursion)
-- This script ensures the profiles table has the correct structure and permissions

-- Add role constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('ADMIN','GESTOR','SDR','CLOSER'));
  END IF;
END $$;

-- Set default role to SDR if not set
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'SDR';

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;

-- Create a security definer function to check user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role;
END;
$$;

-- Create RLS policies for profiles (NO RECURSION)

-- All authenticated users can view all profiles (needed for dropdowns, assignments, etc.)
CREATE POLICY "All authenticated users can view profiles" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (true);

-- Users can update their own profile (name, phone only - not role)
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own role
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Admins can insert profiles (for inviting users)
CREATE POLICY "Admins can insert profiles" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (
    get_user_role(auth.uid()) = 'ADMIN'
  );

-- Admins can update all profiles (including roles)
CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'ADMIN'
  );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" 
  ON profiles FOR DELETE 
  TO authenticated
  USING (
    get_user_role(auth.uid()) = 'ADMIN'
  );

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'SDR'),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
