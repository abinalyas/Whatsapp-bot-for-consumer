import { useState } from "react";
import { Menu, Search, Bell, User, Settings, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onSidebarToggle?: () => void;
  currentSection?: string;
  sidebarCollapsed?: boolean;
  onRefreshAppointments?: () => void;
  appointmentsLoading?: boolean;
}

export function Header({ onSidebarToggle, currentSection = "Overview", sidebarCollapsed = false, onRefreshAppointments, appointmentsLoading = false }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="flex items-center justify-center"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Salon Branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BS</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Bella Salon</h1>
              <p className="text-sm text-muted-foreground">{currentSection}</p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search appointments, customers, services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>

          {/* Toast Test Buttons - DEBUG */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🧪 Testing toast from header...');
                toast({
                  title: "🧪 Test Toast",
                  description: "This is a test notification from header",
                  duration: 10000,
                  variant: "default",
                });
                console.log('🧪 Header toast called');
              }}
              className="flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
            >
              Test Toast
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                console.log('🧪 Testing destructive toast from header...');
                toast({
                  title: "🚨 Destructive Test",
                  description: "This should be very visible with red styling",
                  duration: 10000,
                  variant: "destructive",
                });
                console.log('🧪 Header destructive toast called');
              }}
              className="flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
            >
              Test Destructive
            </Button>
            {onRefreshAppointments && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefreshAppointments}
                disabled={appointmentsLoading}
                className="flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
              >
                <RefreshCw className={`h-4 w-4 ${appointmentsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 px-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">AM</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">Alex Manager</p>
                  <p className="text-xs text-muted-foreground">alex@bellasalon.com</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
