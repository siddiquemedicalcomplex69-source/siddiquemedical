// @ts-nocheck
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/shared/AuthShell";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    if (user) {
      if (redirectTo) {
        navigate(redirectTo);
      } else if (user.role === 'admin') {
        navigate("/admin/dashboard");
      } else if (user.role === 'doctor') {
        navigate("/schedule");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate, redirectTo]);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('is_active, role').eq('id', data.user.id).single();
        if (profile && !profile.is_active && profile.role !== 'admin') {
          return;
        }

        toast.success("Welcome back!");
        
        if (redirectTo) {
          navigate(redirectTo);
        } else if (profile?.role === 'admin') {
          navigate("/admin/dashboard");
        } else if (profile?.role === 'doctor') {
          navigate("/schedule");
        } else {
          navigate("/");
        }
      }
    } catch (e) {
      setShakeKey((k) => k + 1);
      toast.error(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your appointments.">
      <form
        key={shakeKey}
        onSubmit={form.handleSubmit(onSubmit, () => setShakeKey((k) => k + 1))}
        className={"space-y-5 " + (shakeKey ? "shake-x" : "")}
      >
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            className="h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:border-[#14b8a6]"
            {...form.register("email")}
          />
        </Field>
        <Field label="Password" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            className="h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:border-[#14b8a6]"
            {...form.register("password")}
          />
        </Field>
        <Button
          type="submit"
          className="w-full h-11 bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base font-semibold text-white"
          disabled={busy}
        >
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : "Sign In"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to={redirectTo ? `/register?redirectTo=${encodeURIComponent(redirectTo)}` : "/register"}
          className="font-semibold text-[#14b8a6] link-underline"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-[#0b1f3a]/70">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  );
}
