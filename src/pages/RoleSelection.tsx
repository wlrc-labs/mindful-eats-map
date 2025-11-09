import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

export default function RoleSelection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const selectRole = async (role: 'admin' | 'cliente') => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Usuário não autenticado');
        navigate('/auth');
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Você já possui uma função atribuída');
        } else {
          throw error;
        }
      }

      toast.success(`Função ${role === 'admin' ? 'administrador' : 'cliente'} atribuída com sucesso!`);
      
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/cliente');
      }
    } catch (error: any) {
      console.error('Error setting role:', error);
      toast.error('Erro ao definir função');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Bem-vindo ao Alimmenta</h1>
          <p className="text-muted-foreground">Selecione como você deseja usar a plataforma</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => !loading && selectRole('cliente')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Sou um Estabelecimento</CardTitle>
              <CardDescription>
                Gerencie seu mercado, restaurante ou loja e cadastre produtos para clientes com restrições alimentares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>✓ Dashboard completo</li>
                <li>✓ Gestão de produtos e estoque</li>
                <li>✓ Análise de compatibilidade alimentar com IA</li>
                <li>✓ Controle de pedidos</li>
              </ul>
              <Button className="w-full" disabled={loading}>
                {loading ? 'Processando...' : 'Cadastrar Estabelecimento'}
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => !loading && selectRole('admin')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                <User className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle>Sou Administrador</CardTitle>
              <CardDescription>
                Acesso completo ao sistema para gerenciar todos os estabelecimentos e operações da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li>✓ Gestão de todos os tenants</li>
                <li>✓ Controle de assinaturas</li>
                <li>✓ Monitoramento de transações</li>
                <li>✓ Suporte dedicado</li>
              </ul>
              <Button variant="secondary" className="w-full" disabled={loading}>
                {loading ? 'Processando...' : 'Acessar como Admin'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
