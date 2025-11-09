import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Clock, Info } from "lucide-react";
import { toast } from "sonner";

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    type: string;
    description: string;
    distance: string;
    rating: number;
    tags: string[];
    certified: boolean;
    deliveryTime?: string;
    minOrder?: string;
    typeIcon: React.ReactNode;
    typeLabel: string;
  };
  index: number;
}

const PlaceCard = ({ place, index }: PlaceCardProps) => {
  return (
    <Card
      className="hover-lift cursor-pointer animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => toast.info("Visualização detalhada em desenvolvimento")}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-3 bg-primary/10 rounded-xl shrink-0">
              {place.typeIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-1">
                  {place.name}
                </CardTitle>
                {place.certified && (
                  <Badge className="bg-safe text-safe-foreground shrink-0">
                    ✓ Certificado
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs mt-1">
                {place.typeLabel}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {place.description}
        </p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {place.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Info row */}
        <div className="flex flex-wrap items-center gap-3 text-sm pt-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {place.distance}
          </div>
          
          {place.deliveryTime && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {place.deliveryTime}
            </div>
          )}
          
          <div className="flex items-center gap-1 text-yellow-500 ml-auto">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium text-foreground">
              {place.rating}
            </span>
          </div>
        </div>

        {/* Additional info */}
        {place.minOrder && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            <span>Pedido mínimo: {place.minOrder}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlaceCard;
