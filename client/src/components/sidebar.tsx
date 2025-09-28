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
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
            <Scissors className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Bella Salon</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-3">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 cursor-pointer h-14",
                  location === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                )}
                data-testid={`nav-link-${item.label.toLowerCase()}`}
              >
                <IconComponent className="h-6 w-6" />
                <span className="font-semibold text-base">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
          <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">Bot Active</p>
            <p className="text-xs text-green-600 dark:text-green-500">Connected to WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
