-- RLS policies para tabela roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
  ON public.roles
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert roles"
  ON public.roles
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
  ON public.roles
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete roles"
  ON public.roles
  FOR DELETE
  USING (public.is_admin());

-- RLS policies para tabela scopes
ALTER TABLE public.scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scopes"
  ON public.scopes
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert scopes"
  ON public.scopes
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update scopes"
  ON public.scopes
  FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Only admins can delete scopes"
  ON public.scopes
  FOR DELETE
  USING (public.is_admin());

-- RLS policies para tabela role_scopes
ALTER TABLE public.role_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role_scopes"
  ON public.role_scopes
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage role_scopes"
  ON public.role_scopes
  FOR ALL
  USING (public.is_admin());

-- RLS policies para tabela user_scopes
ALTER TABLE public.user_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scopes"
  ON public.user_scopes
  FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can manage user_scopes"
  ON public.user_scopes
  FOR ALL
  USING (public.is_admin());
