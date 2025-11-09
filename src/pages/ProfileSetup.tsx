import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

interface DietaryRestriction {
  id: string;
  code: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  icon: string;
}

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingRestrictions, setLoadingRestrictions] = useState(true);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [restrictions, setRestrictions] = useState<DietaryRestriction[]>([]);
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

  useEffect(() => {
    const fetchRestrictions = async () => {
      setLoadingRestrictions(true);
      try {
        const { data, error } = await supabase
          .from('dietary_restrictions')
          .select('*')
          .order('severity', { ascending: false });

        if (error) throw error;
        setRestrictions((data || []).map(r => ({
          ...r,
          severity: r.severity as 'mild' | 'moderate' | 'severe'
        })));
      } catch (error) {
        console.error('Error fetching restrictions:', error);
        toast.error('Erro ao carregar restrições alimentares');
      } finally {
        setLoadingRestrictions(false);
      }
    };

    fetchRestrictions();
  }, []);

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
      const { error } = await supabase
        .from('user_dietary_profiles')
        .upsert({
          user_id: user.id,
          restrictions: selectedConditions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Perfil configurado com sucesso!");
      navigate("/home");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'destructive';
      case 'moderate':
        return 'default';
      case 'mild':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'severe':
        return 'Severa';
      case 'moderate':
        return 'Moderada';
      case 'mild':
        return 'Leve';
      default:
        return '';
    }
  };

  if (!user || loadingRestrictions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-card animate-fade-in">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Configure seu perfil alimentar
          </CardTitle>
          <CardDescription className="text-center text-base">
            Selecione suas restrições alimentares para receber recomendações personalizadas e produtos seguros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {restrictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma restrição alimentar disponível no momento
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {restrictions.map((restriction) => {
                const isSelected = selectedConditions.includes(restriction.id);
                return (
                  <div
                    key={restriction.id}
                    className={`
                      flex items-start space-x-4 p-4 rounded-xl border-2 cursor-pointer
                      transition-all duration-200 hover-lift
                      ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card"
                      }
                    `}
                    onClick={() => toggleCondition(restriction.id)}
                  >
                    <Checkbox
                      id={restriction.id}
                      checked={isSelected}
                      onCheckedChange={() => toggleCondition(restriction.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Label
                          htmlFor={restriction.id}
                          className="cursor-pointer font-semibold text-base"
                        >
                          {restriction.name}
                        </Label>
                        <Badge variant={getSeverityColor(restriction.severity) as any}>
                          {getSeverityLabel(restriction.severity)}
                        </Badge>
                        {restriction.severity === 'severe' && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{restriction.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary animate-scale-in mt-1" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
