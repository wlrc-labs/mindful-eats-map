import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Home, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type UserRole = 'admin' | 'cliente';

export default function DashboardSelection() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        const userRoles = rolesData?.map(r => r.role as UserRole) || [];
        
        if (userRoles.length === 0) {
          navigate('/home');
        } else if (userRoles.length === 1) {
          navigateToRole(userRoles[0]);
        } else {
          setRoles(userRoles);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Erro ao carregar perfis');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [navigate]);

  const navigateToRole = (role: UserRole) => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'cliente') {
      navigate('/cliente');
    } else {
      navigate('/home');
    }
  };

  const dashboardOptions = [
    {
      role: 'home' as const,
      icon: Home,
      title: 'Área do Usuário',
      description: 'Busque produtos seguros e gerencie suas restrições alimentares',
      color: 'primary',
    },
    {
      role: 'cliente' as const,
      icon: Building2,
      title: 'Painel do Estabelecimento',
      description: 'Gerencie produtos, pedidos e seu estabelecimento',
      color: 'secondary',
      requiresRole: 'cliente' as UserRole,
    },
    {
      role: 'admin' as const,
      icon: Shield,
      title: 'Administração',
      description: 'Controle total do sistema e gerenciamento de estabelecimentos',
      color: 'destructive',
      requiresRole: 'admin' as UserRole,
    },
  ];

  const availableOptions = dashboardOptions.filter(
    option => !option.requiresRole || roles.includes(option.requiresRole)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Escolha seu Painel</h1>
          <p className="text-muted-foreground">Selecione para onde você deseja ir</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableOptions.map((option) => (
            <Card 
              key={option.role}
              className="hover:shadow-lg transition-shadow cursor-pointer" 
              onClick={() => navigateToRole(option.role === 'home' ? null as any : option.role as UserRole)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 bg-${option.color}/10 rounded-full flex items-center justify-center mb-4`}>
                  <option.icon className={`h-8 w-8 text-${option.color}`} />
                </div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription>
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant={option.color === 'primary' ? 'default' : 'secondary'}
                >
                  Acessar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
