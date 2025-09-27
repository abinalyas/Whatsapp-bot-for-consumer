import React, { useState } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Calendar, Users, Scissors, CreditCard, MessageSquare, Settings, Home, UserCheck, Clock, DollarSign, Star, Bell, Grid3X3, List, Plus, Edit, Trash2, Info, Mail, Phone, MapPin, ChevronDown, CalendarDays, TrendingUp, Download, RefreshCw, BarChart3, PieChart, Search, Gift, Eye, Send, Megaphone, Briefcase, Upload, Save, X, XCircle } from "lucide-react";

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

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"
];

const filterOptions = {
  staffMembers: ["All Staff", "Emma Johnson", "David Rodriguez", "Anna Thompson", "Sofia Martinez"],
  services: ["All Services", "Hair Cut", "Hair Color", "Beard Trim", "Manicure", "Pedicure", "Facial Treatment"],
  status: ["All Status", "Confirmed", "Pending", "Cancelled", "Completed"]
};

const revenueData = {
  today: { amount: 850, transactions: 8 },
  week: { amount: 6900, change: "+12%", period: "from last week" },
  month: { amount: 18500, transactions: 156 },
  average: { amount: 133, period: "This week average" }
};

const revenueTrend = [
  { day: "Mon", revenue: 450 },
  { day: "Tue", revenue: 620 },
  { day: "Wed", revenue: 580 },
  { day: "Thu", revenue: 750 },
  { day: "Fri", revenue: 920 },
  { day: "Sat", revenue: 1100 },
  { day: "Sun", revenue: 480 }
];

const revenueByService = [
  { service: "Hair Cut", percentage: 35, amount: 6475, color: "bg-blue-500" },
  { service: "Hair Color", percentage: 25, amount: 4625, color: "bg-green-500" },
  { service: "Manicure", percentage: 20, amount: 3700, color: "bg-yellow-500" },
  { service: "Facial", percentage: 12, amount: 2220, color: "bg-orange-500" },
  { service: "Pedicure", percentage: 8, amount: 1480, color: "bg-purple-500" }
];

const recentTransactions = [
  { date: "12/26/2024 2:30 PM", customer: "Sarah Johnson", service: "Hair Cut & Color", staff: "Emma", amount: 125, method: "Credit Card", status: "paid" },
  { date: "12/26/2024 1:15 PM", customer: "Mike Chen", service: "Beard Trim", staff: "David", amount: 25, method: "Cash", status: "paid" },
  { date: "12/26/2024 12:00 PM", customer: "Lisa Rodriguez", service: "Manicure", staff: "Anna", amount: 35, method: "UPI", status: "pending" },
  { date: "12/25/2024 4:45 PM", customer: "John Smith", service: "Hair Wash & Style", staff: "Emma", amount: 65, method: "Credit Card", status: "paid" },
  { date: "12/25/2024 3:20 PM", customer: "Amanda White", service: "Facial Treatment", staff: "Sofia", amount: 75, method: "UPI", status: "paid" }
];

const paymentMethods = [
  { method: "Credit Card", amount: 4250, percentage: 62 },
  { method: "UPI Payments", amount: 1890, percentage: 27 },
  { method: "Cash", amount: 760, percentage: 11 }
];

const customerKPIs = {
  total: 5,
  new: 1,
  vip: 2,
  regular: 3,
  rating: 4.6,
  revenue: 4335
};

const customers = [
  {
    id: 1,
    name: "Sarah Johnson",
    initials: "SJ",
    email: "sarah.johnson@email.com",
    phone: "+1 (555) 123-4567",
    preferredStaff: "Emma",
    visits: 24,
    spent: 1850,
    lastVisit: "12/20/2024",
    rating: 5,
    tags: ["VIP", "Regular"]
  },
  {
    id: 2,
    name: "Mike Chen",
    initials: "MC",
    email: "mike.chen@email.com",
    phone: "+1 (555) 234-5678",
    preferredStaff: "David",
    visits: 12,
    spent: 420,
    lastVisit: "12/26/2024",
    rating: 5,
    tags: ["Regular"]
  },
  {
    id: 3,
    name: "Lisa Rodriguez",
    initials: "LR",
    email: "lisa.rodriguez@email.com",
    phone: "+1 (555) 345-6789",
    preferredStaff: "Anna",
    visits: 8,
    spent: 640,
    lastVisit: "12/25/2024",
    rating: 4,
    tags: ["New"]
  },
  {
    id: 4,
    name: "John Smith",
    initials: "JS",
    email: "john.smith@email.com",
    phone: "+1 (555) 456-7890",
    preferredStaff: "Emma",
    visits: 15,
    spent: 975,
    lastVisit: "12/24/2024",
    rating: 4,
    tags: ["Regular"]
  },
  {
    id: 5,
    name: "Amanda White",
    initials: "AW",
    email: "amanda.white@email.com",
    phone: "+1 (555) 567-8901",
    preferredStaff: "Sofia",
    visits: 6,
    spent: 450,
    lastVisit: "12/22/2024",
    rating: 5,
    tags: ["VIP"]
  }
];

const upcomingBirthdays = [
  { name: "John Smith", date: "2/14/2025", daysAway: 50 },
  { name: "Sarah Johnson", date: "3/15/2025", daysAway: 79 },
  { name: "Mike Chen", date: "7/22/2025", daysAway: 208 }
];

const campaignTemplates = [
  {
    id: 1,
    name: "Weekend Special",
    type: "discount",
    description: "Weekend Special! Get 20% off on all hair services this Saturday & Sunday. Book now!",
    discount: "20% discount",
    validUntil: "Valid until 12/29/2024",
    target: "All Customers"
  },
  {
    id: 2,
    name: "New Service Launch",
    type: "promotion",
    description: "Introducing our new Anti-Aging Facial! Book your session now and get 30% off. Limited time offer!",
    discount: "30% discount",
    validUntil: "Valid until 12/31/2024",
    target: "VIP Customers"
  },
  {
    id: 3,
    name: "Birthday Wishes",
    type: "birthday",
    description: "Happy Birthday (name)! Enjoy a special 25% discount on your next visit. Valid for 30 days.",
    discount: "25% discount",
    validUntil: "Birthday Customers",
    target: "Birthday Customers"
  },
  {
    id: 4,
    name: "Holiday Greetings",
    type: "greeting",
    description: "Season's Greetings from Bella Salon! Wishing you joy and beauty this holiday season.",
    discount: "All Customers",
    validUntil: "All Customers",
    target: "All Customers"
  }
];

const messageHistory = [
  {
    campaign: "Weekend Special",
    sentDate: "12/26/2024",
    recipients: 156,
    delivered: 154,
    read: 98,
    responses: 12,
    type: "WhatsApp",
    openRate: 64,
    responseRate: 12
  },
  {
    campaign: "Birthday Wishes",
    sentDate: "12/25/2024",
    recipients: 8,
    delivered: 8,
    read: 6,
    responses: 3,
    type: "SMS",
    openRate: 75,
    responseRate: 50
  },
  {
    campaign: "Holiday Greetings",
    sentDate: "12/24/2024",
    recipients: 200,
    delivered: 198,
    read: 145,
    responses: 25,
    type: "WhatsApp",
    openRate: 73,
    responseRate: 17
  }
];

const customerSegments = [
  { name: "All Customers", count: 156 },
  { name: "New Customers", count: 42 },
  { name: "VIP Customers", count: 25 },
  { name: "Birthday This Month", count: 8 },
  { name: "Regular Customers", count: 89 },
  { name: "Inactive (30+ days)", count: 18 }
];

const businessInfo = {
  name: "Bella Beauty Salon",
  website: "www.bellasalon.com",
  description: "Premium beauty and wellness services in the heart of downtown",
  address: "123 Beauty Street, Fashion District, NY 10001",
  phone: "+1 (555) 123-SALON",
  email: "info@bellasalon.com"
};

const workingHours = [
  { day: "Monday", enabled: true, start: "09:00 AM", end: "06:00 PM" },
  { day: "Tuesday", enabled: true, start: "09:00 AM", end: "06:00 PM" },
  { day: "Wednesday", enabled: true, start: "09:00 AM", end: "06:00 PM" },
  { day: "Thursday", enabled: true, start: "09:00 AM", end: "08:00 PM" },
  { day: "Friday", enabled: true, start: "09:00 AM", end: "08:00 PM" },
  { day: "Saturday", enabled: true, start: "08:00 AM", end: "05:00 PM" },
  { day: "Sunday", enabled: true, start: "10:00 AM", end: "04:00 PM" }
];

const holidays = [
  { name: "Christmas Day", date: "2024-12-25" },
  { name: "New Year's Day", date: "2024-01-01" },
  { name: "Independence Day", date: "2024-07-04" },
  { name: "Thanksgiving", date: "2024-11-28" }
];

const botSettings = {
  greetingMessage: "Hello! Welcome to Bella Beauty Salon. How can I help you today?",
  businessHoursMessage: "We're open Monday-Saturday 9AM-6PM. How can I assist you?",
  bookingConfirmationMessage: "Great! I've scheduled your appointment. You'll receive a confirmation shortly.",
  enableNotifications: true,
  autoReminders: true,
  reminderTime: 24
};

const paymentSettings = {
  acceptCash: true,
  acceptCards: true,
  acceptUPI: true,
  upiId: "bellasalon@paytm",
  bankAccount: "****1234",
  paymentGateway: "Stripe",
  enableOnlinePayments: true
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
            <div className="text-2xl">${revenueData.today.amount}</div>
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
            <div className="text-2xl">${revenueData.week.amount}</div>
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
            <div className="text-2xl">${revenueData.month.amount}</div>
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deletingService, setDeletingService] = useState(null);

  const handleAddService = () => {
    setShowAddModal(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowEditModal(true);
  };

  const handleDeleteService = (service) => {
    setDeletingService(service);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingService(null);
    setDeletingService(null);
  };

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
                <Button onClick={handleAddService}>
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
                    <Button size="sm" variant="ghost" onClick={() => handleEditService(service)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteService(service)}>
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

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g., Hair Cut"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select className="w-full p-3 border border-input rounded-md bg-background">
                  <option value="">Select category</option>
                  <option value="hair">Hair</option>
                  <option value="nails">Nails</option>
                  <option value="skincare">Skincare</option>
                  <option value="spa">Spa</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    placeholder="45"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    placeholder="60"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the service..."
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Add-ons (comma separated)</label>
                <input
                  type="text"
                  placeholder="Hair Wash, Styling, etc."
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Service Available</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <input
                  type="text"
                  defaultValue={editingService.title}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select 
                  defaultValue={editingService.category}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="hair">Hair</option>
                  <option value="nails">Nails</option>
                  <option value="skincare">Skincare</option>
                  <option value="spa">Spa</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price ($)</label>
                  <input
                    type="number"
                    defaultValue={editingService.price}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    defaultValue={editingService.duration}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  rows={3}
                  defaultValue={editingService.description}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Add-ons (comma separated)</label>
                <input
                  type="text"
                  defaultValue={editingService.addOns.join(", ")}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Service Available</div>
                </div>
                <Switch defaultChecked={editingService.isAvailable} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Service
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Service Modal */}
      {showDeleteModal && deletingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Delete Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-muted-foreground">
                Are you sure you want to delete this service? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StaffSection() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const handleAddStaff = () => {
    setShowAddModal(true);
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingStaff(null);
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Staff Management</h2>
          <p className="text-muted-foreground">Manage your team members, schedules, and availability.</p>
        </div>
        <Button onClick={handleAddStaff}>
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
              <Button size="sm" variant="ghost" onClick={() => handleEditStaff(staff)}>
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

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Staff Member</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <input
                    type="text"
                    placeholder="Hair Stylist"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@bellasalon.com"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Specialties (comma separated)</label>
                <input
                  type="text"
                  placeholder="Hair Cut, Hair Color, Styling"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Hours</label>
                <input
                  type="text"
                  placeholder="9:00 AM - 6:00 PM"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="flex gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <Button
                      key={day}
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      className="flex-1"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Currently Available</div>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Staff Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Staff Member</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={editingStaff.name}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <input
                    type="text"
                    defaultValue={editingStaff.role}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={editingStaff.email}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue={editingStaff.phone}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Specialties (comma separated)</label>
                <input
                  type="text"
                  defaultValue={editingStaff.specialties.join(", ")}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Hours</label>
                <input
                  type="text"
                  defaultValue={editingStaff.workingHours}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="flex gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <Button
                      key={day}
                      variant={editingStaff.workingDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDay(day)}
                      className="flex-1"
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Currently Available</div>
                </div>
                <Switch defaultChecked={editingStaff.isAvailable} />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Staff Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarSection() {
  const [viewMode, setViewMode] = useState("day");
  const [selectedDate, setSelectedDate] = useState("Saturday, September 27, 2025");
  const [filters, setFilters] = useState({
    staffMember: "All Staff",
    service: "All Services",
    status: "All Status"
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Appointment Calendar</h2>
          <p className="text-muted-foreground">Manage appointments and staff schedules.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("day")}
          >
            Day
          </Button>
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("week")}
          >
            Week
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("month")}
          >
            Month
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Staff Member</label>
              <div className="relative">
                <select
                  value={filters.staffMember}
                  onChange={(e) => setFilters({...filters, staffMember: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {filterOptions.staffMembers.map((member) => (
                    <option key={member} value={member}>{member}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Service</label>
              <div className="relative">
                <select
                  value={filters.service}
                  onChange={(e) => setFilters({...filters, service: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {filterOptions.services.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full p-2 border border-input rounded-md bg-background"
                >
                  {filterOptions.status.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Display */}
      <div className="text-center">
        <h3 className="text-2xl font-bold">{selectedDate}</h3>
      </div>

      {/* Calendar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Slots */}
        <Card>
          <CardHeader>
            <CardTitle>Available Slots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  className="h-10 text-sm"
                  onClick={() => {
                    // Handle slot selection
                  }}
                >
                  {time}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No appointments found for this date.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              Block Time Slot
            </Button>
            <Button variant="outline">
              Bulk Reschedule
            </Button>
            <Button variant="outline">
              Send Reminders
            </Button>
            <Button variant="outline">
              Export Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentsSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Payments & Revenue</h2>
          <p className="text-muted-foreground">Track income, transactions, and financial performance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.today.amount}</div>
            <p className="text-xs text-muted-foreground">
              {revenueData.today.transactions} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.week.amount}</div>
            <p className="text-xs text-muted-foreground">
              {revenueData.week.change} {revenueData.week.period}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.month.amount}</div>
            <p className="text-xs text-muted-foreground">
              {revenueData.month.transactions} transactions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Avg. Transaction</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${revenueData.average.amount}</div>
            <p className="text-xs text-muted-foreground">
              {revenueData.average.period}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-end h-48">
                {revenueTrend.map((item, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div 
                      className="bg-primary rounded-t-sm w-8"
                      style={{ height: `${(item.revenue / 1200) * 180}px` }}
                    ></div>
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                    <span className="text-xs font-medium">${item.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByService.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.service}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.percentage}%</div>
                    <div className="text-xs text-muted-foreground">${item.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <select className="text-sm border border-input rounded-md px-2 py-1">
              <option>All Methods</option>
              <option>Credit Card</option>
              <option>UPI</option>
              <option>Cash</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTransactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{transaction.date}</TableCell>
                  <TableCell>{transaction.customer}</TableCell>
                  <TableCell>{transaction.service}</TableCell>
                  <TableCell>{transaction.staff}</TableCell>
                  <TableCell>${transaction.amount}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "paid" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.status === "pending" && (
                        <Button size="sm" variant="outline">Mark Paid</Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Methods Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paymentMethods.map((method, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{method.method}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${method.amount.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">
                {method.percentage}% of total revenue
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              Process Refund
            </Button>
            <Button variant="outline">
              Generate Invoice
            </Button>
            <Button variant="outline">
              Send Payment Reminder
            </Button>
            <Button variant="outline">
              Export Financial Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomersSection() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Customers</h2>
          <p className="text-muted-foreground">Customer Management</p>
          <p className="text-sm text-muted-foreground">Manage customer relationships and communication.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Customer KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{customerKPIs.total}</div>
            <div className="text-sm text-muted-foreground">Total Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{customerKPIs.new}</div>
            <div className="text-sm text-muted-foreground">New Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{customerKPIs.vip}</div>
            <div className="text-sm text-muted-foreground">VIP Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{customerKPIs.regular}</div>
            <div className="text-sm text-muted-foreground">Regular Customers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{customerKPIs.rating}</div>
            <div className="text-sm text-muted-foreground">Avg. Rating</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">${customerKPIs.revenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background"
          />
        </div>
        <div className="relative">
          <select className="px-4 py-2 border border-input rounded-md bg-background">
            <option>All Customers</option>
            <option>VIP Customers</option>
            <option>Regular Customers</option>
            <option>New Customers</option>
          </select>
          <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                        {customer.initials}
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">Prefers {customer.preferredStaff}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.visits}</TableCell>
                  <TableCell>${customer.spent.toLocaleString()}</TableCell>
                  <TableCell>{customer.lastVisit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < customer.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {customer.tags.map((tag, index) => (
                        <Badge key={index} variant={tag === "VIP" ? "default" : "secondary"} className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming Birthdays */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Upcoming Birthdays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingBirthdays.map((birthday, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{birthday.name}</div>
                    <div className="text-sm text-muted-foreground">{birthday.date} - {birthday.daysAway} days away</div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Send Wishes
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PromotionsSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingCampaign(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Promotions & Messaging</h2>
          <p className="text-muted-foreground">Create and manage marketing campaigns and customer communications.</p>
        </div>
        <Button onClick={handleCreateCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaign Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaignTemplates.map((template) => (
              <Card key={template.id} className="relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEditCampaign(template)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={template.type === "discount" ? "default" : "secondary"}>
                      {template.type}
                    </Badge>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Discount:</span>
                      <span>{template.discount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Valid Until:</span>
                      <span>{template.validUntil}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Target:</span>
                      <span>{template.target}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message History */}
      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Read</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messageHistory.map((message, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{message.campaign}</TableCell>
                  <TableCell>{message.sentDate}</TableCell>
                  <TableCell>{message.recipients}</TableCell>
                  <TableCell>{message.delivered}</TableCell>
                  <TableCell>{message.read}</TableCell>
                  <TableCell>{message.responses}</TableCell>
                  <TableCell>
                    <Badge variant={message.type === "WhatsApp" ? "default" : "secondary"}>
                      {message.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Open: {message.openRate}%</div>
                      <div>Response: {message.responseRate}%</div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customerSegments.map((segment, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{segment.count}</div>
                      <div className="text-sm text-muted-foreground">{segment.name}</div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Create New Campaign</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  placeholder="Enter campaign name"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select className="w-full p-3 border border-input rounded-md bg-background">
                  <option value="promotion">Promotion</option>
                  <option value="discount">Discount</option>
                  <option value="birthday">Birthday</option>
                  <option value="greeting">Greeting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={4}
                  placeholder="Enter your message here..."
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {`{name}`} for customer name, {`{service}`} for preferred service.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    placeholder="20"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid Until</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <select className="w-full p-3 border border-input rounded-md bg-background">
                  <option value="all">All Customers (156 customers)</option>
                  <option value="vip">VIP Customers (25 customers)</option>
                  <option value="new">New Customers (42 customers)</option>
                  <option value="regular">Regular Customers (89 customers)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Date (optional)</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Time (optional)</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Campaign</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Name</label>
                <input
                  type="text"
                  defaultValue={editingCampaign.name}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select 
                  defaultValue={editingCampaign.type}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="promotion">Promotion</option>
                  <option value="discount">Discount</option>
                  <option value="birthday">Birthday</option>
                  <option value="greeting">Greeting</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  rows={4}
                  defaultValue={editingCampaign.description}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use {`{name}`} for customer name, {`{service}`} for preferred service.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Discount (%)</label>
                  <input
                    type="number"
                    defaultValue={editingCampaign.discount.replace('%', '')}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Valid Until</label>
                  <div className="relative">
                    <input
                      type="date"
                      defaultValue="2024-12-29"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Target Audience</label>
                <select 
                  defaultValue={editingCampaign.target === "All Customers" ? "all" : "vip"}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="all">All Customers (156 customers)</option>
                  <option value="vip">VIP Customers (25 customers)</option>
                  <option value="new">New Customers (42 customers)</option>
                  <option value="regular">Regular Customers (89 customers)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Date (optional)</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Time (optional)</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsSection() {
  const [activeTab, setActiveTab] = useState("business-info");

  const renderTabContent = () => {
    switch (activeTab) {
      case "business-info":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Business Name</label>
                  <input
                    type="text"
                    defaultValue={businessInfo.name}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Website</label>
                  <input
                    type="text"
                    defaultValue={businessInfo.website}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  defaultValue={businessInfo.description}
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Address</h3>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <label className="block text-sm font-medium">Address</label>
              </div>
              <input
                type="text"
                defaultValue={businessInfo.address}
                className="w-full p-3 border border-input rounded-md bg-background"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <label className="block text-sm font-medium">Phone Number</label>
                </div>
                <input
                  type="text"
                  defaultValue={businessInfo.phone}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <label className="block text-sm font-medium">Email</label>
                </div>
                <input
                  type="email"
                  defaultValue={businessInfo.email}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Business Logo</h3>
              <div className="border-2 border-dashed border-input rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">Click to upload your business logo</p>
                <Button variant="outline">
                  Choose File
                </Button>
              </div>
            </div>

            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Business Info
            </Button>
          </div>
        );

      case "working-hours":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Working Hours</h3>
              <div className="space-y-4">
                {workingHours.map((day, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="w-24 font-medium">{day.day}</div>
                    <Switch checked={day.enabled} />
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue={day.start}
                        className="p-2 border border-input rounded-md bg-background"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        defaultValue={day.end}
                        className="p-2 border border-input rounded-md bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Working Hours
            </Button>
          </div>
        );

      case "holidays":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Holiday Calendar</h3>
              <div className="flex gap-4 mb-6">
                <input
                  type="date"
                  placeholder="dd/mm/yyyy"
                  className="p-3 border border-input rounded-md bg-background"
                />
                <input
                  type="text"
                  placeholder="e.g., Christmas Day"
                  className="flex-1 p-3 border border-input rounded-md bg-background"
                />
                <Button>Add Holiday</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Upcoming Holidays</h3>
              <div className="space-y-2">
                {holidays.map((holiday, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{holiday.name}</div>
                      <div className="text-sm text-muted-foreground">{holiday.date}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "bot-settings":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Bot Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Greeting Message</label>
                  <input
                    type="text"
                    defaultValue={botSettings.greetingMessage}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Business Hours Message</label>
                  <input
                    type="text"
                    defaultValue={botSettings.businessHoursMessage}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Booking Confirmation Message</label>
                  <input
                    type="text"
                    defaultValue={botSettings.bookingConfirmationMessage}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-muted-foreground">Allow bot to send notifications to customers</div>
                  </div>
                  <Switch checked={botSettings.enableNotifications} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Auto Reminders</div>
                    <div className="text-sm text-muted-foreground">Automatically send appointment reminders</div>
                  </div>
                  <Switch checked={botSettings.autoReminders} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Reminder Time (hours before appointment)</div>
                  </div>
                  <input
                    type="number"
                    defaultValue={botSettings.reminderTime}
                    className="w-20 p-2 border border-input rounded-md bg-background text-center"
                  />
                </div>
              </div>
            </div>

            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Bot Settings
            </Button>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Payment Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Accept cash at counter</div>
                  </div>
                  <Switch checked={paymentSettings.acceptCash} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Accept credit/debit cards</div>
                  </div>
                  <Switch checked={paymentSettings.acceptCards} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Accept UPI payments</div>
                  </div>
                  <Switch checked={paymentSettings.acceptUPI} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">UPI ID</label>
                  <input
                    type="text"
                    defaultValue={paymentSettings.upiId}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bank Account (Last 4 digits)</label>
                  <input
                    type="text"
                    defaultValue={paymentSettings.bankAccount}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Gateway</label>
                  <select className="w-full p-3 border border-input rounded-md bg-background">
                    <option value="Stripe">Stripe</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Razorpay">Razorpay</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Allow customers to pay online when booking</div>
                  </div>
                  <Switch checked={paymentSettings.enableOnlinePayments} />
                </div>
              </div>
            </div>

            <Button className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Payment Settings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your salon configuration and preferences.</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <div className="flex space-x-1 border-b">
        <button
          onClick={() => setActiveTab("business-info")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "business-info"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Briefcase className="h-4 w-4 mr-2 inline" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab("working-hours")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "working-hours"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4 mr-2 inline" />
          Working Hours
        </button>
        <button
          onClick={() => setActiveTab("holidays")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "holidays"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4 mr-2 inline" />
          Holidays
        </button>
        <button
          onClick={() => setActiveTab("bot-settings")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "bot-settings"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4 mr-2 inline" />
          Bot Settings
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "payments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4 mr-2 inline" />
          Payments
        </button>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {renderTabContent()}
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
      case "calendar":
        return <CalendarSection />;
      case "payments":
        return <PaymentsSection />;
      case "customers":
        return <CustomersSection />;
      case "promotions":
        return <PromotionsSection />;
      case "settings":
        return <SettingsSection />;
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
