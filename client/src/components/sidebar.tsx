import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "fas fa-tachometer-alt" },
    { href: "/business-config-full", label: "Business Setup", icon: "fas fa-building" },
    { href: "/offerings", label: "Services", icon: "fas fa-cut" },
    { href: "/transactions", label: "Appointments", icon: "fas fa-calendar-check" },
    { href: "/demo", label: "Business Demo", icon: "fas fa-eye" },
    { href: "/customer", label: "Customer View", icon: "fas fa-external-link-alt" },
    { href: "/conversations", label: "WhatsApp Bot", icon: "fas fa-comments" },
    { href: "/analytics", label: "Analytics", icon: "fas fa-chart-bar" },
    { href: "/settings", label: "Settings", icon: "fas fa-cog" },
  ];

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-whatsapp text-primary-foreground text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Spark Salon</h1>
            <p className="text-sm text-muted-foreground">WhatsApp Bot</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                location === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              data-testid={`nav-link-${item.label.toLowerCase()}`}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
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
