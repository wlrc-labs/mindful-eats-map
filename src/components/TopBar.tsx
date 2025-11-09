import { ShoppingCart, User, LogOut, Settings, Home, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";

interface TopBarProps {
  userName?: string;
  cartItemsCount?: number;
}

const TopBar = ({ userName = "Usuário", cartItemsCount = 0 }: TopBarProps) => {
  const navigate = useNavigate();
  const { isAdmin, isCliente } = useUserRole();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <h1 className="text-2xl font-bold text-primary">Alimmenta</h1>

          {/* Right side: Cart and User */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => toast.info("Carrinho em desenvolvimento")}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-popover">
                <DropdownMenuLabel>Painéis</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/home")}>
                  <Home className="mr-2 h-4 w-4" />
                  Painel Usuário
                </DropdownMenuItem>
                {isCliente && (
                  <DropdownMenuItem onClick={() => navigate("/cliente")}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Painel Cliente
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Configurações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/profile-setup")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Perfil Alimentar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
