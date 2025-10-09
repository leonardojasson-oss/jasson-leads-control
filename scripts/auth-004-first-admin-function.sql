-- Function to elevate the first user to ADMIN role
-- This is a one-time operation that can only be done when no ADMIN exists

CREATE OR REPLACE FUNCTION public.make_first_admin(user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count integer;
  result json;
BEGIN
  -- Check if any admin already exists
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE role = 'ADMIN';
  
  -- If an admin already exists, return error
  IF admin_count > 0 THEN
    result := json_build_object(
      'success', false,
      'message', 'Um administrador já existe no sistema'
    );
    RETURN result;
  END IF;
  
  -- Update the user's role to ADMIN
  UPDATE profiles
  SET role = 'ADMIN'
  WHERE id = user_id;
  
  -- Check if update was successful
  IF FOUND THEN
    result := json_build_object(
      'success', true,
      'message', 'Você agora é um administrador'
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Usuário não encontrado'
    );
  END IF;
  
  RETURN result;
END;
$$;
