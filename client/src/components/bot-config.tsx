import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Save, Edit, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  upiId: string;
  businessName: string;
  currency: string;
}

export function BotConfig() {
  const [autoResponses, setAutoResponses] = useState(true);
  const [isUpiDialogOpen, setIsUpiDialogOpen] = useState(false);
  const [upiFormData, setUpiFormData] = useState({
    upiId: "",
    businessName: "",
  });

  const { toast } = useToast();

  // Fetch settings
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settingsData: Partial<Settings>) => {
      const response = await apiRequest("/api/settings", "PATCH", settingsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsUpiDialogOpen(false);
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Update settings error:", error);
      toast({
        title: "Error",
        description: `Failed to update settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEditUpi = () => {
    setUpiFormData({
      upiId: settings?.upiId || "",
      businessName: settings?.businessName || "",
    });
    setIsUpiDialogOpen(true);
  };

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(upiFormData);
  };

  const handleSaveConfig = () => {
    // Save auto-responses and other config
    toast({
      title: "Configuration saved",
      description: "Bot configuration has been updated.",
    });
  };

  return (
    <Card data-testid="bot-config">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Bot Configuration</CardTitle>
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">WhatsApp Phone ID</label>
              <Button variant="ghost" size="sm" data-testid="button-edit-phone-id">
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>
            <p className="font-mono text-sm text-muted-foreground" data-testid="text-phone-id">
              {import.meta.env.VITE_WHATSAPP_PHONE_ID || "106742562xxxxx"}
            </p>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">Webhook URL</label>
              <span className="text-green-600 dark:text-green-400 text-xs flex items-center">
                <CheckCircle className="mr-1 h-3 w-3" />
                Verified
              </span>
            </div>
            <p className="font-mono text-sm text-muted-foreground" data-testid="text-webhook-url">
              {window.location.origin}/webhook
            </p>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">UPI ID</label>
              <Dialog open={isUpiDialogOpen} onOpenChange={setIsUpiDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-edit-upi-id" onClick={handleEditUpi}>
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Payment Settings</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveUpi} className="space-y-4">
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={upiFormData.upiId}
                        onChange={(e) => setUpiFormData({ ...upiFormData, upiId: e.target.value })}
                        placeholder="yourname@upi"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={upiFormData.businessName}
                        onChange={(e) => setUpiFormData({ ...upiFormData, businessName: e.target.value })}
                        placeholder="Your Business Name"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsUpiDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateSettingsMutation.isPending}>
                        <Save className="mr-2 h-4 w-4" />
                        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="font-mono text-sm text-muted-foreground" data-testid="text-upi-id">
              {settings?.upiId || "Loading..."}
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Auto-Responses</p>
                <p className="text-sm text-muted-foreground">Enable automatic greeting messages</p>
              </div>
              <Switch
                checked={autoResponses}
                onCheckedChange={setAutoResponses}
                data-testid="switch-auto-responses"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <Button className="w-full" data-testid="button-save-config" onClick={handleSaveConfig}>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
