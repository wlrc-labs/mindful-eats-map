import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, ShoppingCart, BarChart3, Settings, LogOut, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import TopBar from '@/components/TopBar';

export default function ClienteDashboard() {
  const { isCliente, loading, userId } = useUserRole();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0
  });

  useEffect(() => {
    const fetchTenantData = async () => {
      if (!userId) return;

      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*, subscriptions(*)')
        .eq('owner_id', userId)
        .maybeSingle();

      if (tenantData) {
        setTenant(tenantData);
        setSubscription(tenantData.subscriptions?.[0]);

        const [productsRes, ordersRes] = await Promise.all([
          supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantData.id),
          supabase.from('orders').select('id, total', { count: 'exact' }).eq('tenant_id', tenantData.id)
        ]);

        const revenue = ordersRes.data?.reduce((sum, order) => sum + Number(order.total), 0) || 0;

        setStats({
          products: productsRes.count || 0,
          orders: ordersRes.count || 0,
          revenue
        });
      }
    };

    if (isCliente) {
      fetchTenantData();
    }
  }, [isCliente, userId]);

  useEffect(() => {
    if (!loading && !isCliente) {
      navigate('/home');
      toast.error('Acesso negado');
    }
  }, [isCliente, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isCliente) {
    return null;
  }

  if (!tenant) {
    return <OnboardingTenant userId={userId!} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar userName={tenant.name} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Painel de Controle</h2>
          <p className="text-muted-foreground">Gerencie seu estabelecimento</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Produtos Cadastrados</CardDescription>
              <CardTitle className="text-3xl">{stats.products}</CardTitle>
            </CardHeader>
            <CardContent>
              <Package className="h-4 w-4 text-muted-foreground" />
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
              <CardDescription>Receita Total</CardDescription>
              <CardTitle className="text-3xl">R$ {stats.revenue.toFixed(2)}</CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
            <TabsTrigger value="subscription">Assinatura</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsManagement tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsView tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionView subscription={subscription} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsView tenant={tenant} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function OnboardingTenant({ userId }: { userId: string }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'mercado' | 'restaurante' | 'loja' | 'padaria' | 'cafeteria' | ''>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !type) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          owner_id: userId,
          name,
          type: type as 'mercado' | 'restaurante' | 'loja' | 'padaria' | 'cafeteria',
          description
        }])
        .select()
        .single();

      if (tenantError) throw tenantError;

      await supabase.from('subscriptions').insert({
        tenant_id: tenant.id,
        plan: 'free',
        status: 'active'
      });

      toast.success('Estabelecimento criado com sucesso!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cadastre seu Estabelecimento</CardTitle>
          <CardDescription>Complete as informações para começar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Estabelecimento</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mercado Sem Glúten"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercado">Mercado</SelectItem>
                <SelectItem value="restaurante">Restaurante</SelectItem>
                <SelectItem value="loja">Loja</SelectItem>
                <SelectItem value="padaria">Padaria</SelectItem>
                <SelectItem value="cafeteria">Cafeteria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu estabelecimento..."
            />
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? 'Criando...' : 'Criar Estabelecimento'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductsManagement({ tenantId }: { tenantId: string }) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*, product_categories(name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      setProducts(data || []);
    };
    fetchProducts();
  }, [tenantId]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestão de Produtos</CardTitle>
            <CardDescription>Cadastre e gerencie seus produtos</CardDescription>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum produto cadastrado ainda</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.product_categories?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">R$ {Number(product.price).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Estoque: {product.stock_quantity}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersManagement({ tenantId }: { tenantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
        <CardDescription>Acompanhe os pedidos do seu estabelecimento</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Nenhum pedido ainda</p>
      </CardContent>
    </Card>
  );
}

function ReportsView({ tenantId }: { tenantId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios e Análises</CardTitle>
        <CardDescription>Visualize métricas e relatórios</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Módulo de relatórios em desenvolvimento...</p>
      </CardContent>
    </Card>
  );
}

function SubscriptionView({ subscription }: { subscription: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura</CardTitle>
        <CardDescription>Gerencie seu plano</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Plano Atual</Label>
            <p className="text-2xl font-bold capitalize">{subscription?.plan || 'Free'}</p>
          </div>
          <div>
            <Label>Status</Label>
            <p className="capitalize">{subscription?.status || 'Ativo'}</p>
          </div>
          <Button variant="outline">Fazer Upgrade</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsView({ tenant }: { tenant: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Gerencie as configurações do seu estabelecimento</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Módulo de configurações em desenvolvimento...</p>
      </CardContent>
    </Card>
  );
}
