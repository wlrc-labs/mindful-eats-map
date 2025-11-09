import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const tenantSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  type: z.enum(['restaurante', 'cafeteria', 'padaria', 'mercado', 'loja'], { required_error: 'Tipo é obrigatório' }),
  email: z.string().trim().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  phone: z.string().trim().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
  address: z.string().trim().max(500, 'Endereço deve ter no máximo 500 caracteres').optional(),
  description: z.string().trim().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
  ownerEmail: z.string().trim().email('Email do proprietário inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  ownerPassword: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(72, 'Senha deve ter no máximo 72 caracteres'),
});

type TenantFormData = z.infer<typeof tenantSchema>;

interface CreateTenantDialogProps {
  onSuccess: () => void;
}

export function CreateTenantDialog({ onSuccess }: CreateTenantDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      type: 'restaurante',
      email: '',
      phone: '',
      address: '',
      description: '',
      ownerEmail: '',
      ownerPassword: '',
    },
  });

  const onSubmit = async (data: TenantFormData) => {
    setIsLoading(true);
    try {
      // Step 1: Create new user
      const { data: newUser, error: userError } = await supabase.auth.signUp({
        email: data.ownerEmail,
        password: data.ownerPassword,
      });

      if (userError || !newUser.user) {
        throw new Error(userError?.message || 'Erro ao criar usuário');
      }

      const ownerId = newUser.user.id;

      // Step 2: Create cliente role for the new user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: ownerId, role: 'cliente' });

      if (roleError) {
        throw new Error('Erro ao atribuir role ao usuário');
      }

      // Step 3: Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.name,
          type: data.type,
          email: data.email,
          phone: data.phone || null,
          address: data.address || null,
          description: data.description || null,
          owner_id: ownerId,
          is_active: true,
        })
        .select()
        .single();

      if (tenantError) {
        throw new Error('Erro ao criar estabelecimento');
      }

      // Step 3: Create default subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: tenant.id,
          plan: 'free',
          status: 'active',
          started_at: new Date().toISOString(),
        });

      if (subError) {
        console.error('Erro ao criar assinatura:', subError);
      }

      toast.success('Estabelecimento criado com sucesso!');
      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar estabelecimento:', error);
      toast.error(error.message || 'Erro ao criar estabelecimento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Estabelecimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Estabelecimento</DialogTitle>
          <DialogDescription>
            Preencha as informações do estabelecimento e do proprietário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Informações do Estabelecimento</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do estabelecimento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurante">Restaurante</SelectItem>
                        <SelectItem value="cafeteria">Cafeteria</SelectItem>
                        <SelectItem value="padaria">Padaria</SelectItem>
                        <SelectItem value="mercado">Mercado</SelectItem>
                        <SelectItem value="loja">Loja</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="contato@estabelecimento.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro, cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva o estabelecimento..." 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-semibold">Proprietário</h3>
              
              <FormField
                control={form.control}
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email do Proprietário *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="proprietario@email.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se o usuário já existir, será vinculado ao estabelecimento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Inicial *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormDescription>
                      Necessário apenas se for criar novo usuário
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Estabelecimento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
