import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Scissors, Users, Calendar, CreditCard, UserCheck, Tag, Settings } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Overview", icon: Home },
    { href: "/offerings", label: "Services", icon: Scissors },
    { href: "/salon-dashboard", label: "Staff", icon: Users },
    { href: "/transactions", label: "Calendar", icon: Calendar },
    { href: "/transactions", label: "Payments", icon: CreditCard },
    { href: "/customer", label: "Customers", icon: UserCheck },
    { href: "/bot-flows", label: "Promotions", icon: Tag },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Bella Salon</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors cursor-pointer h-12",
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">Bot Active</p>
            <p className="text-xs text-green-600 dark:text-green-500">Connected to WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
