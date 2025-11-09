import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ShoppingCart, DollarSign, Package, Settings, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { CreateTenantDialog } from '@/components/CreateTenantDialog';
import TopBar from '@/components/TopBar';

export default function AdminDashboard() {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    tenants: 0,
    users: 0,
    orders: 0,
    revenue: 0,
    products: 0
  });

  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate('/home');
      toast.error('Acesso negado');
    }
  }, [role, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      const [tenantsRes, ordersRes, productsRes] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total', { count: 'exact' }),
        supabase.from('products').select('id', { count: 'exact', head: true })
      ]);

      const revenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

      setStats({
        tenants: tenantsRes.count || 0,
        users: 0,
        orders: ordersRes.count || 0,
        revenue,
        products: productsRes.count || 0
      });
    };

    if (role === 'admin') {
      fetchStats();
    }
  }, [role]);

  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate('/home');
      toast.error('Acesso negado');
    }
  }, [role, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar userName="Admin" />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">Gerencie todos os estabelecimentos e operações</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Estabelecimentos</CardDescription>
              <CardTitle className="text-3xl">{stats.tenants}</CardTitle>
            </CardHeader>
            <CardContent>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Usuários</CardDescription>
              <CardTitle className="text-3xl">{stats.users}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pedidos</CardDescription>
              <CardTitle className="text-3xl">{stats.orders}</CardTitle>
            </CardHeader>
            <CardContent>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Receita</CardDescription>
              <CardTitle className="text-3xl">R$ {stats.revenue.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Produtos</CardDescription>
              <CardTitle className="text-3xl">{stats.products}</CardTitle>
            </CardHeader>
            <CardContent>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tenants">Estabelecimentos</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-4">
            <TenantsTab />
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <SubscriptionsTab />
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <OrdersTab />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>Gerencie configurações globais</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Em desenvolvimento...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function TenantsTab() {
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchTenants = async () => {
    const { data } = await supabase
      .from('tenants')
      .select('*, subscriptions(*)')
      .order('created_at', { ascending: false });
    setTenants(data || []);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Estabelecimentos Cadastrados</CardTitle>
          <CardDescription>Gerencie todos os estabelecimentos da plataforma</CardDescription>
        </div>
        <CreateTenantDialog onSuccess={fetchTenants} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">{tenant.name}</h4>
                  <p className="text-sm text-muted-foreground capitalize">{tenant.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                  {tenant.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {tenant.subscriptions?.[0]?.plan || 'free'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Assinaturas</CardTitle>
        <CardDescription>Controle planos e pagamentos</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Módulo de assinaturas em desenvolvimento...</p>
      </CardContent>
    </Card>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false })
        .limit(20);
      setOrders(data || []);
    };
    fetchOrders();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Recentes</CardTitle>
        <CardDescription>Monitore todas as transações</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{order.tenants?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {Number(order.total).toFixed(2)}</p>
                <Badge variant="outline" className="capitalize">{order.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProductsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestão Global de Produtos</CardTitle>
        <CardDescription>Visualize todos os produtos cadastrados</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Módulo de produtos em desenvolvimento...</p>
      </CardContent>
    </Card>
  );
}
