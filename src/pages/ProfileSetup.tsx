import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

const conditions = [
  { id: "celiac", label: "Doença Celíaca", group: "gluten" },
  { id: "lactose", label: "Intolerância à Lactose", group: "dairy" },
  { id: "aplv", label: "APLV (Alergia à Proteína do Leite)", group: "dairy" },
  { id: "diabetes", label: "Diabetes", group: "sugar" },
  { id: "vegan", label: "Vegano", group: "animal" },
  { id: "vegetarian", label: "Vegetariano", group: "meat" },
  { id: "renal", label: "Dieta Renal", group: "sodium" },
  { id: "peanut", label: "Alergia a Amendoim", group: "nuts" },
  { id: "seafood", label: "Alergia a Frutos do Mar", group: "seafood" },
  { id: "lowcarb", label: "Low Carb", group: "carbs" },
];

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

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
  }, [navigate]);

  const toggleCondition = (conditionId: string) => {
    setSelectedConditions((prev) =>
      prev.includes(conditionId)
        ? prev.filter((id) => id !== conditionId)
        : [...prev, conditionId]
    );
  };

  const handleSubmit = async () => {
    if (selectedConditions.length === 0) {
      toast.error("Selecione pelo menos uma restrição alimentar");
      return;
    }

    setLoading(true);
    try {
      // Here we would save to database - for now just navigate
      toast.success("Perfil configurado com sucesso!");
      setTimeout(() => navigate("/home"), 1000);
    } catch (error) {
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Configure seu perfil alimentar
          </CardTitle>
          <CardDescription className="text-center text-base">
            Selecione suas restrições alimentares para receber recomendações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conditions.map((condition) => {
              const isSelected = selectedConditions.includes(condition.id);
              return (
                <div
                  key={condition.id}
                  className={`
                    flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer
                    transition-all duration-200 hover-lift
                    ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }
                  `}
                  onClick={() => toggleCondition(condition.id)}
                >
                  <Checkbox
                    id={condition.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleCondition(condition.id)}
                  />
                  <Label
                    htmlFor={condition.id}
                    className="flex-1 cursor-pointer font-medium"
                  >
                    {condition.label}
                  </Label>
                  {isSelected && (
                    <CheckCircle2 className="h-5 w-5 text-primary animate-scale-in" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="sm:flex-1"
              onClick={handleSkip}
              disabled={loading}
            >
              Pular por agora
            </Button>
            <Button
              className="sm:flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Continuar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
