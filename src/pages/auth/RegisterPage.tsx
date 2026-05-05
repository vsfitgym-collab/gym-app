import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Mail, Lock, User } from "lucide-react";
import { motion } from "framer-motion";

export function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: "student",
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Aguarda um pouco para o trigger criar o profile
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setSuccess(true);
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass">
        <CardHeader className="text-center">
          <div className="mb-6 flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F1A] to-[#111827] shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-2 ring-[#22C55E]/50 transition-all duration-300 hover:ring-[#22C55E]/80 hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] mx-auto">
            <img src="/icons/logo.png" alt="VSFit" className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Preencha seus dados para começar</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-sm text-green-100">
              ✓ Conta criada com sucesso! Redirecionando para login...
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/50 text-sm text-destructive">
                {error}
              </div>
            )}
            <Input
              type="text"
              placeholder="Nome completo"
              icon={<User className="w-4 h-4" />}
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
              disabled={loading || success}
              className="h-14 rounded-2xl border-white/10 bg-[#111827]/80 px-4 text-base text-white shadow-inner shadow-black/20 outline-none placeholder:text-zinc-500 focus:border-[#22C55E]/70 focus:bg-[#111827] focus:ring-4 focus:ring-[#22C55E]/15 disabled:opacity-60"
              style={{
                borderColor: formData.fullName ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.1)",
                backgroundColor: formData.fullName ? "#101923" : "rgba(17, 24, 39, 0.5)"
              }}
            />
            <Input
              type="email"
              placeholder="Email"
              icon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={loading || success}
              className="h-14 rounded-2xl border-white/10 bg-[#111827]/80 px-4 text-base text-white shadow-inner shadow-black/20 outline-none placeholder:text-zinc-500 focus:border-[#22C55E]/70 focus:bg-[#111827] focus:ring-4 focus:ring-[#22C55E]/15 disabled:opacity-60"
              style={{
                borderColor: formData.email ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.1)",
                backgroundColor: formData.email ? "#101923" : "rgba(17, 24, 39, 0.5)"
              }}
            />
            <Input
              type="password"
              placeholder="Senha"
              icon={<Lock className="w-4 h-4" />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              disabled={loading || success}
              className="h-14 rounded-2xl border-white/10 bg-[#111827]/80 px-4 text-base text-white shadow-inner shadow-black/20 outline-none placeholder:text-zinc-500 focus:border-[#22C55E]/70 focus:bg-[#111827] focus:ring-4 focus:ring-[#22C55E]/15 disabled:opacity-60"
              style={{
                borderColor: formData.password ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.1)",
                backgroundColor: formData.password ? "#101923" : "rgba(17, 24, 39, 0.5)"
              }}
            />
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={success}
            >
              {success ? "Redirecionando..." : "Criar conta"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Já tem conta? </span>
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
