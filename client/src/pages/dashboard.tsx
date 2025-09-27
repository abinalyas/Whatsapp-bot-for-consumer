import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";
import { ServicesPanel } from "@/components/services-panel";
import { BotConfig } from "@/components/bot-config";
import { ActivityFeed } from "@/components/activity-feed";
import { BookingsManagement } from "@/components/bookings-management";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Settings, Bell, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    // Ensure dashboard KPIs reflect new bookings/messages quickly
    staleTime: 5000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
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
              <h2 className="text-2xl font-semibold text-foreground">Overview</h2>
              <p className="text-muted-foreground">Monitor your business performance and manage operations</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Today's Revenue"
              value={statsLoading ? "..." : `₹${stats?.todayRevenue?.toLocaleString() || "0"}`}
              icon="fas fa-rupee-sign"
              iconColor="text-green-600 dark:text-green-400"
              iconBg="bg-green-100 dark:bg-green-900/20"
              change="+18%"
              changeText="from yesterday"
              isPositive={true}
              testId="stat-today-revenue"
            />
            <StatCard
              title="This Week's Revenue"
              value={statsLoading ? "..." : `₹${((stats?.todayRevenue || 0) * 7).toLocaleString()}`}
              icon="fas fa-calendar-week"
              iconColor="text-blue-600 dark:text-blue-400"
              iconBg="bg-blue-100 dark:bg-blue-900/20"
              change="+12%"
              changeText="from last week"
              isPositive={true}
              testId="stat-week-revenue"
            />
            <StatCard
              title="This Month's Revenue"
              value={statsLoading ? "..." : `₹${((stats?.todayRevenue || 0) * 30).toLocaleString()}`}
              icon="fas fa-calendar-alt"
              iconColor="text-purple-600 dark:text-purple-400"
              iconBg="bg-purple-100 dark:bg-purple-900/20"
              change="+25%"
              changeText="from last month"
              isPositive={true}
              testId="stat-month-revenue"
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b pb-3 last:border-b-0">
                      <p className="text-sm">John Doe cancelled 3:00 PM appointment</p>
                      <p className="text-xs text-muted-foreground">10 mins ago</p>
                    </div>
                    <div className="border-b pb-3 last:border-b-0">
                      <p className="text-sm">New booking: Emily Parker for Hair Color</p>
                      <p className="text-xs text-muted-foreground">25 mins ago</p>
                    </div>
                    <div className="border-b pb-3 last:border-b-0">
                      <p className="text-sm">5-star review from Sarah Johnson</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Customer Feedback */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Customer Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="text-2xl">4.8</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < 4
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        (156 reviews)
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">Sarah J.</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Amazing service! Emma did a fantastic job with my hair.</p>
                      </div>
                      <div className="border-b pb-2 last:border-b-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">Mike C.</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Quick and professional beard trim. Highly recommend!</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
