import React, { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Calendar, Users, Scissors, CreditCard, MessageSquare, Settings, Home, UserCheck, Clock, DollarSign, Star, Bell, Grid3X3, List, Plus, Edit, Trash2, Info, Mail, Phone, MapPin } from "lucide-react";

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

const serviceCategories = [
  { id: "all", name: "All Services" },
  { id: "hair", name: "Hair" },
  { id: "nails", name: "Nails" },
  { id: "skincare", name: "Skincare" },
  { id: "spa", name: "Spa" },
];

const services = [
  {
    id: 1,
    title: "Hair Cut",
    category: "hair",
    description: "Professional hair cutting service",
    price: 45,
    duration: 60,
    addOns: ["Hair Wash", "Styling"],
    isAvailable: true,
  },
  {
    id: 2,
    title: "Hair Color",
    category: "hair",
    description: "Full hair coloring service",
    price: 85,
    duration: 120,
    addOns: ["Deep Conditioning", "Styling"],
    isAvailable: true,
  },
  {
    id: 3,
    title: "Manicure",
    category: "nails",
    description: "Complete manicure service",
    price: 35,
    duration: 45,
    addOns: ["Nail Art", "French Tips"],
    isAvailable: true,
  },
  {
    id: 4,
    title: "Pedicure",
    category: "nails",
    description: "Relaxing pedicure service",
    price: 45,
    duration: 60,
    addOns: ["Callus Removal", "Nail Art"],
    isAvailable: true,
  },
  {
    id: 5,
    title: "Facial Treatment",
    category: "skincare",
    description: "Deep cleansing facial treatment",
    price: 75,
    duration: 90,
    addOns: ["Eye Treatment", "Neck Massage"],
    isAvailable: false,
  },
  {
    id: 6,
    title: "Beard Trim",
    category: "hair",
    description: "Professional beard trimming and shaping",
    price: 25,
    duration: 30,
    addOns: ["Beard Oil", "Hot Towel"],
    isAvailable: true,
  },
];

const staffMembers = [
  {
    id: 1,
    name: "Emma Johnson",
    role: "Senior Hair Stylist",
    initials: "EJ",
    email: "emma@bellasalon.com",
    phone: "+1 (555) 123-4567",
    workingHours: "9:00 AM - 6:00 PM",
    specialties: ["Hair Cut", "Hair Color", "Styling"],
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    rating: 4.9,
    appointments: 156,
    isAvailable: true,
  },
  {
    id: 2,
    name: "David Rodriguez",
    role: "Barber",
    initials: "DR",
    email: "david@bellasalon.com",
    phone: "+1 (555) 234-5678",
    workingHours: "10:00 AM - 7:00 PM",
    specialties: ["Hair Cut", "Beard Trim", "Shaving"],
    workingDays: ["Tue", "Wed", "Thu", "Fri", "Sat"],
    rating: 4.8,
    appointments: 89,
    isAvailable: true,
  },
  {
    id: 3,
    name: "Anna Thompson",
    role: "Nail Technician",
    initials: "AT",
    email: "anna@bellasalon.com",
    phone: "+1 (555) 345-6789",
    workingHours: "9:00 AM - 5:00 PM",
    specialties: ["Manicure", "Pedicure", "Nail Art"],
    workingDays: ["Mon", "Wed", "Thu", "Fri", "Sat"],
    rating: 4.7,
    appointments: 134,
    isAvailable: true,
  },
  {
    id: 4,
    name: "Sofia Martinez",
    role: "Esthetician",
    initials: "SM",
    email: "sofia@bellasalon.com",
    phone: "+1 (555) 456-7890",
    workingHours: "11:00 AM - 8:00 PM",
    specialties: ["Facial Treatment", "Skincare", "Eyebrow Shaping"],
    workingDays: ["Mon", "Tue", "Thu", "Fri", "Sat"],
    rating: 4.9,
    appointments: 98,
    isAvailable: false,
  },
];

const todaysStaffSchedule = [
  { time: "9:00 AM", staff: "Emma Johnson", customer: "Sarah Johnson", service: "Hair Cut" },
  { time: "10:30 AM", staff: "David Rodriguez", customer: "Mike Chen", service: "Beard Trim" },
  { time: "12:00 PM", staff: "Anna Thompson", customer: "Lisa Rodriguez", service: "Manicure" },
  { time: "2:30 PM", staff: "Emma Johnson", customer: "John Smith", service: "Hair Wash" },
  { time: "4:00 PM", staff: "Sofia Martinez", customer: "Amanda White", service: "Facial" },
];

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  const filteredServices = selectedCategory === "all" 
    ? services 
    : services.filter(service => service.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Services Management</h2>
          <p className="text-muted-foreground">Manage your salon services, pricing, and availability.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1 border-b">
        {serviceCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedCategory === category.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className={`grid gap-6 ${
        viewMode === "grid" 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-1"
      }`}>
        {filteredServices.map((service) => (
          <Card key={service.id} className="relative">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{service.description}</p>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold">${service.price}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {service.duration} mins
                </div>
              </div>

              {/* Add-ons */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Add-ons:</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {service.addOns.map((addOn, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {addOn}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant={service.isAvailable ? "default" : "destructive"}
                    size="sm"
                    className="text-xs"
                  >
                    {service.isAvailable ? "Available" : "Unavailable"}
                  </Button>
                </div>
                <Switch
                  checked={service.isAvailable}
                  onCheckedChange={() => {
                    // Handle availability toggle
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services Summary & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Services Summary & Analytics
            <Button variant="ghost" size="sm">
              <Info className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{services.length}</div>
              <div className="text-sm text-muted-foreground">Total Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{services.filter(s => s.isAvailable).length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${services.reduce((sum, s) => sum + s.price, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">Manage your team members, schedules, and availability.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Staff Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {staffMembers.map((staff) => (
          <Card key={staff.id} className="relative">
            {/* Edit Button */}
            <div className="absolute top-4 right-4">
              <Button size="sm" variant="ghost">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {staff.initials}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{staff.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{staff.role}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{staff.workingHours}</span>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Specialties:</span>
                <div className="flex flex-wrap gap-1">
                  {staff.specialties.map((specialty, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Working Days:</span>
                <div className="flex gap-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div
                      key={day}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        staff.workingDays.includes(day)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating and Appointments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(staff.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{staff.rating}</span>
                  <span className="text-xs text-muted-foreground">({staff.appointments} appointments)</span>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant={staff.isAvailable ? "default" : "destructive"}
                  size="sm"
                  className="text-xs"
                >
                  {staff.isAvailable ? "Available" : "Unavailable"}
                </Button>
                <Switch
                  checked={staff.isAvailable}
                  onCheckedChange={() => {
                    // Handle availability toggle
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Staff Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Staff Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todaysStaffSchedule.map((appointment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{appointment.time}</TableCell>
                  <TableCell>{appointment.staff}</TableCell>
                  <TableCell>{appointment.customer}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Reassign
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
      case "staff":
        return <StaffSection />;
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
