/**
 * Business Dashboard Page
 * Complete dashboard showing business overview after configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  MessageCircle,
  Settings,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Plus
} from 'lucide-react';

// Types
interface DashboardStats {
  totalTransactions: number;
  totalRevenue: number;
  activeCustomers: number;
  pendingBookings: number;
  completionRate: number;
  averageRating: number;
}

interface RecentTransaction {
  id: string;
  customerName: string;
  offeringName: string;
  amount: number;
  status: string;
  scheduledDate?: string;
  createdAt: string;
}

interface BusinessOverview {
  businessName: string;
  businessType: string;
  isConfigured: boolean;
  publicUrl: string;
  whatsappConnected: boolean;
  totalOfferings: number;
}

export const BusinessDashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [businessOverview, setBusinessOverview] = useState<BusinessOverview | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock dashboard data
      setStats({
        totalTransactions: 156,
        totalRevenue: 633750.00, // ₹6,33,750 (8450 * 75)
        activeCustomers: 89,
        pendingBookings: 12,
        completionRate: 94.2,
        averageRating: 4.8
      });

      setRecentTransactions([
        {
          id: '1',
          customerName: 'Priya Sharma',
          offeringName: 'Haircut & Style (Long Hair)',
          amount: 4500.00, // ₹4,500 (60 * 75)
          status: 'confirmed',
          scheduledDate: '2024-02-15',
          createdAt: '2024-02-10T10:00:00Z'
        },
        {
          id: '2',
          customerName: 'Rajesh Kumar',
          offeringName: 'Hair Color (Highlights)',
          amount: 11250.00, // ₹11,250 (150 * 75)
          status: 'pending',
          scheduledDate: '2024-02-20',
          createdAt: '2024-02-12T14:00:00Z'
        },
        {
          id: '3',
          customerName: 'Sunita Patel',
          offeringName: 'Manicure',
          amount: 1875.00, // ₹1,875 (25 * 75)
          status: 'completed',
          scheduledDate: '2024-02-08',
          createdAt: '2024-02-05T09:00:00Z'
        },
        {
          id: '4',
          customerName: 'Amit Singh',
          offeringName: 'Facial Treatment',
          amount: 4875.00, // ₹4,875 (65 * 75)
          status: 'in_progress',
          scheduledDate: '2024-02-14',
          createdAt: '2024-02-08T16:00:00Z'
        }
      ]);

      setBusinessOverview({
        businessName: 'Spark Beauty Salon',
        businessType: 'Beauty Salon',
        isConfigured: true,
        publicUrl: 'https://whatsapp-bot-for-consumer-2nrbjxoa4-abinalyas-projects.vercel.app/customer',
        whatsappConnected: true,
        totalOfferings: 4
      });

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Clock },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Business Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with {businessOverview?.businessName}.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <a href="/customer" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Page
            </a>
          </Button>
          <Button>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Business Status Alert */}
      {businessOverview?.isConfigured && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            🎉 Your business is fully configured and ready to accept customers! 
            Your public page is live at{' '}
            <a 
              href="/customer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium underline"
            >
              {businessOverview.publicUrl}
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats?.totalTransactions}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Appointments</p>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+18% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats?.activeCustomers}</div>
            </div>
            <p className="text-xs text-muted-foreground">Active Clients</p>
            <div className="flex items-center space-x-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats?.pendingBookings}</div>
            </div>
            <p className="text-xs text-muted-foreground">Pending Bookings</p>
            <div className="flex items-center space-x-1 mt-1">
              <span className="text-xs text-muted-foreground">Requires attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp Bot</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Business Overview</CardTitle>
                <CardDescription>Your business configuration and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Business Name</span>
                  <span className="text-sm">{businessOverview?.businessName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Business Type</span>
                  <span className="text-sm">{businessOverview?.businessType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Offerings</span>
                  <span className="text-sm">{businessOverview?.totalOfferings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">WhatsApp Bot</span>
                  <Badge variant={businessOverview?.whatsappConnected ? "default" : "secondary"}>
                    {businessOverview?.whatsappConnected ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Configuration</span>
                  <Badge variant={businessOverview?.isConfigured ? "default" : "secondary"}>
                    {businessOverview?.isConfigured ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button className="w-full" variant="outline" asChild>
                    <a href="/business-config-full">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Business Configuration
                    </a>
                  </Button>
                  <Button className="w-full" variant="outline" asChild>
                    <a href="/offerings">
                      <Plus className="mr-2 h-4 w-4" />
                      Manage Offerings
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="/transactions">
                    <Calendar className="mr-2 h-4 w-4" />
                    View All Appointments
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="/offerings">
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Services
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Configure WhatsApp Bot
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <a href="/customer" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview Customer Page
                  </a>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest appointments and bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{transaction.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.offeringName}
                        </div>
                        {transaction.scheduledDate && (
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(transaction.scheduledDate)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatPrice(transaction.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      
                      {getStatusBadge(transaction.status)}

                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/transactions`}>
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4">
                <Button className="w-full" variant="outline" asChild>
                  <a href="/transactions">
                    View All Transactions
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Completion Rate</span>
                  <span className="text-sm font-bold text-green-600">{stats?.completionRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Rating</span>
                  <span className="text-sm font-bold text-yellow-600">{stats?.averageRating}/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Customer Retention</span>
                  <span className="text-sm font-bold text-blue-600">78%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Booking Value</span>
                  <span className="text-sm font-bold">{formatPrice((stats?.totalRevenue || 0) / (stats?.totalTransactions || 1))}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Detailed analytics charts would be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Bot Status</CardTitle>
              <CardDescription>Manage your WhatsApp integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-medium">WhatsApp Bot Connected</p>
                    <p className="text-sm text-muted-foreground">Ready to receive customer messages</p>
                  </div>
                </div>
                <Badge variant="default">Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Messages Today</h4>
                  <div className="text-2xl font-bold">23</div>
                  <p className="text-xs text-muted-foreground">+5 from yesterday</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Bookings via Bot</h4>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">34% of total bookings</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Configure Bot Responses
                </Button>
                <Button className="w-full" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  WhatsApp Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessDashboardPage;