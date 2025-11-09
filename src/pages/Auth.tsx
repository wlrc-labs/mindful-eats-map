import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { Turnstile } from "@marsidev/react-turnstile";
import authBgImage from "@/assets/auth-bg.jpg";

const authSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
  confirmPassword: z.string().optional(),
  name: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }).optional(),
}).refine((data) => {
  if (data.confirmPassword !== undefined) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = searchParams.get("type") || "user";
  const isEstablishment = userType === "establishment";
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      }
    };
    checkUser();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password, confirmPassword, name });
      
      if (!acceptTerms) {
        toast.error("Você precisa aceitar os termos de uso e política de privacidade");
        return;
      }

      if (!turnstileToken) {
        toast.error("Por favor, complete a verificação de segurança");
        return;
      }

      setLoading(true);

      const { error, data } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            name: validated.name,
            is_establishment: isEstablishment,
          },
          emailRedirectTo: `${window.location.origin}/home`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("Este email já está cadastrado. Tente fazer login.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (isEstablishment) {
        // Estabelecimentos vão direto para seleção de role
        await supabase.from('user_roles').insert({
          user_id: data.user!.id,
          role: 'cliente'
        });
        toast.success("Conta criada! Redirecionando...");
        navigate("/cliente");
      } else {
        // Usuários comuns vão para configuração de perfil
        toast.success("Conta criada! Configure seu perfil...");
        navigate("/profile-setup");
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = authSchema.parse({ email, password });
      
      if (!turnstileToken) {
        toast.error("Por favor, complete a verificação de segurança");
        return;
      }

      setLoading(true);

      const { error, data } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      // Buscar todas as roles do usuário
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id);

      const roles = rolesData?.map(r => r.role) || [];

      if (roles.length === 0) {
        // Usuário comum sem role definida
        const { data: profileData } = await supabase
          .from('user_dietary_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (!profileData) {
          navigate('/profile-setup');
        } else {
          navigate('/home');
        }
      } else if (roles.includes('cliente')) {
        // Usuário com role cliente vai para dashboard do estabelecimento
        navigate('/cliente');
      } else if (roles.includes('admin')) {
        // Admin vai para painel administrativo
        navigate('/admin');
      } else {
        // Fallback para home
        navigate('/home');
      }

      toast.success("Login realizado! Redirecionando...");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Erro ao fazer login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${authBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay for better contrast */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        <Button
          variant="ghost"
          className="mb-4 bg-background/50 backdrop-blur-md hover:bg-background/70"
          asChild
        >
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </Button>

        <Card className="shadow-card bg-background/80 backdrop-blur-md border-2">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-primary">
              Alimmenta
            </CardTitle>
            <CardDescription>
              {isEstablishment ? "Portal do Estabelecimento" : "Bem-vindo de volta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Verificação de segurança</Label>
                    <Turnstile
                      siteKey="1x00000000000000000000AA"
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar senha</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                      disabled={loading}
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm text-muted-foreground leading-relaxed"
                    >
                      Aceito os termos de uso e política de privacidade (LGPD)
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Verificação de segurança</Label>
                    <Turnstile
                      siteKey="1x00000000000000000000AA"
                      onSuccess={(token) => setTurnstileToken(token)}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
