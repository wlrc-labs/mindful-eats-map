import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Star,
  Filter,
  LogOut,
  User,
  Store,
  Utensils,
  ShoppingBag,
} from "lucide-react";

const mockPlaces = [
  {
    id: "1",
    name: "Bio Mercado Orgânico",
    type: "market",
    description: "Mercado especializado em produtos orgânicos e sem glúten",
    distance: "0.8 km",
    rating: 4.8,
    tags: ["Sem Glúten", "Vegano", "Orgânico"],
    certified: true,
  },
  {
    id: "2",
    name: "Restaurante Vida Verde",
    type: "restaurant",
    description: "Restaurante vegano com opções para intolerantes",
    distance: "1.2 km",
    rating: 4.9,
    tags: ["Vegano", "Sem Lactose", "Sem Glúten"],
    certified: true,
  },
  {
    id: "3",
    name: "Padaria Sem Glúten",
    type: "store",
    description: "Padaria especializada em produtos para celíacos",
    distance: "2.1 km",
    rating: 4.7,
    tags: ["Sem Glúten", "Celíaco", "Artesanal"],
    certified: true,
  },
  {
    id: "4",
    name: "Empório Natural",
    type: "market",
    description: "Produtos naturais e diet",
    distance: "1.5 km",
    rating: 4.6,
    tags: ["Diet", "Diabetes", "Low Carb"],
    certified: false,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState(mockPlaces);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = mockPlaces.filter(
        (place) =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
      setFilteredPlaces(filtered);
    } else {
      setFilteredPlaces(mockPlaces);
    }
  }, [searchQuery]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "market":
        return <ShoppingBag className="h-5 w-5" />;
      case "restaurant":
        return <Utensils className="h-5 w-5" />;
      case "store":
        return <Store className="h-5 w-5" />;
      default:
        return <Store className="h-5 w-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "market":
        return "Mercado";
      case "restaurant":
        return "Restaurante";
      case "store":
        return "Loja";
      default:
        return "Estabelecimento";
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Alimmenta</h1>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="bg-gradient-hero py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar restaurantes, mercados ou produtos..."
                className="pl-10 pr-12 h-12 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2"
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>São Paulo, SP - Centro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Places List */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {searchQuery
                  ? `${filteredPlaces.length} resultado(s) encontrado(s)`
                  : "Locais próximos a você"}
              </h2>
            </div>

            {filteredPlaces.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground">
                    Nenhum local encontrado com esses critérios
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredPlaces.map((place, index) => (
                  <Card
                    key={place.id}
                    className="hover-lift cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {getTypeIcon(place.type)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {place.name}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                {getTypeLabel(place.type)}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                        {place.certified && (
                          <Badge className="bg-safe text-safe-foreground">
                            Certificado
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        {place.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {place.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {place.distance}
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium text-foreground">
                            {place.rating}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
