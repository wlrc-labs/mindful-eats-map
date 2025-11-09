-- Adicionar política para permitir que clientes criem seus próprios estabelecimentos
CREATE POLICY "Clientes podem criar seu estabelecimento"
ON public.tenants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id AND
  has_role(auth.uid(), 'cliente'::app_role)
);