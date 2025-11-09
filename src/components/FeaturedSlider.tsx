import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const featuredItems = [
  {
    id: "1",
    title: "Pão de Queijo Sem Glúten",
    store: "Padaria Vida Saudável",
    price: "R$ 18,90",
    discount: "20% OFF",
    rating: 4.9,
    tags: ["Sem Glúten", "Celíaco"],
    image: "🥖",
  },
  {
    id: "2",
    title: "Pizza Vegana Especial",
    store: "Restaurante Verde",
    price: "R$ 45,00",
    discount: "15% OFF",
    rating: 4.8,
    tags: ["Vegano", "Sem Lactose"],
    image: "🍕",
  },
  {
    id: "3",
    title: "Brownie Zero Açúcar",
    store: "Doces Fit",
    price: "R$ 12,00",
    discount: "25% OFF",
    rating: 4.7,
    tags: ["Diabetes", "Low Carb"],
    image: "🍰",
  },
  {
    id: "4",
    title: "Leite de Amêndoas Orgânico",
    store: "Empório Natural",
    price: "R$ 15,90",
    discount: "10% OFF",
    rating: 4.9,
    tags: ["Vegano", "Sem Lactose"],
    image: "🥛",
  },
];

const FeaturedSlider = () => {
  return (
    <div className="bg-background py-6 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Destaques do dia</h2>
          <Badge variant="secondary">Patrocinado</Badge>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {featuredItems.map((item) => (
              <CarouselItem key={item.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                <Card className="overflow-hidden hover-lift cursor-pointer">
                  <div className="relative">
                    <div className="aspect-video bg-gradient-hero flex items-center justify-center text-6xl">
                      {item.image}
                    </div>
                    <Badge className="absolute top-2 right-2 bg-warning text-warning-foreground">
                      {item.discount}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.store}</p>
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-primary">{item.price}</span>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium text-foreground">{item.rating}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
      </div>
    </div>
  );
};

export default FeaturedSlider;
