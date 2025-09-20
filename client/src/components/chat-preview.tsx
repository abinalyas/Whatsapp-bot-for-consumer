import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, User } from "lucide-react";

export function ChatPreview() {
  return (
    <Card data-testid="chat-preview">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Chat Preview</CardTitle>
          <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
            <i className="fas fa-circle text-xs mr-1"></i>
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Customer Message */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <p className="text-sm text-foreground">Hi</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Priya • 10:34 AM</p>
            </div>
          </div>

          {/* Bot Response */}
          <div className="flex items-start space-x-3 flex-row-reverse">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-right">
              <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm inline-block text-left">
                <p className="text-sm">👋 Welcome to Spark Salon!</p>
                <p className="text-sm mt-2">Here are our services:</p>
                <div className="mt-2 space-y-1 text-sm">
                  <p>💇‍♀️ Haircut – ₹200</p>
                  <p>✨ Facial – ₹500</p>
                  <p>💆‍♀️ Massage – ₹800</p>
                </div>
                <p className="text-sm mt-2">Reply with service name to book.</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bot • 10:34 AM</p>
            </div>
          </div>

          {/* Customer Selection */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <p className="text-sm text-foreground">Facial</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Priya • 10:35 AM</p>
            </div>
          </div>

          {/* Bot Payment Response */}
          <div className="flex items-start space-x-3 flex-row-reverse">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 text-right">
              <div className="bg-primary text-primary-foreground rounded-lg p-3 shadow-sm inline-block text-left">
                <p className="text-sm">Great choice! Please pay ₹500 for Facial service.</p>
                <button className="inline-block mt-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                  💳 Pay with UPI
                </button>
                <p className="text-sm mt-2">Complete payment and reply 'paid' to confirm booking.</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Bot • 10:35 AM</p>
            </div>
          </div>

          {/* Typing Indicator */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="bg-white dark:bg-gray-700 rounded-lg p-3 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Priya is typing...</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
