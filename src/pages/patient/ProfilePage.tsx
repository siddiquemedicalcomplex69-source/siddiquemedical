import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { getProfile, updateProfile, uploadAvatar, getDoctorProfileDetails, updateDoctor } from "@/lib/api";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().optional(),
  qualification: z.string().optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile(user!.id),
    enabled: !!user?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "",
      date_of_birth: "",
      gender: "male",
      address: "",
      qualification: "",
      specialty: "",
      bio: "",
    },
  });

  const { data: doctorProfile } = useQuery({
    queryKey: ["doctorProfile", user?.id],
    queryFn: () => getDoctorProfileDetails(user!.id),
    enabled: !!user?.id && user.role === "doctor",
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "male",
        address: profile.address || "",
        qualification: doctorProfile?.qualification || "",
        specialty: doctorProfile?.specialty || "",
        bio: doctorProfile?.bio || "",
      });
      if (!selectedFile) setPreviewAvatar(profile.avatar_url);
    }
  }, [profile, doctorProfile, form, selectedFile]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      let avatarUrl = profile?.avatar_url;
      if (selectedFile) {
        avatarUrl = await uploadAvatar(user!.id, selectedFile);
      }
      
      const { qualification, specialty, bio, ...profileUpdates } = values;
      
      const updates = { ...profileUpdates, avatar_url: avatarUrl };
      await updateProfile(user!.id, updates);
      
      if (user!.role === "doctor" && doctorProfile?.id) {
        await updateDoctor(doctorProfile.id, user!.id, { qualification, specialty, bio });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile updated successfully");
      setSelectedFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedFile(f);
    setPreviewAvatar(URL.createObjectURL(f));
    toast.success("Photo selected. Save changes to upload.");
  };

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your personal information.</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Personal information</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {previewAvatar && <AvatarImage src={previewAvatar} alt={form.watch("full_name")} />}
                <AvatarFallback className="text-lg">{initials(form.watch("full_name") || "U")}</AvatarFallback>
              </Avatar>
              <div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={mutation.isPending}>
                  <Upload className="mr-2 h-4 w-4" /> Change Photo
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">PNG or JPG, up to a few MB.</p>
              </div>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" {...form.register("full_name")} disabled={mutation.isPending} />
                {form.formState.errors.full_name && (
                  <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register("phone")} disabled={mutation.isPending} />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input id="date_of_birth" type="date" {...form.register("date_of_birth")} disabled={mutation.isPending} />
                </div>
              </div>
              <div>
                <Label>Gender</Label>
                <Select
                  value={form.watch("gender")}
                  onValueChange={(v) => form.setValue("gender", v as FormValues["gender"])}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" rows={3} {...form.register("address")} disabled={mutation.isPending} />
              </div>

              {user?.role === "doctor" && (
                <>
                  <div className="pt-4 pb-2">
                    <h3 className="text-lg font-medium">Professional Details</h3>
                    <p className="text-sm text-muted-foreground">Information displayed on your doctor profile.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="qualification">Qualifications (e.g., MBBS, FCPS)</Label>
                      <Input id="qualification" {...form.register("qualification")} disabled={mutation.isPending} />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Specialty / Expertise</Label>
                      <Input id="specialty" {...form.register("specialty")} disabled={mutation.isPending} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Professional Bio</Label>
                    <Textarea id="bio" rows={4} placeholder="Write a short professional bio..." {...form.register("bio")} disabled={mutation.isPending} />
                  </div>
                </>
              )}

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
