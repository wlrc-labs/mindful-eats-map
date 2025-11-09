import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Filter,
  Store,
  Utensils,
  ShoppingBag,
} from "lucide-react";
import TopBar from "@/components/TopBar";
import CategoryIcons from "@/components/CategoryIcons";
import FeaturedSlider from "@/components/FeaturedSlider";
import PlaceCard from "@/components/PlaceCard";

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
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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
    let filtered = mockPlaces;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((place) => {
        if (selectedCategory === "markets") return place.type === "market";
        if (selectedCategory === "restaurants") return place.type === "restaurant";
        if (selectedCategory === "stores") return place.type === "store";
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (place) =>
          place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          place.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredPlaces(filtered);
  }, [searchQuery, selectedCategory]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "market":
        return <ShoppingBag className="h-6 w-6" />;
      case "restaurant":
        return <Utensils className="h-6 w-6" />;
      case "store":
        return <Store className="h-6 w-6" />;
      default:
        return <Store className="h-6 w-6" />;
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

  const enrichedPlaces = filteredPlaces.map(place => ({
    ...place,
    typeIcon: getTypeIcon(place.type),
    typeLabel: getTypeLabel(place.type),
    deliveryTime: "30-45 min",
    minOrder: place.type === "restaurant" ? "R$ 20,00" : undefined,
  }));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* TopBar */}
      <TopBar userName={user?.user_metadata?.name || user?.email?.split('@')[0]} cartItemsCount={0} />

      {/* Category Icons */}
      <CategoryIcons 
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {/* Featured Slider */}
      <FeaturedSlider />

      {/* Search Section */}
      <section className="bg-muted/30 py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar restaurantes, mercados ou produtos seguros..."
                className="pl-12 pr-4 h-14 text-base shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span>São Paulo, SP - Centro</span>
            </div>
          </div>
        </div>
      </section>

      {/* Places List */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {searchQuery || selectedCategory
                  ? `${filteredPlaces.length} resultado(s) encontrado(s)`
                  : "Recomendados para você"}
              </h2>
            </div>

            {filteredPlaces.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <p className="text-muted-foreground text-lg">
                    Nenhum local encontrado com esses critérios
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tente ajustar os filtros ou a busca
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {enrichedPlaces.map((place, index) => (
                  <PlaceCard key={place.id} place={place} index={index} />
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
