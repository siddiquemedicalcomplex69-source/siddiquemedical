import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/shared/AuthShell";
import { supabase } from "@/lib/supabase";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20).optional().or(z.literal("")),
  password: z.string().min(6, "At least 6 characters"),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, {
  message: "Passwords do not match", path: ["confirm"],
});
type FormValues = z.infer<typeof schema>;

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", password: "", confirm: "" },
  });

  const pw = form.watch("password");
  const score = useMemo(() => scorePassword(pw ?? ""), [pw]);
  const strengthColor = ["bg-rose-400", "bg-rose-400", "bg-amber-400", "bg-lime-500", "bg-emerald-500"][score];
  const strengthLabel = ["Too short", "Weak", "Fair", "Good", "Strong"][score];

  async function onSubmit(values: FormValues) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.full_name,
            phone: values.phone || undefined,
            role: "patient",
          }
        }
      });
      if (error) throw error;
      toast.success("Account created");
      navigate(redirectTo || "/appointments");
    } catch (e) {
      setShakeKey((k) => k + 1);
      toast.error(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Sign up as a patient to book and manage appointments.">
      <form
        key={shakeKey}
        onSubmit={form.handleSubmit(onSubmit, () => setShakeKey((k) => k + 1))}
        className={"space-y-4 " + (shakeKey ? "shake-x" : "")}
      >
        <Field label="Full name" error={form.formState.errors.full_name?.message}>
          <Input autoComplete="name" className={inputCls} {...form.register("full_name")} />
        </Field>
        <Field label="Email" error={form.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" className={inputCls} {...form.register("email")} />
        </Field>
        <Field label="Phone (optional)" error={form.formState.errors.phone?.message}>
          <Input type="tel" autoComplete="tel" className={inputCls} {...form.register("phone")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password" error={form.formState.errors.password?.message}>
            <Input type="password" autoComplete="new-password" className={inputCls} {...form.register("password")} />
          </Field>
          <Field label="Confirm" error={form.formState.errors.confirm?.message}>
            <Input type="password" autoComplete="new-password" className={inputCls} {...form.register("confirm")} />
          </Field>
        </div>

        {pw && (
          <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={"h-full transition-all duration-500 " + strengthColor}
                style={{ width: `${(score / 4) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Password strength: <span className="font-medium">{strengthLabel}</span></p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-11 bg-[#14b8a6] hover:bg-[#0d9488] btn-shimmer hover:scale-[1.02] active:scale-95 transition-all duration-300 text-base font-semibold text-white"
          disabled={busy}
        >
          {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : "Create Account"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : "/login"}
          className="font-semibold text-[#14b8a6] link-underline"
        >Sign in</Link>
      </p>
    </AuthShell>
  );
}

const inputCls = "h-11 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[#14b8a6] focus-visible:border-[#14b8a6]";

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
