import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Shield, Heart, Users, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

const Landing = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Check if user is already logged in OR if mobile (redirect to auth)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/home");
      } else if (isMobile) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate, isMobile]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <Badge className="mb-6 bg-safe text-safe-foreground hover:bg-safe/90">
              Alimentação segura para todos
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Encontre alimentos{" "}
              <span className="text-primary">seguros</span> para suas{" "}
              <span className="text-primary">restrições</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Conectamos pessoas com restrições alimentares a restaurantes, mercados e lojas 
              que oferecem produtos seguros e confiáveis
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 hover-lift">
                <Link to="/auth">
                  Começar agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 hover-lift">
                <Link to="/auth?partner=true">
                  Sou um parceiro
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher o Alimmenta?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa pensada em você e na sua segurança alimentar
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card p-8 rounded-2xl shadow-card hover-lift animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Atendemos todas as restrições
            </h2>
            <p className="text-lg text-muted-foreground">
              Nossa plataforma filtra produtos para diversas condições
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {conditions.map((condition) => (
              <Badge
                key={condition}
                variant="secondary"
                className="px-4 py-2 text-base hover:bg-primary hover:text-primary-foreground transition-colors cursor-default"
              >
                {condition}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já encontraram segurança alimentar com o Alimmenta
          </p>
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-lg px-8 hover-scale"
          >
            <Link to="/auth">Criar conta gratuita</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Alimmenta. Alimentação saudável e segura para todos.</p>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    icon: Search,
    title: "Busca Inteligente",
    description:
      "Encontre facilmente estabelecimentos que atendem suas restrições alimentares com filtros avançados",
  },
  {
    icon: MapPin,
    title: "Localização Precisa",
    description:
      "Veja os locais mais próximos de você com mapa integrado e informações de distância",
  },
  {
    icon: Shield,
    title: "Segurança Certificada",
    description:
      "Todos os parceiros são verificados e informam sobre políticas de contaminação cruzada",
  },
  {
    icon: Heart,
    title: "Perfil Personalizado",
    description:
      "Configure suas restrições uma vez e receba recomendações personalizadas sempre",
  },
  {
    icon: Users,
    title: "Comunidade Ativa",
    description:
      "Avaliações e comentários de pessoas com as mesmas restrições que você",
  },
  {
    icon: ArrowRight,
    title: "Fácil de Usar",
    description:
      "Interface simples e intuitiva para encontrar o que você precisa em segundos",
  },
];

const conditions = [
  "Doença Celíaca",
  "Intolerância à Lactose",
  "APLV",
  "Diabetes",
  "Vegano",
  "Vegetariano",
  "Dieta Renal",
  "Low Carb",
  "Alergia a Amendoim",
  "Alergia a Frutos do Mar",
  "Sem Glúten",
  "Sem Açúcar",
];

export default Landing;
