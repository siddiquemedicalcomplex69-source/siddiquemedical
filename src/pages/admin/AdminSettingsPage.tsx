import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/api";

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["globalSettings"],
    queryFn: getGlobalSettings,
  });

  const [hospitalName, setHospitalName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");
  
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState("");

  useEffect(() => {
    if (settings) {
      setHospitalName(settings.hospital_name || "");
      setContactNumber(settings.contact_number || "");
      setAddress(settings.address || "");
      setEmergencyEmail(settings.emergency_email || "");
      setBannerEnabled(settings.banner_enabled || false);
      setBannerText(settings.banner_text || "");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: updateGlobalSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["globalSettings"] });
      toast.success("Settings updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    }
  });

  const handleSaveHospitalDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      hospital_name: hospitalName,
      contact_number: contactNumber,
      address,
      emergency_email: emergencyEmail,
    });
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      banner_enabled: bannerEnabled,
      banner_text: bannerText,
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background page-fade">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Global Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage hospital information and global website configurations.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hospital Details</CardTitle>
              <CardDescription>This information will be displayed on the website footer and contact pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveHospitalDetails} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Hospital Name</Label>
                  <Input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} required disabled={updateMutation.isPending} />
                </div>
                <div>
                  <Label>Contact Number</Label>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required disabled={updateMutation.isPending} />
                </div>
                <div>
                  <Label>Emergency Email</Label>
                  <Input type="email" value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} required disabled={updateMutation.isPending} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} required disabled={updateMutation.isPending} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Save Details
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Announcement Banner</CardTitle>
                  <CardDescription>Display an alert banner at the top of the homepage for all visitors.</CardDescription>
                </div>
                <Switch 
                  checked={bannerEnabled} 
                  onCheckedChange={(val) => {
                    setBannerEnabled(val);
                    updateMutation.mutate({
                      banner_enabled: val,
                      banner_text: bannerText,
                    });
                  }} 
                  disabled={updateMutation.isPending} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveBanner} className="grid gap-4">
                <div className={!bannerEnabled ? "opacity-50 pointer-events-none" : ""}>
                  <Label>Banner Message</Label>
                  <Textarea 
                    value={bannerText} 
                    onChange={(e) => setBannerText(e.target.value)} 
                    rows={2} 
                    placeholder="e.g. Free health camp this weekend!"
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" /> Update Banner
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
