import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Edit, CheckCircle } from "lucide-react";
import { useState } from "react";

export function BotConfig() {
  const [autoResponses, setAutoResponses] = useState(true);

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
              <Button variant="ghost" size="sm" data-testid="button-edit-upi-id">
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
            </div>
            <p className="font-mono text-sm text-muted-foreground" data-testid="text-upi-id">
              sparksalon@upi
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
          <Button className="w-full" data-testid="button-save-config">
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
