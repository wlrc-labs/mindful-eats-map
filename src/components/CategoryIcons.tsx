import { Store, Utensils, ShoppingBag, Pizza, Coffee, Leaf } from "lucide-react";

const categories = [
  { id: "markets", icon: ShoppingBag, label: "Mercados", color: "text-emerald-600" },
  { id: "restaurants", icon: Utensils, label: "Restaurantes", color: "text-amber-600" },
  { id: "stores", icon: Store, label: "Lojas", color: "text-blue-600" },
  { id: "bakery", icon: Pizza, label: "Padarias", color: "text-orange-600" },
  { id: "cafes", icon: Coffee, label: "Cafés", color: "text-brown-600" },
  { id: "organic", icon: Leaf, label: "Orgânicos", color: "text-green-600" },
];

interface CategoryIconsProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
}

const CategoryIcons = ({ onCategorySelect, selectedCategory }: CategoryIconsProps) => {
  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategorySelect?.(category.id)}
                className={`
                  flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-xl
                  transition-all duration-200 hover-lift
                  ${isSelected ? 'bg-primary/10' : 'hover:bg-muted'}
                `}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                  transition-colors
                `}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className={`
                  text-xs font-medium text-center whitespace-nowrap
                  ${isSelected ? 'text-primary' : 'text-muted-foreground'}
                `}>
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryIcons;
