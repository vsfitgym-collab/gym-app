import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  User,
  Zap,
  Calendar,
  AlertCircle,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { PageLoading } from "@/components/ui/Loading";

const steps = [
  { id: 0, title: "Objetivo", icon: Target },
  { id: 1, title: "Dados físicos", icon: User },
  { id: 2, title: "Nível", icon: Zap },
  { id: 3, title: "Rotina", icon: Calendar },
  { id: 4, title: "Lesões", icon: AlertCircle },
  { id: 5, title: "Preferências", icon: Sparkles },
  { id: 6, title: "Revisão", icon: Check },
];

const objectives = [
  { value: "emagrecimento", label: "Emagrecimento" },
  { value: "hipertrofia", label: "Hipertrofia (Ganho de massa)" },
  { value: "forca", label: "Força" },
  { value: "condicionamento", label: "Condicionamento" },
  { value: "saude", label: "Saúde geral" },
];

const levels = [
  { value: "iniciante", label: "Iniciante (< 1 ano)" },
  { value: "intermediario", label: "Intermediário (1-3 anos)" },
  { value: "avancado", label: "Avançado (> 3 anos)" },
];

const daysOptions = [
  { value: "1", label: "1 dia por semana" },
  { value: "2", label: "2 dias por semana" },
  { value: "3", label: "3 dias por semana" },
  { value: "4", label: "4 dias por semana" },
  { value: "5", label: "5 dias por semana" },
  { value: "6", label: "6 dias por semana" },
];

const timeOptions = [
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2 horas" },
];

function parseDecimal(value: string) {
  if (!value.trim()) return null;

  const normalizedValue = value.replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseHeightInMeters(value: string) {
  const height = parseDecimal(value);

  if (!height) return null;

  // Aceita 1.75 ou 175 e salva sempre em metros.
  return height > 3 ? height / 100 : height;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const {
    user,
    initialized,
    loading: authLoading,
    fetchUser,
    setProfileExtended,
  } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    objective: "",
    age: "",
    height: "",
    weight: "",
    level: "",
    days_per_week: "",
    training_time: "",
    injuries: "",
    preferences: "",
  });

  useEffect(() => {
    if (!initialized) {
      fetchUser();
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [fetchUser, initialized, navigate, user]);

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) {
        setError("Sessão expirada. Por favor, faça login novamente.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
        return;
      }

      const profilePayload = {
        user_id: authUser.id,
        objective: formData.objective,
        age: formData.age ? parseInt(formData.age) : null,
        height: parseHeightInMeters(formData.height),
        weight: parseDecimal(formData.weight),
        level: formData.level as any,
        days_per_week: formData.days_per_week
          ? parseInt(formData.days_per_week)
          : null,
        training_time: formData.training_time
          ? parseInt(formData.training_time)
          : null,
        injuries: formData.injuries || null,
        preferences: formData.preferences || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      // Tenta fazer upsert (INSERT OR UPDATE)
      const { data: existingProfile, error: checkError } = await supabase
        .from("user_profiles_extended")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (checkError) throw checkError;

      let result;
      if (existingProfile) {
        // UPDATE
        const { data: updatedProfile, error: updateError } = await supabase
          .from("user_profiles_extended")
          .update(profilePayload)
          .eq("user_id", authUser.id)
          .select("*")
          .single();

        if (updateError) throw updateError;
        result = updatedProfile;
      } else {
        // INSERT
        const { data: insertedProfile, error: insertError } = await supabase
          .from("user_profiles_extended")
          .insert(profilePayload)
          .select("*")
          .single();

        if (insertError) throw insertError;
        result = insertedProfile;
      }

      setProfileExtended(result);

      // Navega para o dashboard
      // O StudentLayout vai fazer fetchUser() e sincronizar o estado
      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      const errorMessage = error.message || "Erro desconhecido";
      const errorCode = error.code;

      let userMessage = "Não foi possível salvar sua ficha técnica.";

      if (
        errorMessage.includes("row-level security") ||
        errorCode === "PGRST"
      ) {
        userMessage =
          "O Supabase bloqueou o salvamento. Verifique as permissões. Se o problema persistir, execute FIX_ONBOARDING_RLS.sql no SQL Editor do Supabase.";
      } else if (errorMessage.includes("duplicate key")) {
        userMessage = "Dados duplicados. Tente novamente.";
      } else if (errorMessage.includes("JWT")) {
        userMessage = "Sessão expirada. Faça login novamente.";
      }

      setError(userMessage);
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!formData.objective;
      case 1:
        return !!formData.age || !!formData.height || !!formData.weight;
      case 2:
        return !!formData.level;
      case 3:
        return !!formData.days_per_week && !!formData.training_time;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Qual é seu objetivo principal com o treino?
            </p>
            <div className="grid grid-cols-1 gap-3">
              {objectives.map((obj) => (
                <button
                  key={obj.value}
                  type="button"
                  onClick={() => updateFormData("objective", obj.value)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all duration-200",
                    formData.objective === obj.value
                      ? "border-primary bg-primary/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10",
                  )}
                >
                  {obj.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Informe seus dados físicos
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Idade"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Altura (m ou cm)"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
              />
              <Input
                type="number"
                placeholder="Peso (kg)"
                value={formData.weight}
                onChange={(e) => updateFormData("weight", e.target.value)}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Qual é seu nível de experiência?
            </p>
            <div className="space-y-3">
              {levels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => updateFormData("level", level.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all duration-200",
                    formData.level === level.value
                      ? "border-primary bg-primary/20"
                      : "border-white/20 bg-white/5 hover:bg-white/10",
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Quantos dias por semana você quer treinar?
            </p>
            <Select
              label="Dias por semana"
              options={daysOptions}
              value={formData.days_per_week}
              onChange={(e) => updateFormData("days_per_week", e.target.value)}
            />
            <Select
              label="Tempo por treino"
              options={timeOptions}
              value={formData.training_time}
              onChange={(e) => updateFormData("training_time", e.target.value)}
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Você tem alguma lesão ou limitação?
            </p>
            <textarea
              className="w-full h-32 bg-white/5 border border-white/20 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Descreva suas lesões ou leave vazio se não tiver..."
              value={formData.injuries}
              onChange={(e) => updateFormData("injuries", e.target.value)}
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Suas preferências de treino
            </p>
            <textarea
              className="w-full h-32 bg-white/5 border border-white/20 rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Ex: Prefiro treino matinal, curto e intenso..."
              value={formData.preferences}
              onChange={(e) => updateFormData("preferences", e.target.value)}
            />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Revise suas informações
            </p>
            <div className="space-y-3">
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Objetivo</span>
                <span className="font-medium">
                  {
                    objectives.find((o) => o.value === formData.objective)
                      ?.label
                  }
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Idade</span>
                <span className="font-medium">
                  {formData.age || "Não informado"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Peso</span>
                <span className="font-medium">
                  {formData.weight ? `${formData.weight} kg` : "Não informado"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Altura</span>
                <span className="font-medium">
                  {formData.height
                    ? `${parseHeightInMeters(formData.height)?.toFixed(2)} m`
                    : "Não informada"}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Nível</span>
                <span className="font-medium">
                  {levels.find((l) => l.value === formData.level)?.label}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-medium">
                  {formData.days_per_week} dias/semana
                </span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!initialized || authLoading) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            {steps.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors duration-300",
                  idx <= currentStep ? "bg-primary" : "bg-white/10",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-all duration-300",
                    step.id === currentStep
                      ? "bg-primary/20 text-primary"
                      : step.id < currentStep
                        ? "bg-primary/10 text-primary/60"
                        : "bg-white/5 text-muted-foreground",
                  )}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Card variant="glass" className="p-8">
          <CardHeader className="text-center mb-8">
            <CardTitle className="text-2xl">
              {steps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                {error}
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleSubmit} loading={loading}>
                  Finalizar
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Próximo
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
