-- Função para verificar se o usuário atual é ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'ADMIN'
  );
END;
$$;

-- Função para verificar se o usuário tem um escopo específico
CREATE OR REPLACE FUNCTION public.has_scope(scope_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  scope_uuid UUID;
  user_override BOOLEAN;
BEGIN
  -- Obter role do usuário
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obter UUID do scope
  SELECT id INTO scope_uuid
  FROM public.scopes
  WHERE code = scope_code;

  IF scope_uuid IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Verificar se há override de usuário
  SELECT allow INTO user_override
  FROM public.user_scopes
  WHERE user_id = auth.uid()
  AND scope_id = scope_uuid;

  -- Se há override, usar ele
  IF user_override IS NOT NULL THEN
    RETURN user_override;
  END IF;

  -- Caso contrário, verificar se a role tem o scope
  RETURN EXISTS (
    SELECT 1
    FROM public.role_scopes rs
    JOIN public.roles r ON r.id = rs.role_id
    WHERE r.code = user_role
    AND rs.scope_id = scope_uuid
  );
END;
$$;

-- Função para obter todos os escopos efetivos de um usuário
CREATE OR REPLACE FUNCTION public.get_user_effective_scopes(target_user_id UUID)
RETURNS TABLE (
  scope_code TEXT,
  scope_description TEXT,
  source TEXT -- 'role' ou 'user_override'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Apenas admins podem ver escopos de outros usuários
  IF NOT public.is_admin() AND target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Obter role do usuário
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = target_user_id;

  -- Retornar escopos da role + overrides do usuário
  RETURN QUERY
  WITH role_scopes AS (
    SELECT s.code, s.description, 'role'::TEXT as source
    FROM public.scopes s
    JOIN public.role_scopes rs ON rs.scope_id = s.id
    JOIN public.roles r ON r.id = rs.role_id
    WHERE r.code = user_role
  ),
  user_overrides AS (
    SELECT s.code, s.description, 'user_override'::TEXT as source
    FROM public.scopes s
    JOIN public.user_scopes us ON us.scope_id = s.id
    WHERE us.user_id = target_user_id
    AND us.allow = true
  ),
  user_revokes AS (
    SELECT s.code
    FROM public.scopes s
    JOIN public.user_scopes us ON us.scope_id = s.id
    WHERE us.user_id = target_user_id
    AND us.allow = false
  )
  SELECT DISTINCT rs.code, rs.description, rs.source
  FROM (
    SELECT * FROM role_scopes
    UNION
    SELECT * FROM user_overrides
  ) rs
  WHERE rs.code NOT IN (SELECT code FROM user_revokes);
END;
$$;

-- Função para registrar ação de auditoria
CREATE OR REPLACE FUNCTION public.log_permission_action(
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_permissions (user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;
