-- Criar tabela de auditoria de permissões
CREATE TABLE IF NOT EXISTS public.audit_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'grant', 'revoke'
  entity_type TEXT NOT NULL, -- 'role', 'scope', 'role_scope', 'user_scope'
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_permissions_user_id ON public.audit_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_permissions_created_at ON public.audit_permissions(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_permissions_entity_type ON public.audit_permissions(entity_type);

-- RLS policies
ALTER TABLE public.audit_permissions ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Admins can view audit logs"
  ON public.audit_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'ADMIN'
    )
  );

-- Sistema pode inserir logs (via trigger ou função)
CREATE POLICY "System can insert audit logs"
  ON public.audit_permissions
  FOR INSERT
  WITH CHECK (true);
