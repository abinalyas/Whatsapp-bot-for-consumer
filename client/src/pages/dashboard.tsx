import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { ChatPreview } from "@/components/chat-preview";
import { ServicesPanel } from "@/components/services-panel";
import { BotConfig } from "@/components/bot-config";
import { ActivityFeed } from "@/components/activity-feed";
import { BookingsManagement } from "@/components/bookings-management";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface Stats {
  todayMessages: number;
  todayBookings: number;
  todayRevenue: number;
  responseRate: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const handleRefresh = () => {
    refetchStats();
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Manage your WhatsApp bot and monitor conversations - Updated!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <i className="fas fa-clock"></i>
                <span>Last sync: 2 min ago</span>
              </div>
              <Link href="/test">
                <Button variant="outline">
                  Test Routing
                </Button>
              </Link>
              <Link href="/business-config">
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Business Config
                </Button>
              </Link>
              <Button onClick={handleRefresh} data-testid="button-refresh">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Today's Messages"
              value={statsLoading ? "..." : stats?.todayMessages?.toString() || "0"}
              icon="fas fa-message"
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/20"
              change="+12%"
              changeText="from yesterday"
              isPositive={true}
              testId="stat-today-messages"
            />
            <StatCard
              title="Bookings Today"
              value={statsLoading ? "..." : stats?.todayBookings?.toString() || "0"}
              icon="fas fa-calendar-check"
              iconColor="text-green-600 dark:text-green-400"
              iconBg="bg-green-100 dark:bg-green-900/20"
              change="+25%"
              changeText="from yesterday"
              isPositive={true}
              testId="stat-today-bookings"
            />
            <StatCard
              title="Revenue Today"
              value={statsLoading ? "..." : `₹${stats?.todayRevenue?.toLocaleString() || "0"}`}
              icon="fas fa-rupee-sign"
              iconColor="text-yellow-600 dark:text-yellow-400"
              iconBg="bg-yellow-100 dark:bg-yellow-900/20"
              change="+18%"
              changeText="from yesterday"
              isPositive={true}
              testId="stat-today-revenue"
            />
            <StatCard
              title="Response Rate"
              value={statsLoading ? "..." : `${stats?.responseRate || 98}%`}
              icon="fas fa-bolt"
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/20"
              change="Excellent"
              isPositive={true}
              showCheckIcon={true}
              testId="stat-response-rate"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChatPreview />
            <ServicesPanel />
          </div>

          {/* Bookings Management Section */}
          <div className="mt-8">
            <BookingsManagement />
          </div>

          {/* Configuration Section */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BotConfig />
            <ActivityFeed />
          </div>
        </main>
      </div>
    </div>
  );
}
