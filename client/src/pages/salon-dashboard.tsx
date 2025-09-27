import React, { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, Scissors, CreditCard, MessageSquare, Settings, Home, UserCheck, Clock, DollarSign, Star, Bell } from "lucide-react";

const menuItems = [
  { id: "overview", title: "Overview", icon: Home },
  { id: "services", title: "Services", icon: Scissors },
  { id: "staff", title: "Staff", icon: UserCheck },
  { id: "calendar", title: "Calendar", icon: Calendar },
  { id: "payments", title: "Payments", icon: CreditCard },
  { id: "customers", title: "Customers", icon: Users },
  { id: "promotions", title: "Promotions", icon: MessageSquare },
  { id: "settings", title: "Settings", icon: Settings },
];

// Mock data
const todaysAppointments = [
  { id: 1, time: "9:00 AM", customer: "Sarah Johnson", service: "Hair Cut & Color", staff: "Emma", status: "confirmed" },
  { id: 2, time: "10:30 AM", customer: "Mike Chen", service: "Beard Trim", staff: "David", status: "confirmed" },
  { id: 3, time: "12:00 PM", customer: "Lisa Rodriguez", service: "Manicure", staff: "Anna", status: "pending" },
  { id: 4, time: "2:30 PM", customer: "John Smith", service: "Hair Wash & Style", staff: "Emma", status: "confirmed" },
  { id: 5, time: "4:00 PM", customer: "Amanda White", service: "Facial Treatment", staff: "Sofia", status: "confirmed" },
];

const revenueData = {
  today: 850,
  week: 5200,
  month: 18500
};

const notifications = [
  { id: 1, type: "cancellation", message: "John Doe cancelled 3:00 PM appointment", time: "10 mins ago" },
  { id: 2, type: "booking", message: "New booking: Emily Parker for Hair Color", time: "25 mins ago" },
  { id: 3, type: "review", message: "5-star review from Sarah Johnson", time: "1 hour ago" },
];

const feedbackSummary = {
  averageRating: 4.8,
  totalReviews: 156,
  recentReviews: [
    { customer: "Sarah J.", rating: 5, comment: "Amazing service! Emma did a fantastic job with my hair." },
    { customer: "Mike C.", rating: 5, comment: "Quick and professional beard trim. Highly recommend!" },
    { customer: "Lisa R.", rating: 4, comment: "Great manicure, very relaxing atmosphere." },
  ]
};

function OverviewSection() {
  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${revenueData.today}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${revenueData.week}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last week
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${revenueData.month}</div>
            <p className="text-xs text-muted-foreground">
              +15% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{appointment.time}</TableCell>
                      <TableCell>{appointment.customer}</TableCell>
                      <TableCell>{appointment.service}</TableCell>
                      <TableCell>{appointment.staff}</TableCell>
                      <TableCell>
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Edit</Button>
                          <Button size="sm" variant="outline">Cancel</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="border-b pb-3 last:border-b-0">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{notification.time}</p>
                  </div>
                ))}
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
                  <div className="text-2xl">{feedbackSummary.averageRating}</div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(feedbackSummary.averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({feedbackSummary.totalReviews} reviews)
                  </span>
                </div>
                
                <div className="space-y-3">
                  {feedbackSummary.recentReviews.map((review, index) => (
                    <div key={index} className="border-b pb-2 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{review.customer}</span>
                        <div className="flex">
                          {[...Array(review.rating)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button>Add New Appointment</Button>
            <Button variant="outline">Export Daily Report</Button>
            <Button variant="outline">Send Reminder Messages</Button>
            <Button variant="outline">View Week Calendar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ServicesSection() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Services Management</h2>
        <Button>Add New Service</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hair Cut & Styling</CardTitle>
            <Badge variant="default">Active</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Professional haircut and styling service</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">$45</span>
              <span className="text-sm text-muted-foreground">60 min</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Beard Trim</CardTitle>
            <Badge variant="default">Active</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Professional beard trimming and shaping</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">$25</span>
              <span className="text-sm text-muted-foreground">30 min</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Hair Coloring</CardTitle>
            <Badge variant="default">Active</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Professional hair coloring service</p>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold">$120</span>
              <span className="text-sm text-muted-foreground">120 min</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SalonDashboard() {
  const [activeSection, setActiveSection] = useState("overview");

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection />;
      case "services":
        return <ServicesSection />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">
                {menuItems.find(item => item.id === activeSection)?.title || "Dashboard"}
              </h2>
              <p className="text-muted-foreground">This section is coming soon!</p>
            </div>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Bella Salon</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activeSection === item.id}
                        onClick={() => setActiveSection(item.id)}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <main className="flex-1 overflow-hidden">
          <div className="flex items-center gap-4 border-b px-6 py-4">
            <SidebarTrigger />
            <h1>{menuItems.find(item => item.id === activeSection)?.title || "Overview"}</h1>
          </div>
          <div className="h-[calc(100vh-5rem)] overflow-auto p-6">
            {renderSection()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
