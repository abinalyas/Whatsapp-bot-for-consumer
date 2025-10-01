import React, { useState, useEffect } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Header } from "@/components/header";
import { Calendar, Users, Scissors, CreditCard, MessageSquare, Settings, Home, UserCheck, Clock, DollarSign, Star, Bell, Grid3X3, List, Plus, Edit, Trash2, Info, Mail, Phone, MapPin, ChevronDown, CalendarDays, TrendingUp, Download, RefreshCw, BarChart3, PieChart, Search, Gift, Eye, Send, Megaphone, Briefcase, Upload, Save, X, XCircle, AlertTriangle, Zap } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { salonApi } from "@/lib/salon-api";
import { staffApi } from "@/lib/staff-api";
import { AvailabilityManager } from "@/components/availability-manager";
import { TimeSlotSelector } from "@/components/time-slot-selector";
import { StaffScheduler } from "@/components/staff-scheduler";
import { 
  transformApiServicesToUI, 
  transformApiBookingsToUI,
  transformUIServiceToAPI,
  transformUIBookingToAPI,
  type ApiService,
  type ApiBooking,
  type UIService,
  type UIBooking,
  formatCurrency,
  formatTime,
  formatDate,
  formatIndianPhoneNumber,
  validateIndianPhoneNumber
} from "@/lib/data-transformers";

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
  { id: 1, time: "9:00 AM", customer: "Priya Sharma", service: "Hair Cut & Color", staff: "Emma", status: "confirmed" },
  { id: 2, time: "10:30 AM", customer: "Rajesh Kumar", service: "Beard Trim", staff: "David", status: "confirmed" },
  { id: 3, time: "12:00 PM", customer: "Sunita Patel", service: "Manicure", staff: "Anna", status: "pending" },
  { id: 4, time: "2:30 PM", customer: "Amit Singh", service: "Hair Wash & Style", staff: "Emma", status: "confirmed" },
  { id: 5, time: "4:00 PM", customer: "Kavita Reddy", service: "Facial Treatment", staff: "Sofia", status: "confirmed" },
];


const notifications = [
  { id: 1, type: "cancellation", message: "Arjun Gupta cancelled 3:00 PM appointment", time: "10 mins ago" },
  { id: 2, type: "booking", message: "New booking: Deepika Sharma for Hair Color", time: "25 mins ago" },
  { id: 3, type: "review", message: "5-star review from Priya Sharma", time: "1 hour ago" },
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

// Staff members will be loaded from API dynamically

// todaysStaffSchedule is now loaded dynamically from API

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
  "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"
];

// Filter options will be populated dynamically from API data
const getFilterOptions = (staff: any[], services: any[]) => ({
  staffMembers: ["All Staff", ...staff.map(s => s.name)],
  services: ["All Services", ...services.map(s => s.name)],
  status: ["All Status", "Confirmed", "Pending", "Cancelled", "Completed"]
});

// Helper function to format currency with commas
const formatCurrencyWithCommas = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('₹', '₹');
};

// Helper function to calculate revenue from appointments
const calculateRevenueFromAppointments = (appointments: any[], period: 'today' | 'week' | 'month' | 'year') => {
  if (!appointments || appointments.length === 0) return 0;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let filteredAppointments = appointments;
  
  switch (period) {
    case 'today':
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= today && aptDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
      break;
    case 'week':
      const weekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= weekStart && aptDate < today;
      });
      break;
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= monthStart && aptDate < today;
      });
      break;
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1);
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_at);
        return aptDate >= yearStart && aptDate < today;
      });
      break;
  }
  
  return filteredAppointments.reduce((total, apt) => {
    const amount = parseFloat(apt.amount) || 0;
    return total + amount;
  }, 0);
};

const revenueTrend = [
  { day: "Mon", revenue: 33750 }, // ₹33,750 (450 * 75)
  { day: "Tue", revenue: 46500 }, // ₹46,500 (620 * 75)
  { day: "Wed", revenue: 43500 }, // ₹43,500 (580 * 75)
  { day: "Thu", revenue: 56250 }, // ₹56,250 (750 * 75)
  { day: "Fri", revenue: 69000 }, // ₹69,000 (920 * 75)
  { day: "Sat", revenue: 82500 }, // ₹82,500 (1100 * 75)
  { day: "Sun", revenue: 36000 }  // ₹36,000 (480 * 75)
];

const revenueByService = [
  { service: "Hair Cut", percentage: 35, amount: 485625, color: "bg-blue-500" }, // ₹4,85,625 (6475 * 75)
  { service: "Hair Color", percentage: 25, amount: 346875, color: "bg-green-500" }, // ₹3,46,875 (4625 * 75)
  { service: "Manicure", percentage: 20, amount: 277500, color: "bg-yellow-500" }, // ₹2,77,500 (3700 * 75)
  { service: "Facial", percentage: 12, amount: 166500, color: "bg-orange-500" }, // ₹1,66,500 (2220 * 75)
  { service: "Pedicure", percentage: 8, amount: 111000, color: "bg-purple-500" } // ₹1,11,000 (1480 * 75)
];

const recentTransactions = [
  { date: "26/12/2024 2:30 PM", customer: "Priya Sharma", service: "Hair Cut & Color", staff: "Emma", amount: 1500, method: "UPI", status: "paid" },
  { date: "26/12/2024 1:15 PM", customer: "Rajesh Kumar", service: "Beard Trim", staff: "David", amount: 300, method: "Cash", status: "paid" },
  { date: "26/12/2024 12:00 PM", customer: "Sunita Patel", service: "Manicure", staff: "Anna", amount: 300, method: "Paytm", status: "pending" },
  { date: "25/12/2024 4:45 PM", customer: "Amit Singh", service: "Hair Wash & Style", staff: "Emma", amount: 500, method: "PhonePe", status: "paid" },
  { date: "25/12/2024 3:20 PM", customer: "Kavita Reddy", service: "Facial Treatment", staff: "Sofia", amount: 800, method: "UPI", status: "paid" }
];

const paymentMethods = [
  { method: "UPI Payments", amount: 42500, percentage: 65 },
  { method: "Credit Card", amount: 18900, percentage: 29 },
  { method: "Cash", amount: 3800, percentage: 6 }
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
    name: "Priya Sharma",
    initials: "PS",
    email: "priya.sharma@email.com",
    phone: "+91 98765 43210",
    preferredStaff: "Emma",
    visits: 24,
    spent: 18500,
    lastVisit: "12/20/2024",
    rating: 5,
    tags: ["VIP", "Regular"]
  },
  {
    id: 2,
    name: "Rajesh Kumar",
    initials: "RK",
    email: "rajesh.kumar@email.com",
    phone: "+91 87654 32109",
    preferredStaff: "David",
    visits: 12,
    spent: 4200,
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
  upiId: "salon@paytm",
  bankAccount: "****1234",
  paymentGateway: "Stripe",
  enableOnlinePayments: true
};

function OverviewSection({ 
  onEditAppointment, 
  onCancelAppointment,
  onOpenQuickBook,
  onOpenCheckIn,
  onOpenProcessPayment,
  onOpenSendReminders,
  onOpenViewSchedule,
  onOpenWalkIn,
  onOpenDailySummary
}) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]); // Store all appointments for revenue calculation
  const [stats, setStats] = useState({ todayAppointments: 0, todayRevenue: 0, totalServices: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load appointments and stats from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get all appointments for revenue calculation (not just today's)
        const [todayAppointmentsData, allAppointmentsData, statsData, staffData] = await Promise.all([
          salonApi.appointments.getAll({ date: new Date().toISOString().split('T')[0] }),
          salonApi.appointments.getAll(), // Get all appointments for revenue calculation
          salonApi.stats.getStats(),
          staffApi.getAll()
        ]);
        
        // Transform appointments data to include staff names
        const transformedTodayAppointments = todayAppointmentsData.map(apt => {
          const staffName = staffData.find(s => s.id === apt.staff_id)?.name || 'Unassigned';
          return {
            ...apt,
            staff_name: staffName
          };
        });
        
        const transformedAllAppointments = allAppointmentsData.map(apt => {
          const staffName = staffData.find(s => s.id === apt.staff_id)?.name || 'Unassigned';
          return {
            ...apt,
            staff_name: staffName
          };
        });
        
        setAppointments(transformedTodayAppointments);
        setAllAppointments(transformedAllAppointments);
        
        // Calculate real stats from data
        const todayRevenue = calculateRevenueFromAppointments(transformedAllAppointments, 'today');
        const realStats = {
          todayAppointments: transformedTodayAppointments.length,
          todayRevenue: todayRevenue,
          totalServices: statsData?.totalServices || 0
        };
        
        setStats(realStats);
        setError(null);
      } catch (err) {
        console.error('Error loading overview data:', err);
        setError('Failed to load overview data');
        // Fallback to mock data
        setAppointments(todaysAppointments);
        setAllAppointments(todaysAppointments); // Fallback for revenue calculation
        setStats({ todayAppointments: 5, todayRevenue: 450, totalServices: 8 });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Removed duplicate - using the one in CalendarSection

  const handleCancelAppointment = (appointment) => {
    setCancellingAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCloseModals = () => {
    setShowEditModal(false);
    setShowCancelModal(false);
    setEditingAppointment(null);
    setCancellingAppointment(null);
  };

  return (
    <div className="space-y-6">
      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'today'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From today's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'week'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this week's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'month'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this month's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Year</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'year'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this year's appointments
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
                  {(appointments || []).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</TableCell>
                      <TableCell>{appointment.customer_name}</TableCell>
                      <TableCell>{appointment.service_name}</TableCell>
                      <TableCell>{appointment.staff_name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant={appointment.payment_status === "paid" ? "default" : "secondary"}>
                          {appointment.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => onEditAppointment(appointment)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => onCancelAppointment(appointment)}>Cancel</Button>
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
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Quick Book - Primary action */}
            <Button 
              onClick={onOpenQuickBook}
              className="bg-black text-white hover:bg-gray-800 flex items-center gap-2 px-4 py-3 rounded-lg"
            >
              <Plus className="h-4 w-4" />
              Quick Book
            </Button>
            
            {/* Check In */}
            <Button 
              variant="outline" 
              onClick={onOpenCheckIn}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <Users className="h-4 w-4" />
              Check In
            </Button>
            
            {/* Process Payment */}
            <Button 
              variant="outline" 
              onClick={onOpenProcessPayment}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <CreditCard className="h-4 w-4" />
              Process Payment
            </Button>
            
            {/* Send Reminders */}
            <Button 
              variant="outline" 
              onClick={onOpenSendReminders}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <MessageSquare className="h-4 w-4" />
              Send Reminders
            </Button>
            
            {/* View Schedule */}
            <Button 
              variant="outline" 
              onClick={onOpenViewSchedule}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <Calendar className="h-4 w-4" />
              View Schedule
            </Button>
            
            {/* Walk-in */}
            <Button 
              variant="outline" 
              onClick={onOpenWalkIn}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <Users className="h-4 w-4" />
              Walk-in
            </Button>
            
            {/* Daily Summary */}
            <Button 
              variant="outline" 
              onClick={onOpenDailySummary}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border"
            >
              <Star className="h-4 w-4" />
              Daily Summary
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Appointment Modal */}
      {showEditModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Appointment</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  defaultValue={editingAppointment.customer || ''}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <div className="relative">
                  <select className="w-full p-3 border border-input rounded-md bg-background pr-10">
                    <option value="hair-cut-color">Hair Cut & Color (120 mins)</option>
                    <option value="beard-trim">Beard Trim (30 mins)</option>
                    <option value="manicure">Manicure (45 mins)</option>
                    <option value="hair-wash-style">Hair Wash & Style (60 mins)</option>
                    <option value="facial">Facial Treatment (90 mins)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Staff Member</label>
                <div className="relative">
                  <select className="w-full p-3 border border-input rounded-md bg-background pr-10">
                    <option value="emma">Emma</option>
                    <option value="david">David</option>
                    <option value="anna">Anna</option>
                    <option value="sofia">Sofia</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time</label>
                <div className="relative">
                  <input
                    type="time"
                    defaultValue={editingAppointment.time ? editingAppointment.time.replace(" AM", "").replace(" PM", "") : ""}
                    className="w-full p-3 border border-input rounded-md bg-background pr-10"
                  />
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any special requirements or notes"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Cancel Appointment
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel the appointment for <strong>{cancellingAppointment.customer_name || cancellingAppointment.customer} at {cancellingAppointment.appointment_time || cancellingAppointment.time}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The customer will be notified about the cancellation.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModals} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {
                  onCancelAppointment(cancellingAppointment);
                  handleCloseModals();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      )}
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
  const [services, setServices] = useState<UIService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formValid, setFormValid] = useState(false);

  // Toggle service availability
  const toggleServiceAvailability = async (serviceId: string, currentStatus: boolean) => {
    try {
      setSaving(true);
      console.log(`Toggling service ${serviceId} from ${currentStatus} to ${!currentStatus}`);
      
      const response = await fetch(`/api/salon/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      console.log(`Toggle response status: ${response.status}`);
      
      if (response.ok) {
        const updatedService = await response.json();
        console.log('Updated service:', updatedService);
        
        // Update the service in the local state
        setServices(prevServices => 
          prevServices.map(service => 
            service.id === serviceId 
              ? { ...service, is_active: !currentStatus }
              : service
          )
        );
        console.log(`Successfully toggled service ${serviceId}`);
      } else {
        const errorText = await response.text();
        console.error('Failed to update service availability:', response.status, errorText);
        setError(`Failed to update service availability: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating service availability:', error);
      setError(`Error updating service availability: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Load services from API
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        console.log('Loading services from API...');
        
        // Load real services from API
        try {
          console.log('🔍 Loading services from API...');
          console.log('🔍 Current window location:', window.location.href);
          
          const response = await fetch('/api/salon/services', {
            headers: {
              'x-tenant-id': 'bella-salon'
            }
          });
          console.log('🔍 API Response status:', response.status);
          console.log('🔍 API Response URL:', response.url);
          
          if (!response.ok) {
            throw new Error('Failed to load services from API');
          }
          
          const apiResponse = await response.json();
          const apiServices: ApiService[] = apiResponse.data || apiResponse;
          console.log('Loaded services from API:', apiServices);
          console.log('🔍 API Services count:', apiServices.length);
          console.log('🔍 First service ID:', apiServices[0]?.id);
          console.log('🔍 First service name:', apiServices[0]?.name);
          
          // Transform API services to UI format using utility
          const transformedServices = transformApiServicesToUI(apiServices);
          
          setServices(transformedServices);
          setError(null);
          console.log('Using real API services data:', transformedServices);
          
        } catch (apiError) {
          console.log('API call failed, using fallback mock data:', apiError);
          
          // Fallback to mock data if API fails
        const mockServices = [
          { 
            id: 1, 
            name: "Hair Cut & Style", 
            category: "Hair", 
              base_price: 500, 
              currency: "INR", 
            duration_minutes: 60, 
            is_active: true,
            addOns: ["Blow Dry", "Styling"]
          },
          { 
            id: 2, 
            name: "Hair Color", 
            category: "Hair", 
              base_price: 1500, 
              currency: "INR", 
            duration_minutes: 120, 
            is_active: true,
            addOns: ["Color Treatment", "Conditioning"]
          },
          { 
            id: 3, 
            name: "Manicure", 
            category: "Nails", 
              base_price: 300, 
              currency: "INR", 
            duration_minutes: 45, 
            is_active: true,
            addOns: ["Nail Art", "Gel Polish"]
          },
          { 
            id: 4, 
            name: "Pedicure", 
            category: "Nails", 
              base_price: 400, 
              currency: "INR", 
            duration_minutes: 60, 
            is_active: true,
            addOns: ["Foot Massage", "Callus Treatment"]
          },
          { 
            id: 5, 
            name: "Facial Treatment", 
            category: "Skincare", 
              base_price: 800, 
              currency: "INR", 
            duration_minutes: 90, 
            is_active: true,
            addOns: ["Deep Cleansing", "Moisturizing"]
          },
        ];
        
        setServices(mockServices);
          console.log('Using fallback mock services data:', mockServices);
        }
        
      } catch (err) {
        console.error('Error loading services:', err);
        setError('Failed to load services');
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const handleShowAddService = () => {
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

  const handleEditServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const formData = new FormData(e.target);
      const serviceData = {
        name: formData.get('name'),
        description: formData.get('description'),
        category: formData.get('category'),
        subcategory: editingService.subcategory || null, // Preserve existing subcategory
        base_price: parseFloat(formData.get('base_price') || '0'),
        currency: 'INR', // Default currency for India
        duration_minutes: parseInt(formData.get('duration_minutes') || '60'),
        is_active: formData.get('is_active') === 'true', // Read from form
        display_order: editingService.display_order || 1, // Preserve existing display order
        tags: editingService.tags || [], // Preserve existing tags
        images: editingService.images || [], // Preserve existing images
        offering_type: 'service', // Required field
        pricing_type: 'fixed', // Required field
        is_schedulable: editingService.is_schedulable !== undefined ? editingService.is_schedulable : true, // Preserve existing schedulable status
        pricing_config: editingService.pricing_config || {}, // Preserve existing pricing config
        availability_config: editingService.availability_config || {}, // Preserve existing availability config
        has_variants: editingService.has_variants || false, // Preserve existing variants status
        variants: editingService.variants || [], // Preserve existing variants
        custom_fields: editingService.custom_fields || {}, // Preserve existing custom fields
        metadata: editingService.metadata || {} // Preserve existing metadata
      };
      
      await salonApi.services.update(editingService.id, serviceData);
      setServices(services.map(s => s.id === editingService.id ? { ...s, ...serviceData } : s));
      setShowEditModal(false);
      setEditingService(null);
    } catch (err) {
      console.error('Error updating service:', err);
      setError('Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveService = async (serviceData) => {
    try {
      if (editingService) {
        // Update existing service - ensure all required fields are included
        const completeServiceData = {
          ...serviceData,
          subcategory: editingService.subcategory || null,
          display_order: editingService.display_order || 1,
          tags: editingService.tags || [],
          images: editingService.images || [],
          offering_type: 'service',
          pricing_type: 'fixed',
          is_schedulable: editingService.is_schedulable !== undefined ? editingService.is_schedulable : true,
          pricing_config: editingService.pricing_config || {},
          availability_config: editingService.availability_config || {},
          has_variants: editingService.has_variants || false,
          variants: editingService.variants || [],
          custom_fields: editingService.custom_fields || {},
          metadata: editingService.metadata || {}
        };
        await salonApi.services.update(editingService.id, completeServiceData);
        setServices(services.map(s => s.id === editingService.id ? { ...s, ...completeServiceData } : s));
      } else {
        // Create new service - ensure all required fields are included
        const completeServiceData = {
          ...serviceData,
          offering_type: 'service',
          pricing_type: 'fixed',
          is_schedulable: true,
          display_order: 1,
          tags: [],
          images: [],
          pricing_config: {},
          availability_config: {},
          has_variants: false,
          variants: [],
          custom_fields: {},
          metadata: {}
        };
        const newService = await salonApi.services.create(completeServiceData);
        setServices([...services, newService]);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingService(null);
    } catch (err) {
      console.error('Error saving service:', err);
      setError('Failed to save service');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await salonApi.services.delete(deletingService.id);
      setServices(services.filter(s => s.id !== deletingService.id));
      setShowDeleteModal(false);
      setDeletingService(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service');
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setEditingService(null);
    setDeletingService(null);
  };

  const handleAddService = async (formData) => {
    try {
      setSaving(true);
      
      // Transform UI form data to API format
      const apiServiceData = transformUIServiceToAPI(formData);
      
      const newApiService = await salonApi.services.create(apiServiceData);
      console.log('New service created:', newApiService);
      
      // Transform API response back to UI format
      const newUIService = transformApiServicesToUI([newApiService])[0];
      
      setServices(prev => [...prev, newUIService]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding service:', err);
      setError('Failed to add service');
    } finally {
      setSaving(false);
    }
  };

  const filteredServices = selectedCategory === "all" 
    ? (services || [])
    : (services || []).filter(service => service.category === selectedCategory);

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Services Management</h2>
            <p className="text-muted-foreground">Manage your salon services, pricing, and availability.</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

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
                <Button onClick={handleShowAddService}>
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
        {(filteredServices || []).map((service) => (
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
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {(service.category || 'Service').charAt(0).toUpperCase() + (service.category || 'Service').slice(1)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{service.description}</p>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-2xl font-bold">₹{service.base_price}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {service.duration_minutes} mins
                </div>
              </div>

              {/* Add-ons */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Add-ons:</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex flex-wrap gap-1">
                  {(service.addOns || []).map((addOn, index) => (
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
                    variant={service.is_active ? "default" : "destructive"}
                    size="sm"
                    className="text-xs"
                  >
                    {service.is_active ? "Available" : "Unavailable"}
                  </Button>
                </div>
                <Switch
                  checked={service.is_active}
                  onCheckedChange={() => toggleServiceAvailability(service.id, service.is_active)}
                  disabled={saving}
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
              <div className="text-2xl font-bold">{services.filter(s => s.is_active).length}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">₹{services.reduce((sum, s) => sum + (s.base_price || 0), 0)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const serviceData = {
                name: formData.get('name'),
                category: formData.get('category'),
                base_price: parseFloat(formData.get('base_price') || '0'),
                currency: 'INR', // Default currency for India
                duration_minutes: parseInt(formData.get('duration') || '60'),
                description: formData.get('description'),
                is_active: formData.get('is_active') === 'on',
                display_order: 0, // Default display order
                tags: [], // Default empty tags
                images: [], // Default empty images
                addOns: []
              };
              await handleAddService(serviceData);
            }} className="space-y-4" id="service-form" onChange={(e) => {
              const form = e.currentTarget;
              const formData = new FormData(form);
              const name = formData.get('name')?.toString().trim();
              const category = formData.get('category')?.toString();
              const basePrice = formData.get('base_price')?.toString();
              const duration = formData.get('duration')?.toString();
              
              const isValid = name && name.length > 0 && 
                            category && category !== '' && 
                            basePrice && parseFloat(basePrice) > 0 && 
                            duration && parseInt(duration) > 0;
              
              // Debug logging for form validation
              console.log('🔍 Form validation:', {
                name: name,
                category: category,
                basePrice: basePrice,
                duration: duration,
                isValid: isValid
              });
              
              setFormValid(!!isValid);
            }}>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g., Hair Cut"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  required
                  minLength={1}
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">Required field</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select name="category" className="w-full p-3 border border-input rounded-md bg-background" required>
                  <option value="">Select category</option>
                  <option value="hair">Hair</option>
                  <option value="nails">Nails</option>
                  <option value="skincare">Skincare</option>
                  <option value="spa">Spa</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Required field</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="base_price"
                    type="number"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    placeholder="45.00"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field (0.01 - 999999.99)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="duration"
                    type="number"
                    min="1"
                    max="1440"
                    placeholder="60"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field (1-1440 minutes)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe the service..."
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Service Available</div>
                </div>
                <Switch name="is_active" defaultChecked />
              </div>
              
              {!formValid && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  ⚠️ Please fill in all required fields to enable the save button
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModals}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !formValid}>
                  {saving ? 'Saving...' : 'Save Service'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Service</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={handleEditServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingService.name}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select 
                  name="category"
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
                  <label className="block text-sm font-medium mb-2">Price (₹)</label>
                  <input
                    type="number"
                    name="base_price"
                    defaultValue={editingService.base_price}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    defaultValue={editingService.duration_minutes}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingService.description}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Add-ons (comma separated)</label>
                <input
                  type="text"
                  name="addOns"
                  defaultValue={(editingService.addOns || []).join(", ")}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Service Available</div>
                </div>
                <Switch 
                  defaultChecked={editingService.is_active} 
                  name="is_active"
                  value={editingService.is_active ? "true" : "false"}
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModals}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Service'}
                </Button>
              </div>
            </form>
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

function StaffSection({ 
  todaysAppointments, 
  setTodaysAppointments, 
  scheduleLoading, 
  loadTodaysAppointments 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedDays, setSelectedDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [selectedStaffForAvailability, setSelectedStaffForAvailability] = useState(null);
  const [showStaffScheduler, setShowStaffScheduler] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassigningAppointment, setReassigningAppointment] = useState<any>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [notifyCustomer, setNotifyCustomer] = useState(false);

  // Load staff from API
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setLoading(true);
        
        // Always use mock data for now to avoid API issues
        const mockStaff = [
          { 
            id: 1, 
            name: "Emma Wilson", 
            role: "stylist", 
            specializations: ["Hair", "Color"], 
            is_active: true, 
            total_appointments: 45, 
            upcoming_appointments: 3,
            email: "emma@salon.com",
            phone: "+1-555-0101",
            working_hours: "9:00 AM - 6:00 PM"
          },
          { 
            id: 2, 
            name: "David Chen", 
            role: "stylist", 
            specializations: ["Hair", "Beard"], 
            is_active: true, 
            total_appointments: 38, 
            upcoming_appointments: 2,
            email: "david@salon.com",
            phone: "+1-555-0102",
            working_hours: "10:00 AM - 7:00 PM"
          },
          { 
            id: 3, 
            name: "Anna Rodriguez", 
            role: "stylist", 
            specializations: ["Nails", "Manicure"], 
            is_active: true, 
            total_appointments: 52, 
            upcoming_appointments: 4,
            email: "anna@salon.com",
            phone: "+1-555-0103",
            working_hours: "8:00 AM - 5:00 PM"
          },
          { 
            id: 4, 
            name: "Sofia Martinez", 
            role: "stylist", 
            specializations: ["Skincare", "Facial"], 
            is_active: true, 
            total_appointments: 29, 
            upcoming_appointments: 1,
            email: "sofia@salon.com",
            phone: "+1-555-0104",
            working_hours: "9:00 AM - 6:00 PM"
          },
          { 
            id: 5, 
            name: "Alex Manager", 
            role: "manager", 
            specializations: ["Management"], 
            is_active: true, 
            total_appointments: 0, 
            upcoming_appointments: 0,
            email: "alex@salon.com",
            phone: "+1-555-0105",
            working_hours: "8:00 AM - 5:00 PM"
          },
        ];
        
        setStaff(mockStaff);
        setError(null);
        console.log('Using mock staff data:', mockStaff);
        
        // Try API call in background for future use
        try {
          const data = await staffApi.getAll();
          console.log('Staff API response:', data);
          if (Array.isArray(data) && data.length > 0) {
            setStaff(data);
            console.log('Switched to API staff data');
          }
        } catch (apiErr) {
          console.log('Staff API call failed, using mock data:', apiErr);
        }
        
      } catch (err) {
        console.error('Error loading staff:', err);
        setError('Failed to load staff');
        setStaff([]);
      } finally {
        setLoading(false);
      }
    };

    loadStaff();
    loadTodaysAppointments();
  }, []);

  const handleShowAddStaff = () => {
    setShowAddModal(true);
  };

  const handleReassignAppointment = (appointment) => {
    console.log('Opening reassign modal for appointment:', appointment);
    setReassigningAppointment(appointment);
    setSelectedStaffId('');
    setNotifyCustomer(false);
    setShowReassignModal(true);
  };

  const handleConfirmReassignment = async () => {
    if (!reassigningAppointment || !selectedStaffId) {
      alert('Please select a staff member to reassign to.');
      return;
    }

    try {
      console.log('Confirming reassignment:', {
        appointmentId: reassigningAppointment.id,
        newStaffId: selectedStaffId,
        notifyCustomer: notifyCustomer
      });

      const response = await fetch(`/api/salon/appointments/${reassigningAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({
          staff_id: selectedStaffId
        })
      });

      if (response.ok) {
        console.log('Appointment reassigned successfully');
        
        // Show success message
        if (notifyCustomer) {
          alert('Appointment reassigned successfully and customer has been notified.');
        } else {
          alert('Appointment reassigned successfully.');
        }
        
        // Close modal and reload data
        setShowReassignModal(false);
        setReassigningAppointment(null);
        setSelectedStaffId('');
        setNotifyCustomer(false);
        
        // Reload today's appointments to show the updated schedule
        loadTodaysAppointments();
      } else {
        console.error('Failed to reassign appointment:', response.statusText);
        alert('Failed to reassign appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error reassigning appointment:', error);
      alert('Error reassigning appointment. Please try again.');
    }
  };

  const handleCloseReassignModal = () => {
    setShowReassignModal(false);
    setReassigningAppointment(null);
    setSelectedStaffId('');
    setNotifyCustomer(false);
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setShowEditModal(true);
  };

  const handleSaveStaff = async (staffData) => {
    try {
      if (editingStaff) {
        // Update existing staff
        await staffApi.update(editingStaff.id, staffData);
        setStaff(staff.map(s => s.id === editingStaff.id ? { ...s, ...staffData } : s));
      } else {
        // Create new staff
        const newStaff = await staffApi.create(staffData);
        setStaff([...staff, newStaff]);
      }
      setShowAddModal(false);
      setShowEditModal(false);
      setEditingStaff(null);
    } catch (err) {
      console.error('Error saving staff:', err);
      setError('Failed to save staff member');
    }
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingStaff(null);
  };

  const handleAddStaff = async (formData) => {
    try {
      setSaving(true);
      const newStaff = await staffApi.create(formData);
      console.log('New staff created:', newStaff);
      setStaff(prev => [...prev, newStaff]);
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding staff:', err);
      setError('Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAvailability = (staffMember) => {
    setSelectedStaffForAvailability(staffMember);
    setShowAvailabilityManager(true);
  };

  const handleCloseAvailabilityManager = () => {
    setShowAvailabilityManager(false);
    setSelectedStaffForAvailability(null);
  };

  const handleShowScheduler = () => {
    setShowStaffScheduler(true);
  };

  const handleCloseScheduler = () => {
    setShowStaffScheduler(false);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShowScheduler}>
            <Calendar className="h-4 w-4 mr-2" />
            View Schedule
          </Button>
          <Button onClick={handleShowAddStaff}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Staff Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(staff || []).map((staffMember) => (
          <Card key={staffMember.id} className="relative">
            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => handleEditStaff(staffMember)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => handleEditAvailability(staffMember)}
                title="Edit Availability"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  {staffMember.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{staffMember.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">{staffMember.role}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{staffMember.email || 'No email'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{staffMember.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {staffMember.working_hours?.from && staffMember.working_hours?.to 
                      ? `${staffMember.working_hours.from} - ${staffMember.working_hours.to}`
                      : 'Standard hours'
                    }
                  </span>
                </div>
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <span className="text-sm font-medium">Specialties:</span>
                <div className="flex flex-wrap gap-1">
                  {(staffMember.specializations || []).map((specialty, index) => (
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
                        (staffMember.working_days || []).includes(day)
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
                          i < 4
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">4.8</span>
                  <span className="text-xs text-muted-foreground">({staffMember.total_appointments || 0} appointments)</span>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button
                  variant={staffMember.is_active ? "default" : "destructive"}
                  size="sm"
                  className="text-xs"
                >
                  {staffMember.is_active ? "Available" : "Unavailable"}
                </Button>
                <Switch
                  checked={staffMember.is_active}
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
              {scheduleLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading today's schedule...
                    </div>
                  </TableCell>
                </TableRow>
              ) : todaysAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No appointments scheduled for today
                  </TableCell>
                </TableRow>
              ) : (
                todaysAppointments.map((appointment, index) => (
                  <TableRow key={appointment.id || index}>
                    <TableCell className="font-medium">
                      {appointment.time || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {appointment.staff_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {appointment.customer_name || appointment.customer_phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {appointment.service_name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleReassignAppointment(appointment)}
                      >
                        Reassign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Staff Member</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const staffData = {
                name: formData.get('name'),
                role: formData.get('role'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                specializations: formData.get('specializations')?.split(',').map(s => s.trim()).filter(Boolean) || [],
                working_hours: {
                  from: formData.get('working_hours_from') || '09:00',
                  to: formData.get('working_hours_to') || '17:00'
                },
                working_days: selectedDays,
                is_active: formData.get('is_active') === 'on'
              };
              await handleAddStaff(staffData);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                    minLength={1}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="role"
                    type="text"
                    placeholder="Hair Stylist"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                    minLength={1}
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="john@bellasalon.com"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field (valid email format)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full p-3 border border-input rounded-md bg-background"
                    required
                    pattern="[+]?[0-9\s\-\(\)]{10,20}"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required field (10-20 digits)</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Specialties (comma separated)</label>
                <input
                  name="specializations"
                  type="text"
                  placeholder="Hair Cut, Hair Color, Styling"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Hours</label>
                <div className="flex gap-2 items-center">
                  <input
                    name="working_hours_from"
                    type="time"
                    defaultValue="09:00"
                    className="flex-1 p-3 border border-input rounded-md bg-background"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    name="working_hours_to"
                    type="time"
                    defaultValue="17:00"
                    className="flex-1 p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="flex gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={selectedDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedDays.includes(day)) {
                          setSelectedDays(selectedDays.filter(d => d !== day));
                        } else {
                          setSelectedDays([...selectedDays, day]);
                        }
                      }}
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
                <Switch name="is_active" defaultChecked />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModals}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Staff Member</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const staffData = {
                name: formData.get('name'),
                role: formData.get('role'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                specializations: formData.get('specializations')?.split(',').map(s => s.trim()).filter(Boolean) || [],
                working_hours: {
                  from: formData.get('working_hours_from') || '09:00',
                  to: formData.get('working_hours_to') || '17:00'
                },
                working_days: editingStaff.working_days || [],
                is_active: formData.get('is_active') === 'on'
              };
              await handleSaveStaff(staffData);
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={editingStaff.name}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Role</label>
                  <input
                    name="role"
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
                    name="email"
                    type="email"
                    defaultValue={editingStaff.email}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingStaff.phone}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Specialties (comma separated)</label>
                <input
                  name="specializations"
                  type="text"
                  defaultValue={(editingStaff.specializations || []).join(", ")}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Hours</label>
                <div className="flex gap-2 items-center">
                  <input
                    name="working_hours_from"
                    type="time"
                    defaultValue={editingStaff.working_hours?.from || '09:00'}
                    className="flex-1 p-3 border border-input rounded-md bg-background"
                  />
                  <span className="text-muted-foreground">to</span>
                  <input
                    name="working_hours_to"
                    type="time"
                    defaultValue={editingStaff.working_hours?.to || '17:00'}
                    className="flex-1 p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="flex gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={(editingStaff.working_days || []).includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if ((editingStaff.working_days || []).includes(day)) {
                          setEditingStaff({
                            ...editingStaff,
                            working_days: (editingStaff.working_days || []).filter(d => d !== day)
                          });
                        } else {
                          setEditingStaff({
                            ...editingStaff,
                            working_days: [...(editingStaff.working_days || []), day]
                          });
                        }
                      }}
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
                <Switch name="is_active" defaultChecked={editingStaff.is_active} />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={handleCloseModals}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Availability Manager Modal */}
      {showAvailabilityManager && selectedStaffForAvailability && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Manage Availability - {selectedStaffForAvailability.name}</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseAvailabilityManager}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <AvailabilityManager
                staffId={selectedStaffForAvailability.id}
                staffName={selectedStaffForAvailability.name}
                onSave={handleCloseAvailabilityManager}
                onCancel={handleCloseAvailabilityManager}
              />
            </div>
          </div>
        </div>
      )}

      {/* Staff Scheduler Modal */}
      {showStaffScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Staff Schedule</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseScheduler}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <StaffScheduler
                onStaffSelect={(staffId) => {
                  console.log('Staff selected:', staffId);
                  // Handle staff selection for booking
                }}
                onAvailabilityEdit={(staffId) => {
                  const staffMember = staff.find(s => s.id === staffId);
                  if (staffMember) {
                    setSelectedStaffForAvailability(staffMember);
                    setShowStaffScheduler(false);
                    setShowAvailabilityManager(true);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Reassign Appointment Modal */}
      {showReassignModal && reassigningAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Reassign Appointment</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseReassignModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Appointment Details */}
              <div className="text-sm text-gray-600">
                Reassigning appointment for <strong>{reassigningAppointment.customer_name || reassigningAppointment.customer_phone}</strong> at <strong>{reassigningAppointment.time}</strong>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select New Staff Member</label>
                <div className="relative">
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                  >
                    <option value="">Choose staff member</option>
                    {staff.map((staffMember) => (
                      <option key={staffMember.id} value={staffMember.id}>
                        {staffMember.name} - {staffMember.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Notification Checkbox */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="notifyCustomer"
                      checked={notifyCustomer}
                      onChange={(e) => setNotifyCustomer(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <label htmlFor="notifyCustomer" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Notify customer about staff change
                    </label>
                    <p className="text-xs text-gray-600 mt-1">
                      Customer will be notified about the staff change via SMS/WhatsApp
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseReassignModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmReassignment} 
                disabled={!selectedStaffId || saving}
              >
                {saving ? 'Reassigning...' : 'Confirm Reassignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarSection({ loadTodaysAppointments }) {
  console.log('🗓️ CALENDAR SECTION RENDERED');
  const [viewMode, setViewMode] = useState("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filters, setFilters] = useState({
    staffMember: "All Staff",
    service: "All Services",
    status: "All Status"
  });
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [showCancelAppointmentModal, setShowCancelAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  const [newAppointment, setNewAppointment] = useState({
    customerName: "",
    phone: "",
    email: "",
    service: "",
    staffMember: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    notes: ""
  });
  const [editAppointment, setEditAppointment] = useState({
    customerName: "",
    phone: "",
    email: "",
    service: "",
    staffMember: "",
    date: "",
    time: "",
    status: "confirmed",
    notes: ""
  });
  const [cancelReason, setCancelReason] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<UIService[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🚀 STARTING DATA LOADING...');
        setLoading(true);
        const [appointmentsData, servicesData, staffData] = await Promise.all([
          salonApi.appointments.getAll(),
          salonApi.services.getAll(),
          staffApi.getAll()
        ]);
        console.log('📊 RAW API DATA LOADED:');
        console.log('📊 Appointments:', appointmentsData);
        console.log('📊 Services:', servicesData);
        console.log('📊 Staff:', staffData);
        // Transform API bookings to UI format using utility
        const transformedBookings = transformApiBookingsToUI(appointmentsData);
        
        // Set services and staff first
        setServices(servicesData);
        setStaff(staffData);
        
        // Enhance appointments with calendar display properties
        const enhancedAppointments = transformedBookings.map(apt => {
          const appointmentDateTime = new Date(apt.scheduled_at || '');
          // Format time to match timeSlots format (e.g., "9:00 AM")
          const timeString = formatTime(apt.appointmentTime || '') || appointmentDateTime.toLocaleTimeString('en-IN', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          });
          
          return {
            ...apt,
            // Calendar display properties - use the transformed data
            customer: apt.customer_name,
            service: apt.service_name || apt.service || 'Service', // Use service_name from API
            staff: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned', // Use actual staff or default
            duration: apt.duration_minutes || apt.duration || 60,
            time: timeString,
            status: apt.payment_status || apt.status || 'confirmed',
            amount: parseFloat(apt.amount || 0),
            // Additional properties for calendar display
            customer_name: apt.customer_name,
            service_name: apt.service_name || 'Service', // Use service_name from API
            staff_name: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned',
            duration_minutes: apt.duration_minutes || apt.duration || 60,
            phone: apt.customer_phone,
            email: apt.customer_email
          };
        });
        
        console.log('🔧 ENHANCEMENT COMPLETE:');
        console.log('🔧 Original appointments data:', appointmentsData);
        console.log('🔧 Enhanced appointments:', enhancedAppointments);
        console.log('🔧 Sample enhanced appointment:', enhancedAppointments[0]);
        console.log('🔧 Setting appointments state with:', enhancedAppointments.length, 'appointments');
        
        setAppointments(enhancedAppointments);
        setError(null);
      } catch (err) {
        console.error('Error loading calendar data:', err);
        setError('Failed to load calendar data');
        // Fallback to mock data with calendar display properties
        const mockAppointments = [
          { 
            id: 1, 
            customer_name: "Priya Sharma", 
            service_name: "Hair Cut & Color", 
            staff_name: "Priya Sharma", 
            scheduled_at: new Date().toISOString(), 
            duration_minutes: 120, 
            amount: 180, 
            payment_status: "paid",
            // Calendar display properties
            customer: "Sarah Johnson",
            service: "Hair Cut & Color",
            staff: "Emma",
            duration: 120,
            time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: 'confirmed'
          },
          { 
            id: 2, 
            customer_name: "Rajesh Kumar", 
            service_name: "Beard Trim", 
            staff_name: "Rajesh Kumar", 
            scheduled_at: new Date().toISOString(), 
            duration_minutes: 30, 
            amount: 35, 
            payment_status: "paid",
            // Calendar display properties
            customer: "Mike Chen",
            service: "Beard Trim",
            staff: "David",
            duration: 30,
            time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: 'confirmed'
          }
        ];
        setAppointments(mockAppointments);
        setServices([
          { id: 1, name: "Hair Cut & Style", category: "Hair", base_price: 45 },
          { id: 2, name: "Hair Color", category: "Hair", base_price: 80 },
          { id: 3, name: "Manicure", category: "Nails", base_price: 35 }
        ]);
        setStaff([
          { id: 1, name: "Emma Wilson", role: "stylist", working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"], working_hours: { from: "09:00", to: "17:00" } },
          { id: 2, name: "David Chen", role: "stylist", working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"], working_hours: { from: "09:00", to: "17:00" } },
          { id: 3, name: "Anna Rodriguez", role: "stylist", working_days: ["Mon", "Tue", "Wed", "Thu", "Fri"], working_hours: { from: "09:00", to: "17:00" } }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const timeSlots = [
    "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"
  ];

  // Use real staff data from API
  const staffMembers = staff.map(s => s.name);

  const handleNewAppointment = () => {
    setShowNewAppointmentModal(true);
  };

  const handleCloseModal = () => {
    setShowNewAppointmentModal(false);
    setNewAppointment({
      customerName: "",
      phone: "+1 (555) 123-4567",
      email: "customer@email.com",
      service: "",
      staffMember: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      notes: ""
    });
  };

  const handleEditAppointment = async (appointment) => {
    setEditingAppointment(appointment);
    
    // Load staff and services data for dropdowns
    let servicesData = [];
    let staffData = [];
    try {
      const [staffResponse, servicesResponse] = await Promise.all([
        fetch('/api/staff/staff', { headers: { 'x-tenant-id': 'bella-salon' } }),
        fetch('/api/salon/services', { headers: { 'x-tenant-id': 'bella-salon' } })
      ]);
      
      const staffResult = await staffResponse.json();
      const servicesResult = await servicesResponse.json();
      
      if (staffResult.success) {
        staffData = staffResult.data;
        setStaff(staffResult.data);
      }
      if (servicesResult.success) {
        servicesData = servicesResult.data;
        setServices(servicesResult.data);
      }
    } catch (error) {
      console.error('Error loading data for edit modal:', error);
    }

  // Helper function to convert time to 24-hour format for HTML time input
  const convertTo24HourFormat = (timeString) => {
    if (!timeString) return "";
    
    console.log('🔄 Converting time to 24-hour format:', timeString);
    
    // If already in 24-hour format (HH:mm), return as is
    if (/^\d{1,2}:\d{2}$/.test(timeString) && !timeString.includes('AM') && !timeString.includes('PM')) {
      console.log('✅ Already in 24-hour format:', timeString);
      return timeString;
    }
    
    // Convert 12-hour format to 24-hour format
    const [time, period] = timeString.split(' ');
    if (!time || !period) {
      console.warn('⚠️ Invalid time format:', timeString);
      return "10:00"; // Default fallback
    }
    
    const [hours, minutes] = time.split(':');
    if (!hours || !minutes) {
      console.warn('⚠️ Invalid time components:', timeString);
      return "10:00"; // Default fallback
    }
    
    let hour24 = parseInt(hours);
    if (isNaN(hour24)) {
      console.warn('⚠️ Invalid hour:', hours);
      return "10:00"; // Default fallback
    }
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const result = `${hour24.toString().padStart(2, '0')}:${minutes}`;
    console.log('✅ Converted to 24-hour format:', result);
    return result;
  };

    // Use the existing time field from appointment data (already in correct format)
    let timeValue = appointment.time || "";
    console.log('🕐 Calendar: Using existing time field:', timeValue);
    
    // Only extract from scheduled_at if time field is not available
    if (!timeValue && appointment.scheduled_at) {
      const date = new Date(appointment.scheduled_at);
      // Convert to 12-hour format for time dropdown (matches timeSlots format)
      timeValue = date.toLocaleTimeString('en-IN', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
      console.log('🕐 Calendar: Extracted time from scheduled_at (12-hour):', timeValue);
    }
    
    // Ensure time is in correct format for dropdown (should already be correct from appointment.time)
    console.log('🕐 Calendar: Final time value for dropdown:', timeValue);

    // Find service ID by service name (after services are loaded)
    let serviceId = appointment.offering_id || appointment.service_id || "";
    if (!serviceId && appointment.service_name && servicesData.length > 0) {
      const matchingService = servicesData.find(s => s.name === appointment.service_name);
      if (matchingService) {
        serviceId = matchingService.id;
        console.log('🔍 Calendar: Found service ID by name:', { serviceName: appointment.service_name, serviceId });
      }
    }

    // Find staff ID by staff name (after staff are loaded)
    let staffId = appointment.staff_id || "";
    if (!staffId && appointment.staff_name && staffData.length > 0) {
      const matchingStaff = staffData.find(s => s.name === appointment.staff_name);
      if (matchingStaff) {
        staffId = matchingStaff.id;
        console.log('🔍 Calendar: Found staff ID by name:', { staffName: appointment.staff_name, staffId });
      }
    }
    
    console.log('🔍 Calendar: Edit appointment data:', {
      appointment,
      timeValue,
      serviceId,
      staffId,
      scheduled_at: appointment.scheduled_at,
      time: appointment.time
    });
    
    setEditAppointment({
      customerName: appointment.customer_name || appointment.customer || "",
      phone: appointment.customer_phone || appointment.phone || "",
      email: appointment.customer_email || appointment.email || "",
      service: serviceId, // Use service ID instead of service name
      staffMember: staffId, // Use staff ID instead of staff name
      date: appointment.scheduled_at ? new Date(appointment.scheduled_at).toISOString().split('T')[0] : "",
      time: timeValue,
      status: appointment.payment_status || appointment.status || "confirmed",
      notes: appointment.notes || ""
    });
    setShowEditAppointmentModal(true);
  };

  const handleCancelAppointment = (appointment) => {
    setCancellingAppointment(appointment);
    setCancelReason("");
    setSendNotification(true);
    setShowCancelAppointmentModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditAppointmentModal(false);
    setEditingAppointment(null);
    setEditAppointment({
      customerName: "",
      phone: "",
      email: "",
      service: "",
      staffMember: "",
      date: "",
      time: "",
      status: "confirmed",
      notes: ""
    });
  };

  const handleSaveEditAppointment = async () => {
    if (!editingAppointment) return;
    
    setLoading(true);
    try {
      // Validate required fields
      if (!editAppointment.service) {
        alert('Please select a service');
        return;
      }
      
      if (!editAppointment.staffMember) {
        alert('Please select a staff member');
        return;
      }

      // Parse time properly - convert from 12-hour format to 24-hour format
      let timeString = editAppointment.time;
      if (timeString.includes(' AM') || timeString.includes(' PM')) {
        // Convert 12-hour format to 24-hour format for API
        const [timePart, ampm] = timeString.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour24 = parseInt(hours);
        
        if (ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Find service and staff details for duration and price
      const selectedService = services.find(s => s.id === editAppointment.service);
      const selectedStaff = staff.find(s => s.id === editAppointment.staffMember);
      
      // Create appointment data for API
      const appointmentData = {
        customer_name: editAppointment.customerName,
        customer_phone: editAppointment.phone,
        customer_email: editAppointment.email,
        service_id: editAppointment.service,
        staff_id: editAppointment.staffMember,
        scheduled_at: (() => {
          try {
            const dateTimeString = `${editAppointment.date}T${timeString}:00`;
            console.log('🕐 Creating scheduled_at:', dateTimeString);
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date/time combination');
            }
            return date.toISOString();
          } catch (error) {
            console.error('❌ Error creating scheduled_at:', error);
            throw new Error('Invalid time format. Please enter a valid time.');
          }
        })(),
        duration_minutes: selectedService?.duration_minutes || 60,
        amount: selectedService?.base_price || 0,
        currency: 'INR',
        payment_status: editAppointment.status,
        notes: editAppointment.notes
      };

      console.log('💾 Saving edited appointment:', appointmentData);

      // Update appointment via API
      const response = await fetch(`/api/salon/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      const updatedAppointment = await response.json();
      console.log('✅ Appointment updated successfully:', updatedAppointment);

      // Refresh appointments data
      const [appointmentsData, servicesData, staffData] = await Promise.all([
        salonApi.appointments.getAll(),
        salonApi.services.getAll(),
        staffApi.getAll()
      ]);
      
      // Transform and enhance appointments
      const transformedBookings = transformApiBookingsToUI(appointmentsData);
      const enhancedAppointments = transformedBookings.map(apt => {
        const appointmentDateTime = new Date(apt.scheduled_at || '');
        const timeString = formatTime(apt.appointmentTime || '') || appointmentDateTime.toLocaleTimeString('en-IN', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        
        return {
          ...apt,
          customer: apt.customer_name,
          service: apt.service_name || apt.service || 'Service',
          staff: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned',
          duration: apt.duration_minutes || apt.duration || 60,
          time: timeString,
          status: apt.payment_status || apt.status || 'confirmed',
          amount: parseFloat(apt.amount || 0),
          customer_name: apt.customer_name,
          service_name: apt.service_name || 'Service',
          staff_name: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned',
          duration_minutes: apt.duration_minutes || apt.duration || 60,
          phone: apt.customer_phone,
          email: apt.customer_email
        };
      });
      
      setAppointments(enhancedAppointments);
      
      // Reload today's appointments for staff schedule
      loadTodaysAppointments();
      
      // Close modal
      handleCloseEditModal();
      
      // Show success message
      alert('Appointment updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelAppointmentModal(false);
    setCancellingAppointment(null);
    setCancelReason("");
    setSendNotification(true);
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      
      // Create appointment data
      const selectedService = services.find(s => s.id === newAppointment.service);
      
      // Validate and format date/time
      const appointmentDate = newAppointment.date || new Date().toISOString().split('T')[0];
      let appointmentTime = newAppointment.time || '09:00';
      
      // Convert time from "HH:MM AM/PM" to "HH:MM" format
      if (appointmentTime.includes('AM') || appointmentTime.includes('PM')) {
        const [time, period] = appointmentTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        appointmentTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Create date string in proper format
      const dateTimeString = `${appointmentDate}T${appointmentTime}:00`;
      const appointmentDateTime = new Date(dateTimeString);
      
      // Debug logging
      console.log('Appointment data:', {
        date: newAppointment.date,
        time: newAppointment.time,
        appointmentDate,
        appointmentTime,
        dateTimeString,
        appointmentDateTime: appointmentDateTime.toISOString()
      });
      
      // Validate the date
      if (isNaN(appointmentDateTime.getTime())) {
        console.error('Invalid date/time:', { appointmentDate, appointmentTime, dateTimeString });
        throw new Error('Invalid date or time selected');
      }
      
      const appointmentData = {
        customer_name: newAppointment.customerName,
        customer_phone: newAppointment.phone,
        customer_email: newAppointment.email,
        service_id: newAppointment.service,
        scheduled_at: appointmentDateTime.toISOString(),
        duration_minutes: selectedService?.duration_minutes || 60,
        amount: selectedService?.base_price || 0,
        currency: 'INR',
        notes: newAppointment.notes
      };

      // Call API to create appointment
      const response = await salonApi.appointments.create(appointmentData);
      
      // Add to local state with proper structure for calendar display
      const responseDateTime = new Date(response.scheduled_at);
      const newAppointmentData = {
        id: response.id,
        customer_name: response.customer_name,
        service_name: selectedService?.name || 'Service',
        staff_name: staff.find(s => s.id === newAppointment.staffMember)?.name || 'Staff',
        scheduled_at: response.scheduled_at,
        duration_minutes: response.duration_minutes,
        amount: response.amount,
        payment_status: 'pending',
        // Calendar display properties
        customer: response.customer_name,
        service: selectedService?.name || 'Service',
        staff: staff.find(s => s.id === newAppointment.staffMember)?.name || 'Staff',
        duration: response.duration_minutes,
        time: responseDateTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'confirmed'
      };
      setAppointments(prev => [...prev, newAppointmentData]);
      
      // Reload today's appointments for staff schedule
      loadTodaysAppointments();
      
      // Close modal and reset form
      handleCloseModal();
      
      console.log("Appointment created successfully:", response);
    } catch (error) {
      console.error("Error creating appointment:", error);
      // For now, add to local state as fallback
      const fallbackDate = newAppointment.date || new Date().toISOString().split('T')[0];
      let fallbackTime = newAppointment.time || '09:00';
      
      // Convert time from "HH:MM AM/PM" to "HH:MM" format
      if (fallbackTime.includes('AM') || fallbackTime.includes('PM')) {
        const [time, period] = fallbackTime.split(' ');
        const [hours, minutes] = time.split(':');
        let hour24 = parseInt(hours);
        
        if (period === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        fallbackTime = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      const fallbackDateTime = new Date(`${fallbackDate}T${fallbackTime}:00`);
      
      const newApt = {
        id: Date.now(), // Temporary ID
        customer_name: newAppointment.customerName,
        service_name: services.find(s => s.id === newAppointment.service)?.name || 'Service',
        staff_name: staff.find(s => s.id === newAppointment.staffMember)?.name || 'Staff',
        scheduled_at: isNaN(fallbackDateTime.getTime()) ? new Date().toISOString() : fallbackDateTime.toISOString(),
        duration_minutes: 60,
        amount: 0,
        payment_status: 'pending',
        // Calendar display properties
        customer: newAppointment.customerName,
        service: services.find(s => s.id === newAppointment.service)?.name || 'Service',
        staff: staff.find(s => s.id === newAppointment.staffMember)?.name || 'Staff',
        duration: 60,
        time: fallbackDateTime.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'confirmed'
      };
      setAppointments(prev => [...prev, newApt]);
      
      // Reload today's appointments for staff schedule
      loadTodaysAppointments();
      
      handleCloseModal();
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date) => {
    console.log('🔍 getAppointmentsForDate called with date:', date);
    console.log('🔍 Current appointments array:', appointments);
    console.log('🔍 Appointments length:', appointments?.length);
    
    if (!date) {
      console.log('❌ No date provided, returning empty array');
      return [];
    }
    
    const filtered = (appointments || []).filter(apt => {
      if (!apt) {
        console.log('❌ Appointment is null/undefined');
        return false;
      }
      
      const aptDate = new Date(apt.scheduled_at || apt.date || '');
      console.log('🔍 Checking appointment:', apt.id, 'scheduled_at:', apt.scheduled_at, 'parsed date:', aptDate);
      
      if (isNaN(aptDate.getTime())) {
        console.log('❌ Invalid date for appointment:', apt.id);
        return false;
      }
      
      const matches = aptDate.toDateString() === date.toDateString();
      console.log('🔍 Date match:', aptDate.toDateString(), '===', date.toDateString(), '=', matches);
      return matches;
    });
    
    console.log('✅ Filtered appointments for date:', filtered);
    return filtered;
  };

  const getAppointmentsForWeek = (startDate) => {
    if (!startDate) return [];
    
    const weekAppointments = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekAppointments.push({
        date,
        appointments: getAppointmentsForDate(date)
      });
    }
    return weekAppointments;
  };

  const getAppointmentsForMonth = (date) => {
    if (!date) return [];
    
    const monthAppointments = [];
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const currentDate = new Date(year, month, day);
      monthAppointments.push({
        date: currentDate,
        appointments: getAppointmentsForDate(currentDate)
      });
    }
    return monthAppointments;
  };

  const renderDayView = () => {
    console.log('📅 RENDER DAY VIEW CALLED');
    if (!currentDate) {
      console.log('❌ No current date, showing loading');
      return <div>Loading...</div>;
    }
    
    console.log('📅 Current date:', currentDate);
    const dayAppointments = getAppointmentsForDate(currentDate);
    console.log('📅 Day appointments for current date:', dayAppointments);
    const dateString = currentDate.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const navigateDay = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + direction);
      setCurrentDate(newDate);
    };

    return (
      <div className="space-y-6">
        {/* Date Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateDay(-1)}>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{dateString}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateDay(1)}>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
              <CardTitle>Daily Schedule</CardTitle>
                <Badge variant="outline" className="text-sm">
                  {dayAppointments.length} appointment{dayAppointments.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeSlots.map((time, index) => {
                  const appointment = dayAppointments.find(apt => {
                    // Try exact match first
                    if (apt.time === time) return true;
                    // Try to match by converting both to same format
                    const aptTime = apt.time || '';
                    const timeMatch = aptTime.includes(time.split(' ')[0]) || time.includes(aptTime.split(' ')[0]);
                    return timeMatch;
                  });

                  // Get status color for appointment
                  const getStatusColor = (status) => {
                    switch (status) {
                      case 'confirmed': return 'bg-green-500';
                      case 'pending': return 'bg-yellow-500';
                      case 'cancelled': return 'bg-red-500';
                      default: return 'bg-gray-500';
                    }
                  };

                  return (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      {/* Time */}
                      <div className="flex-shrink-0 w-20">
                        <div className="text-sm font-medium text-gray-900">
                          {time}
                      </div>
                      </div>
                      
                      {/* Status Indicator */}
                      <div className="flex-shrink-0">
                        {appointment ? (
                          <div className={`w-1 h-12 rounded-full ${getStatusColor(appointment.status || 'confirmed')}`}></div>
                        ) : (
                          <div className="w-1 h-12 rounded-full bg-gray-200"></div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {appointment ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">
                              {appointment.customer || appointment.customer_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {appointment.service || appointment.service_name || 'N/A'} • {appointment.staff || 'Unassigned'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {appointment.duration || appointment.duration_minutes || 60} min • {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(appointment.amount || 0)}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">Available</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {appointment ? (
                          <Badge 
                            variant={appointment.status === "confirmed" ? "default" : 
                                    appointment.status === "pending" ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {appointment.status || 'confirmed'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Staff Schedule Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Staff Schedule Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {staffMembers.map((staff, index) => {
                  const staffAppointments = dayAppointments.filter(apt => apt.staff === staff);
                  
                  // Create hourly timeline (9 AM to 7 PM)
                  const hours = Array.from({ length: 11 }, (_, i) => i + 9); // 9 to 19 (9 AM to 7 PM)
                  
                  return (
                    <div key={index} className="space-y-3">
                      {/* Staff Header */}
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">{staff}</h4>
                        <Badge variant="outline" className="text-sm">
                          {staffAppointments.length} appointment{staffAppointments.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                      
                      {/* Timeline */}
                      <div className="relative">
                        {/* Hour labels */}
                        <div className="flex mb-2">
                          {hours.map((hour) => (
                            <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
                              {hour === 9 ? '9 AM' : hour === 12 ? '12 PM' : hour === 17 ? '5 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </div>
                        ))}
                      </div>
                        
                        {/* Timeline grid */}
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          {hours.map((hour) => (
                            <div key={hour} className="flex-1 h-8 bg-white rounded border border-gray-200 mr-1 last:mr-0"></div>
                          ))}
                        </div>
                        
                        {/* Appointment blocks */}
                        <div className="absolute top-8 left-1 right-1">
                          {staffAppointments.map((appointment, aptIndex) => {
                            // Calculate position and width based on time
                            const startTime = appointment.time || '9:00 AM';
                            const [time, period] = startTime.split(' ');
                            const [hours, minutes] = time.split(':');
                            let hour24 = parseInt(hours);
                            if (period === 'PM' && hour24 !== 12) hour24 += 12;
                            if (period === 'AM' && hour24 === 12) hour24 = 0;
                            
                            const startHour = hour24;
                            const duration = appointment.duration || 60;
                            const endHour = startHour + Math.ceil(duration / 60);
                            
                            // Calculate position (0-10 for hours 9-19)
                            const position = Math.max(0, startHour - 9);
                            const width = Math.min(11 - position, Math.ceil(duration / 60));
                            
                            // Color based on service type or status
                            const getBlockColor = (service: string, status: string) => {
                              if (status === 'confirmed') return 'bg-green-500';
                              if (status === 'pending') return 'bg-yellow-500';
                              if (service?.toLowerCase().includes('hair')) return 'bg-blue-500';
                              if (service?.toLowerCase().includes('nail')) return 'bg-purple-500';
                              return 'bg-gray-500';
                            };
                            
                            return (
                              <div
                                key={aptIndex}
                                className={`absolute h-6 rounded text-white text-xs flex items-center px-2 font-medium ${getBlockColor(appointment.service, appointment.status)}`}
                                style={{
                                  left: `${(position / 11) * 100}%`,
                                  width: `${(width / 11) * 100}%`,
                                  top: `${aptIndex * 8}px`
                                }}
                              >
                                <span className="truncate">
                                  {appointment.customer?.split(' ')[0] || 'Customer'}
                                </span>
                    </div>
                  );
                })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Empty state */}
                {staffMembers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No staff members</h3>
                    <p className="text-muted-foreground mb-4">Add staff members to see their schedules</p>
                    <Button onClick={() => setShowStaffScheduler(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Appointment Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Appointment Details</CardTitle>
              <div className="text-sm text-muted-foreground">
                {dayAppointments.length} appointments today
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dayAppointments.map((appointment) => {
                console.log('📝 Rendering appointment details for:', appointment.id, {
                  customer: appointment.customer,
                  service: appointment.service,
                  staff: appointment.staff,
                  duration: appointment.duration,
                  time: appointment.time
                });
                
                // Calculate end time
                const startTime = appointment.time || '9:00 AM';
                const duration = appointment.duration || 60;
                const [time, period] = startTime.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                
                const startMinutes = hour24 * 60 + parseInt(minutes);
                const endMinutes = startMinutes + duration;
                const endHour24 = Math.floor(endMinutes / 60);
                const endMin = endMinutes % 60;
                const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
                const displayEndHour = endHour24 > 12 ? endHour24 - 12 : (endHour24 === 0 ? 12 : endHour24);
                const endTime = `${displayEndHour}:${endMin.toString().padStart(2, '0')} ${endPeriod}`;
                
                // Format price in INR
                const price = appointment.amount || 0;
                const formattedPrice = new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                }).format(price);
                
                return (
                <div key={appointment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    {/* Left Section - Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold text-lg">{appointment.customer}</h3>
                        <Badge 
                          variant={appointment.status === "confirmed" ? "default" : 
                                 appointment.status === "pending" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {appointment.status}
                        </Badge>
                    </div>
                      
                      {/* Service, Staff, Duration, Price in one row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {/* Service */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                            <p className="text-xs text-muted-foreground">Service</p>
                            <p className="text-sm font-medium">{appointment.service}</p>
                      </div>
                    </div>
                        
                        {/* Staff */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-muted-foreground">Staff</p>
                            <p className="text-sm font-medium">{appointment.staff}</p>
                  </div>
                        </div>
                        
                        {/* Duration */}
                  <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-muted-foreground">Duration</p>
                            <p className="text-sm font-medium">{appointment.duration} mins</p>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="text-sm font-semibold text-green-600">{formattedPrice}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>📅 {new Date().toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                        <span>⏰ {startTime} - {endTime}</span>
                      </div>
                    </div>
                    
                    {/* Center Section - Time Circle */}
                    <div className="flex flex-col items-center mx-6">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {appointment.time}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-center">
                        {endTime}
                      </div>
                    </div>
                    
                    {/* Right Section - Actions */}
                    <div className="flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleCancelAppointment(appointment)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
                );
              })}
              
              {/* Empty State */}
              {dayAppointments.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No appointments today</h3>
                  <p className="text-muted-foreground mb-4">Schedule appointments to see them here</p>
                  <Button onClick={handleNewAppointment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderWeekView = () => {
    if (!currentDate) {
      return <div>Loading...</div>;
    }
    
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay());
    const weekAppointments = getAppointmentsForWeek(weekStart);
    const weekRange = `${weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const navigateWeek = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + (direction * 7));
      setCurrentDate(newDate);
    };

    return (
      <div className="space-y-6">
        {/* Week Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <div className="text-center">
            <h3 className="text-xl font-semibold">Week of {weekRange}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>

        {/* Weekly Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekAppointments.map((day, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="text-center mb-4">
                    <div className="font-medium">{day.date.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div className="text-sm text-muted-foreground">{day.date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                    <div className="text-xs text-muted-foreground">({day.appointments.length} appointments)</div>
                  </div>
                  <div className="space-y-2">
                    {day.appointments.map((appointment) => (
                      <div key={appointment.id} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="font-medium">{appointment.time}</div>
                        <div className="text-muted-foreground">{appointment.customer}</div>
                        <div className="text-muted-foreground">{appointment.service}</div>
                        <Badge variant={appointment.status === "confirmed" ? "default" : "secondary"} className="text-xs">
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                    {day.appointments.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs">
                        <div>Add Appointment</div>
                        <div className="mt-2 space-y-1">
                          <div>9:00 AM</div>
                          <div>9:30 AM</div>
                          <div>10:00 AM</div>
                        </div>
                        <Button size="sm" variant="outline" className="mt-2">+ Book First</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Slot Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Time Slot Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Time</th>
                    {weekAppointments.map((day, index) => (
                      <th key={index} className="text-center p-2">
                        {day.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.slice(0, 13).map((time, timeIndex) => (
                    <tr key={timeIndex}>
                      <td className="p-2 font-medium">{time}</td>
                      {weekAppointments.map((day, dayIndex) => {
                        const appointment = day.appointments.find(apt => apt.time === time);
                        return (
                          <td key={dayIndex} className="p-2">
                            {appointment ? (
                              <div className={`p-2 rounded text-xs text-white ${
                                appointment.status === "confirmed" ? "bg-green-500" :
                                appointment.status === "pending" ? "bg-yellow-500" : "bg-red-500"
                              }`}>
                                {appointment.customer}
                              </div>
                            ) : (
                              <div className="p-2 bg-gray-100 rounded text-xs text-center">Available</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Canceled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span>Available</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderMonthView = () => {
    if (!currentDate) {
      return <div>Loading...</div>;
    }
    
    const monthAppointments = getAppointmentsForMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const totalAppointments = (appointments || []).filter(apt => {
      if (!apt) return false;
      const aptDate = new Date(apt.scheduled_at || apt.date);
      if (isNaN(aptDate.getTime())) return false;
      return aptDate.getMonth() === currentDate.getMonth() && 
             aptDate.getFullYear() === currentDate.getFullYear();
    });
    const confirmedCount = totalAppointments.filter(apt => apt.status === "confirmed").length;
    const pendingCount = totalAppointments.filter(apt => apt.status === "pending").length;
    const cancelledCount = totalAppointments.filter(apt => apt.status === "cancelled").length;

    const navigateMonth = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + direction);
      setCurrentDate(newDate);
    };

    return (
      <div className="space-y-6">
        {/* Month Header with Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
            <ChevronDown className="h-4 w-4 rotate-90" />
          </Button>
          <div className="text-center">
            <h3 className="text-xl font-semibold">{monthName}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
            <ChevronDown className="h-4 w-4 -rotate-90" />
          </Button>
        </div>

        {/* Monthly Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {/* Days of week header */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {monthAppointments.map((day, index) => (
                <div key={index} className="border rounded-lg p-2 min-h-[100px]">
                  <div className="text-center mb-2">
                    <div className="font-medium">{day.date.getDate()}</div>
                    {day.appointments.length > 0 && (
                      <div className="text-xs text-muted-foreground">({day.appointments.length})</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    {day.appointments.slice(0, 2).map((appointment) => (
                      <div key={appointment.id} className={`p-1 rounded text-xs ${
                        appointment.status === "confirmed" ? "bg-green-100 text-green-800" :
                        appointment.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
                      }`}>
                        <div className="font-medium">{appointment.time}</div>
                        <div>{appointment.customer}</div>
                      </div>
                    ))}
                    {day.appointments.length > 2 && (
                      <div className="text-xs text-muted-foreground">+{day.appointments.length - 2} more</div>
                    )}
                    {day.appointments.length === 0 && (
                      <div className="text-center text-muted-foreground text-xs">
                        <div>+</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
              <div className="text-sm text-muted-foreground">Confirmed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{cancelledCount}</div>
              <div className="text-sm text-muted-foreground">Cancelled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">₹{totalAppointments.reduce((sum, apt) => sum + (apt.amount || 0), 0)}</div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

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
          <Button className="ml-4" onClick={handleNewAppointment}>
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
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
                  <option value="All Staff">All Staff</option>
                  {(staff || []).map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.name}>{staffMember.name}</option>
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
                  <option value="All Services">All Services</option>
                  <option value="Hair Cut">Hair Cut</option>
                  <option value="Hair Color">Hair Color</option>
                  <option value="Manicure">Manicure</option>
                  <option value="Facial Treatment">Facial Treatment</option>
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
                  <option value="All Status">All Status</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-2 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      {viewMode === "day" && renderDayView()}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "month" && renderMonthView()}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Clock className="h-6 w-6 mb-2" />
              Block Time Slot
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-2" />
              Bulk Reschedule
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Bell className="h-6 w-6 mb-2" />
              Send Reminders
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <Download className="h-6 w-6 mb-2" />
              Export Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* New Appointment Modal */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Appointment</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name</label>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={newAppointment.customerName}
                  onChange={(e) => setNewAppointment({...newAppointment, customerName: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              {/* Phone and Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newAppointment.phone}
                    onChange={(e) => setNewAppointment({...newAppointment, phone: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={newAppointment.email}
                    onChange={(e) => setNewAppointment({...newAppointment, email: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              {/* Service and Staff Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service</label>
                  <div className="relative">
                    <select
                      value={newAppointment.service}
                      onChange={(e) => setNewAppointment({...newAppointment, service: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select service</option>
                      {(services || []).map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Staff Member</label>
                  <div className="relative">
                    <select
                      value={newAppointment.staffMember}
                      onChange={(e) => setNewAppointment({...newAppointment, staffMember: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select staff</option>
                      {(staff || []).map((staffMember) => (
                        <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Date and Time Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <div className="relative">
                  <input
                    type="date"
                    value={newAppointment.date}
                    onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background pr-10"
                  />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time</label>
                  <div className="relative">
                    <select
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any special requirements or notes"
                  value={newAppointment.notes}
                  onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleBookAppointment} disabled={loading}>
                {loading ? "Booking..." : "Book Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditAppointmentModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Edit Appointment</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Original Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Original Appointment</h4>
              <p className="text-sm text-gray-600">
                {editingAppointment.customer} - {editingAppointment.service}
              </p>
              <p className="text-sm text-gray-600">
                {editingAppointment.scheduled_at ? new Date(editingAppointment.scheduled_at).toLocaleDateString('en-IN') : ''} at {editingAppointment.time} with {editingAppointment.staff}
              </p>
            </div>

            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={editAppointment.customerName}
                  onChange={(e) => setEditAppointment({...editAppointment, customerName: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={editAppointment.phone}
                  onChange={(e) => setEditAppointment({...editAppointment, phone: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editAppointment.email}
                  onChange={(e) => setEditAppointment({...editAppointment, email: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter email address"
                />
              </div>

              {/* Service and Staff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service *</label>
                  <div className="relative">
                    <select
                      value={editAppointment.service}
                      onChange={(e) => setEditAppointment({...editAppointment, service: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select service</option>
                      {(services || []).map((service) => (
                        <option key={service.id} value={service.id}>{service.name} - ₹{service.base_price} ({service.duration_minutes || 60} mins)</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Staff Member *</label>
                  <div className="relative">
                    <select
                      value={editAppointment.staffMember}
                      onChange={(e) => setEditAppointment({...editAppointment, staffMember: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select staff</option>
                      {(staff || []).map((staffMember) => (
                        <option key={staffMember.id} value={staffMember.id}>{staffMember.name} - {staffMember.role}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editAppointment.date}
                      onChange={(e) => setEditAppointment({...editAppointment, date: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background"
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <div className="relative">
                    <select
                      value={editAppointment.time}
                      onChange={(e) => setEditAppointment({...editAppointment, time: e.target.value})}
                      className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="relative">
                  <select
                    value={editAppointment.status}
                    onChange={(e) => setEditAppointment({...editAppointment, status: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any special requirements or notes"
                  value={editAppointment.notes}
                  onChange={(e) => setEditAppointment({...editAppointment, notes: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseEditModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditAppointment} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelAppointmentModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-xl font-semibold">Cancel Appointment</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseCancelModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel the appointment for <strong>{cancellingAppointment.customer}</strong>?
              </p>
              
              {/* Appointment Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Service:</span>
                    <p>{cancellingAppointment.service}</p>
                  </div>
                  <div>
                    <span className="font-medium">Date & Time:</span>
                    <p>{cancellingAppointment.scheduled_at ? new Date(cancellingAppointment.scheduled_at).toLocaleDateString('en-IN') : ''} at {cancellingAppointment.time}</p>
                  </div>
                  <div>
                    <span className="font-medium">Staff:</span>
                    <p>{cancellingAppointment.staff}</p>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <p>{cancellingAppointment.duration_minutes || cancellingAppointment.duration || 60} minutes</p>
                  </div>
                  <div>
                    <span className="font-medium">Price:</span>
                    <p>₹{cancellingAppointment.amount || 0}</p>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Cancellation Reason (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Reason for cancellation (will be logged for records)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>

              {/* Notification Option */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={sendNotification}
                  onChange={(e) => setSendNotification(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="sendNotification" className="text-sm">
                  Send cancellation notification to customer
                </label>
              </div>

              {/* Warning Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> This action cannot be undone. The appointment will be permanently cancelled and the time slot will become available for booking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseCancelModal}>
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => {/* TODO: Implement cancel appointment */}}
                disabled={loading}
              >
                Cancel Appointment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsSection() {
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [markingTransaction, setMarkingTransaction] = useState(null);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all appointments for revenue calculation
  useEffect(() => {
    const loadAppointments = async () => {
      try {
        setLoading(true);
        const appointmentsData = await salonApi.appointments.getAll();
        setAllAppointments(appointmentsData);
      } catch (error) {
        console.error('Error loading appointments for payments:', error);
        setAllAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, []);

  const handleMarkPaid = (transaction) => {
    setMarkingTransaction(transaction);
    setShowMarkPaidModal(true);
  };

  const handleCloseModals = () => {
    setShowMarkPaidModal(false);
    setMarkingTransaction(null);
  };

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
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'today'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From today's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'week'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this week's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'month'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this month's appointments
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>This Year</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : formatCurrencyWithCommas(calculateRevenueFromAppointments(allAppointments, 'year'))}
            </div>
            <p className="text-xs text-muted-foreground">
              From this year's appointments
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
                      style={{ height: `${Math.min((item.revenue / 100000) * 180, 180)}px` }}
                    ></div>
                    <span className="text-xs text-muted-foreground">{item.day}</span>
                    <span className="text-xs font-medium">₹{item.revenue}</span>
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
                    <div className="text-xs text-muted-foreground">₹{item.amount}</div>
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
              <option>UPI</option>
              <option>Paytm</option>
              <option>PhonePe</option>
              <option>GPay</option>
              <option>Credit Card</option>
              <option>Debit Card</option>
              <option>Net Banking</option>
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
                  <TableCell>₹{transaction.amount}</TableCell>
                  <TableCell>{transaction.method}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === "paid" ? "default" : "secondary"}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkPaid(transaction)}>Mark Paid</Button>
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
              <div className="text-2xl font-bold">₹{method.amount.toLocaleString()}</div>
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

      {/* Mark Payment as Paid Modal */}
      {showMarkPaidModal && markingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                  <X className="h-4 w-4 text-white" />
                </div>
                Mark Payment as Paid
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to mark this payment as paid?
              </p>
              
              {/* Transaction Summary */}
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="space-y-2">
                  <div><strong>Customer:</strong> {markingTransaction.customer}</div>
                  <div><strong>Service:</strong> {markingTransaction.service}</div>
                  <div><strong>Amount:</strong> ₹{markingTransaction.amount}</div>
                  <div><strong>Method:</strong> {markingTransaction.method}</div>
                  <div><strong>Staff:</strong> {markingTransaction.staff}</div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                This action will update the payment status and cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button className="bg-green-500 hover:bg-green-600">
                <X className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersSection() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showWishesModal, setShowWishesModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [birthdayCustomer, setBirthdayCustomer] = useState(null);

  const handleAddCustomer = () => {
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
  };

  const handleSendWishes = (customer) => {
    setBirthdayCustomer(customer);
    setShowWishesModal(true);
  };

  const handleCloseModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowWishesModal(false);
    setEditingCustomer(null);
    setBirthdayCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Customers</h2>
          <p className="text-muted-foreground">Customer Management</p>
          <p className="text-sm text-muted-foreground">Manage customer relationships and communication.</p>
        </div>
        <Button onClick={handleAddCustomer}>
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
            <div className="text-2xl font-bold">₹{customerKPIs.revenue.toLocaleString()}</div>
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
                  <TableCell>₹{customer.spent.toLocaleString()}</TableCell>
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
                      <Button size="sm" variant="ghost" onClick={() => handleEditCustomer(customer)}>
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
                <Button size="sm" variant="outline" onClick={() => handleSendWishes(birthday)}>
                  Send Wishes
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Customer</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Birth Date</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full p-3 border border-input rounded-md bg-background pr-10"
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="john@email.com"
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
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Special preferences, allergies, etc."
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Edit Customer</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  defaultValue={editingCustomer.name}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Birth Date</label>
                <div className="relative">
                  <input
                    type="date"
                    defaultValue="1990-03-15"
                    className="w-full p-3 border border-input rounded-md bg-background pr-10"
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    defaultValue={editingCustomer.email}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  rows={3}
                  defaultValue="Allergic to certain hair products"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button>
                Save Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Birthday Wishes Modal */}
      {showWishesModal && birthdayCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Send Birthday Wishes
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Birthday Customer Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Gift className="h-4 w-4" />
                  Birthday Customer
                </h4>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {birthdayCustomer.name}</div>
                  <div><strong>Phone:</strong> +1 (555) 456-7890</div>
                  <div><strong>Email:</strong> john.smith@email.com</div>
                </div>
              </div>
              
              {/* Birthday Message */}
              <div>
                <h4 className="font-medium mb-3">Birthday Message</h4>
                <textarea
                  rows={6}
                  defaultValue="🎉 Happy Birthday John Smith! ✨ Wishing you a wonderful day filled with joy and happiness! As a birthday gift, we're offering you 25% off on your next visit to Bella Salon. Valid for 30 days. Book your appointment now! 🔔 Bella Salon Team"
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              {/* Delivery Method */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700">
                  <MessageSquare className="h-4 w-4" />
                  <span className="font-medium">Message will be sent via WhatsApp and SMS</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button className="bg-pink-500 hover:bg-pink-600">
                <Send className="h-4 w-4 mr-2" />
                Send Wishes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PromotionsSection() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(null);

  const handleCreateCampaign = () => {
    setShowCreateModal(true);
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setShowEditModal(true);
  };

  const handleSendCampaign = (campaign) => {
    setSendingCampaign(campaign);
    setShowSendModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowSendModal(false);
    setEditingCampaign(null);
    setSendingCampaign(null);
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
                  <Button size="sm" variant="ghost" onClick={() => handleSendCampaign(template)}>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
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
                  defaultValue={editingCampaign.name || ''}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select 
                  defaultValue={editingCampaign.type || 'promotion'}
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
                  defaultValue={editingCampaign.description || ''}
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
                    defaultValue={editingCampaign.discount ? editingCampaign.discount.replace('%', '') : ''}
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
                  defaultValue={editingCampaign.target === "All Customers" ? "all" : (editingCampaign.target ? "vip" : "all")}
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

      {/* Send Campaign Modal */}
      {showSendModal && sendingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-500" />
                Send Campaign
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCloseModals}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Campaign Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Campaign:</span>
                    <div className="font-medium">{sendingCampaign.name}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <div>
                      <Badge variant="secondary" className="ml-2">{sendingCampaign.type}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Target:</span>
                    <div className="font-medium">{sendingCampaign.target}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Recipients:</span>
                    <div className="font-medium text-blue-600">0 customers</div>
                  </div>
                </div>
              </div>
              
              {/* Delivery Channels */}
              <div>
                <h4 className="font-medium mb-3">Delivery Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">WhatsApp</div>
                        <div className="text-sm text-muted-foreground">Recommended</div>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">SMS</div>
                        <div className="text-sm text-muted-foreground">Text message</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-sm text-muted-foreground">Email notification</div>
                      </div>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              {/* Schedule for Later */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium">Schedule for Later</div>
                    <div className="text-sm text-muted-foreground">Send at a specific time</div>
                  </div>
                </div>
                <Switch />
              </div>
              
              {/* Preview Message */}
              <div>
                <h4 className="font-medium mb-3">Preview Message:</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm">{sendingCampaign.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseModals}>
                Cancel
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600">
                <Send className="h-4 w-4 mr-2" />
                Send Now
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
  // Log version for deployment tracking
      console.log('🚀 Salon Dashboard v2.2.8 - Implemented Cancel Appointment Functionality');
  
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Edit appointment modal state
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [editAppointment, setEditAppointment] = useState({
    customerName: "",
    phone: "",
    email: "",
    service: "",
    staffMember: "",
    date: "",
    time: "",
    status: "confirmed",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Staff schedule state
  const [todaysAppointments, setTodaysAppointments] = useState<any[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  
  // Cancel appointment modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(null);
  
  // Quick Actions modals state
  const [showQuickBookModal, setShowQuickBookModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showProcessPaymentModal, setShowProcessPaymentModal] = useState(false);
  const [showSendRemindersModal, setShowSendRemindersModal] = useState(false);
  const [showViewScheduleModal, setShowViewScheduleModal] = useState(false);

  // Load today's appointments for staff schedule
  const loadTodaysAppointments = async () => {
    try {
      setScheduleLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Load both appointments and staff data
      const [appointmentsResponse, staffResponse] = await Promise.all([
        fetch(`/api/salon/appointments?date=${today}`, {
          headers: { 'x-tenant-id': 'bella-salon' }
        }),
        fetch('/api/staff/staff', {
          headers: { 'x-tenant-id': 'bella-salon' }
        })
      ]);
      
      if (appointmentsResponse.ok && staffResponse.ok) {
        const appointmentsResult = await appointmentsResponse.json();
        const staffResult = await staffResponse.json();
        
        if (appointmentsResult.success && staffResult.success) {
          const appointments = appointmentsResult.data || [];
          const staffMembers = staffResult.data || [];
          
          // Create a staff lookup map
          const staffMap = new Map();
          staffMembers.forEach(staff => {
            staffMap.set(staff.id, staff.name);
          });
          
          // Map appointments with staff names and formatted time
          const mappedAppointments = appointments.map(appointment => {
            // Extract time from scheduled_at (format: "2025-10-01T17:31:00.000Z")
            let timeFormatted = 'N/A';
            if (appointment.scheduled_at) {
              const date = new Date(appointment.scheduled_at);
              timeFormatted = date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              });
            }
            
            return {
              ...appointment,
              staff_name: staffMap.get(appointment.staff_id) || 'Unassigned',
              time: timeFormatted
            };
          });
          
          console.log('📅 Mapped appointments for staff schedule:', mappedAppointments);
          setTodaysAppointments(mappedAppointments);
        } else {
          console.error('Failed to load data:', appointmentsResult.error || staffResult.error);
          setTodaysAppointments([]);
        }
      } else {
        console.error('Failed to load appointments or staff:', appointmentsResponse.statusText, staffResponse.statusText);
        setTodaysAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setTodaysAppointments([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  // Load today's appointments on component mount
  useEffect(() => {
    loadTodaysAppointments();
  }, []);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showDailySummaryModal, setShowDailySummaryModal] = useState(false);
  
  // Quick Book modal state
  const [quickBookData, setQuickBookData] = useState({
    customerName: '',
    phone: '',
    email: '',
    service: '',
    staff: '',
    date: '',
    time: '',
    notes: ''
  });
  const [availableServices, setAvailableServices] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [quickBookLoading, setQuickBookLoading] = useState(false);
  
  // Daily Summary modal state
  const [dailySummaryData, setDailySummaryData] = useState({
    appointments: 0,
    revenue: 0,
    completedAppointments: 0,
    pendingAppointments: 0,
    topServices: [],
    staffPerformance: []
  });
  const [dailySummaryLoading, setDailySummaryLoading] = useState(false);
  
  // Check In modal state
  const [checkInData, setCheckInData] = useState({
    appointmentId: '',
    checkInNotes: '',
    specialRequests: ''
  });
  const [availableAppointments, setAvailableAppointments] = useState([]);
  const [checkInLoading, setCheckInLoading] = useState(false);
  
  // Process Payment modal state
  const [paymentData, setPaymentData] = useState({
    appointmentId: '',
    amount: '',
    tip: '',
    paymentMethod: 'cash'
  });
  const [paymentAppointments, setPaymentAppointments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // View Schedule modal state
  const [scheduleData, setScheduleData] = useState({
    staffSchedules: [],
    appointments: []
  });
  
  // Send Reminders modal state
  const [reminderData, setReminderData] = useState({
    reminderType: 'tomorrow',
    customMessage: '',
    selectedAppointments: []
  });
  const [reminderAppointments, setReminderAppointments] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  
  // Walk-in modal state
  const [walkInData, setWalkInData] = useState({
    customerName: '',
    phone: '',
    email: '',
    service: '',
    staff: '',
    time: '',
    notes: ''
  });
  const [walkInServices, setWalkInServices] = useState([]);
  const [walkInStaff, setWalkInStaff] = useState([]);
  const [walkInLoading, setWalkInLoading] = useState(false);

  // Load data for Quick Book modal
  const loadQuickBookData = async () => {
    try {
      const [servicesResponse, staffResponse] = await Promise.all([
        fetch('/api/salon/services', { headers: { 'x-tenant-id': 'bella-salon' } }),
        fetch('/api/staff/staff', { headers: { 'x-tenant-id': 'bella-salon' } })
      ]);
      
      const servicesData = await servicesResponse.json();
      const staffData = await staffResponse.json();
      
      if (servicesData.success) {
        setAvailableServices(servicesData.data);
      }
      if (staffData.success) {
        setAvailableStaff(staffData.data);
      }
    } catch (error) {
      console.error('Error loading Quick Book data:', error);
    }
  };

  // Quick Book handlers
  const handleOpenQuickBook = async () => {
    await loadQuickBookData();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setQuickBookData(prev => ({ ...prev, date: today }));
    setShowQuickBookModal(true);
  };

  const handleQuickBookSubmit = async () => {
    if (!quickBookData.customerName || !quickBookData.service || !quickBookData.staff || !quickBookData.date || !quickBookData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setQuickBookLoading(true);
    try {
      // Convert time to 24-hour format
      let timeString = quickBookData.time;
      if (timeString.includes(' AM') || timeString.includes(' PM')) {
        const [timePart, ampm] = timeString.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour24 = parseInt(hours);
        
        if (ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }

      const scheduled_at = new Date(`${quickBookData.date}T${timeString}:00`).toISOString();
      
      const response = await fetch('/api/salon/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({
          customer_name: quickBookData.customerName,
          customer_phone: quickBookData.phone,
          customer_email: quickBookData.email,
          service_id: quickBookData.service,
          staff_id: quickBookData.staff,
          scheduled_at: scheduled_at,
          duration_minutes: 60, // Default duration
          amount: 0, // Will be calculated from service
          currency: 'INR',
          notes: quickBookData.notes,
          payment_status: 'pending'
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Appointment booked successfully!');
        setShowQuickBookModal(false);
        setQuickBookData({
          customerName: '',
          phone: '',
          email: '',
          service: '',
          staff: '',
          date: '',
          time: '',
          notes: ''
        });
        // Refresh appointments data
        window.location.reload();
      } else {
        alert('Failed to book appointment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setQuickBookLoading(false);
    }
  };

  // Load Daily Summary data
  const loadDailySummaryData = async () => {
    setDailySummaryLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      const result = await response.json();
      
      if (result.success) {
        const appointments = result.data;
        const totalAppointments = appointments.length;
        const completedAppointments = appointments.filter(apt => apt.payment_status === 'completed').length;
        const pendingAppointments = appointments.filter(apt => apt.payment_status === 'pending').length;
        const totalRevenue = appointments.reduce((sum, apt) => {
          const amount = parseFloat(apt.amount) || 0;
          return sum + amount;
        }, 0);
        
        // Calculate top services
        const serviceCounts = {};
        appointments.forEach(apt => {
          if (apt.service_name) {
            serviceCounts[apt.service_name] = (serviceCounts[apt.service_name] || 0) + 1;
          }
        });
        const topServices = Object.entries(serviceCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([service, count]) => ({ service, count }));
        
        // Calculate staff performance
        const staffCounts = {};
        appointments.forEach(apt => {
          if (apt.staff_name) {
            staffCounts[apt.staff_name] = (staffCounts[apt.staff_name] || 0) + 1;
          }
        });
        const staffPerformance = Object.entries(staffCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([staff, count]) => ({ staff, count }));
        
        setDailySummaryData({
          appointments: totalAppointments,
          revenue: totalRevenue,
          completedAppointments,
          pendingAppointments,
          topServices,
          staffPerformance
        });
      }
    } catch (error) {
      console.error('Error loading daily summary:', error);
    } finally {
      setDailySummaryLoading(false);
    }
  };

  // Load Check In data
  const loadCheckInData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      const result = await response.json();
      
      if (result.success) {
        // Filter for pending appointments that can be checked in
        const pendingAppointments = result.data.filter(apt => 
          apt.payment_status === 'pending' || apt.payment_status === 'confirmed'
        );
        setAvailableAppointments(pendingAppointments);
      }
    } catch (error) {
      console.error('Error loading check-in appointments:', error);
    }
  };

  // Check In handlers
  const handleOpenCheckIn = async () => {
    await loadCheckInData();
    setShowCheckInModal(true);
  };

  const handleCheckInSubmit = async () => {
    if (!checkInData.appointmentId) {
      alert('Please select an appointment to check in');
      return;
    }

    setCheckInLoading(true);
    try {
      // First, get the current appointment data to preserve all fields
      const appointmentResponse = await fetch(`/api/salon/appointments/${checkInData.appointmentId}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      const appointmentResult = await appointmentResponse.json();
      
      if (!appointmentResult.success || !appointmentResult.data) {
        alert('Failed to load appointment data');
        return;
      }

      const appointment = appointmentResult.data;
      
      // Update appointment status to checked-in while preserving all existing data
      const response = await fetch(`/api/salon/appointments/${checkInData.appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          customer_email: appointment.customer_email,
          service_id: appointment.offering_id,
          staff_id: appointment.staff_id,
          scheduled_at: appointment.scheduled_at,
          duration_minutes: appointment.duration_minutes,
          amount: appointment.amount,
          currency: appointment.currency,
          payment_status: 'checked-in',
          notes: `${appointment.notes || ''}\nCheck-in Notes: ${checkInData.checkInNotes}\nSpecial Requests: ${checkInData.specialRequests}`.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Customer checked in successfully!');
        setShowCheckInModal(false);
        setCheckInData({
          appointmentId: '',
          checkInNotes: '',
          specialRequests: ''
        });
        // Refresh appointments data
        window.location.reload();
      } else {
        alert('Failed to check in customer: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error checking in customer:', error);
      alert('Failed to check in customer. Please try again.');
    } finally {
      setCheckInLoading(false);
    }
  };
  // Load Process Payment data
  const loadPaymentData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      const result = await response.json();
      
      if (result.success) {
        // Filter for appointments that need payment
        const pendingAppointments = result.data.filter(apt => 
          apt.payment_status === 'pending' || apt.payment_status === 'checked-in'
        );
        setPaymentAppointments(pendingAppointments);
      }
    } catch (error) {
      console.error('Error loading payment appointments:', error);
    }
  };

  // Process Payment handlers
  const handleOpenProcessPayment = async () => {
    await loadPaymentData();
    setShowProcessPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentData.appointmentId || !paymentData.amount) {
      alert('Please select an appointment and enter amount');
      return;
    }

    setPaymentLoading(true);
    try {
      // First, get the current appointment data to preserve all fields
      const appointmentResponse = await fetch(`/api/salon/appointments/${paymentData.appointmentId}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      const appointmentResult = await appointmentResponse.json();
      
      if (!appointmentResult.success || !appointmentResult.data) {
        alert('Failed to load appointment data');
        return;
      }

      const appointment = appointmentResult.data;
      const totalAmount = parseFloat(paymentData.amount) + parseFloat(paymentData.tip || 0);
      
      const response = await fetch(`/api/salon/appointments/${paymentData.appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({
          customer_name: appointment.customer_name,
          customer_phone: appointment.customer_phone,
          customer_email: appointment.customer_email,
          service_id: appointment.offering_id,
          staff_id: appointment.staff_id,
          scheduled_at: appointment.scheduled_at,
          duration_minutes: appointment.duration_minutes,
          amount: totalAmount,
          currency: appointment.currency,
          payment_status: 'completed',
          notes: `${appointment.notes || ''}\nPayment processed via ${paymentData.paymentMethod}. Amount: ₹${paymentData.amount}, Tip: ₹${paymentData.tip || 0}`
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Payment processed successfully!');
        setShowProcessPaymentModal(false);
        setPaymentData({
          appointmentId: '',
          amount: '',
          tip: '',
          paymentMethod: 'cash'
        });
        // Refresh appointments data
        window.location.reload();
      } else {
        alert('Failed to process payment: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };
  // Load Send Reminders data
  const loadReminderData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let appointmentsResponse;
      if (reminderData.reminderType === 'tomorrow') {
        appointmentsResponse = await fetch(`/api/salon/appointments?date=${tomorrow}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      } else if (reminderData.reminderType === 'today') {
        appointmentsResponse = await fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      } else if (reminderData.reminderType === 'week') {
        // Get appointments for the next 7 days
        appointmentsResponse = await fetch(`/api/salon/appointments?date=${today}&days=7`, { headers: { 'x-tenant-id': 'bella-salon' } });
      } else {
        appointmentsResponse = await fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } });
      }
      
      const result = await appointmentsResponse.json();
      if (result.success) {
        setReminderAppointments(result.data);
      }
    } catch (error) {
      console.error('Error loading reminder appointments:', error);
    }
  };

  // Send Reminders handlers
  const handleOpenSendReminders = async () => {
    await loadReminderData();
    setShowSendRemindersModal(true);
  };

  const handleSendRemindersSubmit = async () => {
    if (reminderAppointments.length === 0) {
      alert('No appointments found for the selected period');
      return;
    }

    setReminderLoading(true);
    try {
      // Create reminder messages
      const reminderMessages = reminderAppointments.map(appointment => {
        const time = appointment.scheduled_at ? 
          new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          }) : 'N/A';
        
        const defaultMessage = `Hi ${appointment.customer_name || 'Customer'}, this is a reminder about your appointment ${reminderData.reminderType === 'tomorrow' ? 'tomorrow' : 'today'} at ${time} for ${appointment.service_name || 'service'} with ${appointment.staff_name || 'our staff'}. See you soon! - Bella Salon`;
        
        return {
          appointmentId: appointment.id,
          customerPhone: appointment.customer_phone,
          message: reminderData.customMessage || defaultMessage
        };
      });

      // Send reminders (simulate API call for now)
      let successCount = 0;
      for (const reminder of reminderMessages) {
        try {
          // In a real implementation, this would call a WhatsApp/SMS API
          console.log(`Sending reminder to ${reminder.customerPhone}: ${reminder.message}`);
          successCount++;
        } catch (error) {
          console.error('Failed to send reminder:', error);
        }
      }

      alert(`Successfully sent ${successCount} out of ${reminderMessages.length} reminders!`);
      setShowSendRemindersModal(false);
      setReminderData({
        reminderType: 'tomorrow',
        customMessage: '',
        selectedAppointments: []
      });
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Failed to send reminders. Please try again.');
    } finally {
      setReminderLoading(false);
    }
  };
  // Load View Schedule data
  const loadScheduleData = async () => {
    setScheduleLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [staffResponse, appointmentsResponse] = await Promise.all([
        fetch('/api/staff/staff', { headers: { 'x-tenant-id': 'bella-salon' } }),
        fetch(`/api/salon/appointments?date=${today}`, { headers: { 'x-tenant-id': 'bella-salon' } })
      ]);
      
      const staffResult = await staffResponse.json();
      const appointmentsResult = await appointmentsResponse.json();
      
      if (staffResult.success && appointmentsResult.success) {
        const staff = staffResult.data;
        const appointments = appointmentsResult.data;
        
        // Create staff schedule data
        const staffSchedules = staff.map(staffMember => {
          const staffAppointments = appointments.filter(apt => apt.staff_id === staffMember.id);
          return {
            ...staffMember,
            appointments: staffAppointments.map(apt => ({
              id: apt.id,
              customer_name: apt.customer_name,
              service_name: apt.service_name,
              time: apt.scheduled_at ? 
                new Date(apt.scheduled_at).toLocaleTimeString('en-IN', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                }) : 'N/A',
              status: apt.payment_status
            }))
          };
        });
        
        setScheduleData({
          staffSchedules,
          appointments
        });
      }
    } catch (error) {
      console.error('Error loading schedule data:', error);
    } finally {
      setScheduleLoading(false);
    }
  };

  // View Schedule handlers
  const handleOpenViewSchedule = async () => {
    await loadScheduleData();
    setShowViewScheduleModal(true);
  };
  // Load Walk-in data
  const loadWalkInData = async () => {
    try {
      const [servicesResponse, staffResponse] = await Promise.all([
        fetch('/api/salon/services', { headers: { 'x-tenant-id': 'bella-salon' } }),
        fetch('/api/staff/staff', { headers: { 'x-tenant-id': 'bella-salon' } })
      ]);
      
      const servicesResult = await servicesResponse.json();
      const staffResult = await staffResponse.json();
      
      if (servicesResult.success) {
        setWalkInServices(servicesResult.data);
      }
      if (staffResult.success) {
        setWalkInStaff(staffResult.data);
      }
    } catch (error) {
      console.error('Error loading walk-in data:', error);
    }
  };

  // Walk-in handlers
  const handleOpenWalkIn = async () => {
    await loadWalkInData();
    // Set default time to current time + 15 minutes
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    const defaultTime = now.toLocaleTimeString('en-IN', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
    
    setWalkInData(prev => ({
      ...prev,
      time: defaultTime
    }));
    setShowWalkInModal(true);
  };

  const handleWalkInSubmit = async () => {
    if (!walkInData.customerName || !walkInData.service || !walkInData.staff || !walkInData.time) {
      alert('Please fill in all required fields');
      return;
    }

    setWalkInLoading(true);
    try {
      // Convert time to 24-hour format
      let timeString = walkInData.time;
      if (timeString.includes(' AM') || timeString.includes(' PM')) {
        const [timePart, ampm] = timeString.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour24 = parseInt(hours);
        
        if (ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }

      const today = new Date().toISOString().split('T')[0];
      const scheduled_at = new Date(`${today}T${timeString}:00`).toISOString();
      
      const response = await fetch('/api/salon/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        },
        body: JSON.stringify({
          customer_name: walkInData.customerName,
          customer_phone: walkInData.phone,
          customer_email: walkInData.email,
          service_id: walkInData.service,
          staff_id: walkInData.staff,
          scheduled_at: scheduled_at,
          duration_minutes: 60, // Default duration
          amount: 0, // Will be calculated from service
          currency: 'INR',
          notes: `Walk-in customer: ${walkInData.notes}`,
          payment_status: 'pending'
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Walk-in customer registered successfully!');
        setShowWalkInModal(false);
        setWalkInData({
          customerName: '',
          phone: '',
          email: '',
          service: '',
          staff: '',
          time: '',
          notes: ''
        });
        // Refresh appointments data
        window.location.reload();
      } else {
        alert('Failed to register walk-in customer: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error registering walk-in customer:', error);
      alert('Failed to register walk-in customer. Please try again.');
    } finally {
      setWalkInLoading(false);
    }
  };
  const handleOpenDailySummary = async () => {
    await loadDailySummaryData();
    setShowDailySummaryModal(true);
  };

  const getCurrentSectionName = () => {
    const sectionNames = {
      overview: "Overview",
      services: "Services", 
      staff: "Staff",
      calendar: "Calendar",
      payments: "Payments",
      customers: "Customers",
      promotions: "Promotions",
      settings: "Settings"
    };
    return sectionNames[activeSection] || "Overview";
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Helper function to convert 12-hour format to 24-hour format
  const convertTo24HourFormat = (timeString) => {
    if (!timeString) return "10:00";
    
    // If already in 24-hour format (HH:mm), return as is
    if (/^\d{1,2}:\d{2}$/.test(timeString) && !timeString.includes('AM') && !timeString.includes('PM')) {
      return timeString;
    }
    
    // Convert 12-hour format to 24-hour format
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  // Cancel appointment handler - just opens the modal
  const handleCancelAppointment = (appointment) => {
    if (!appointment) return;
    setCancellingAppointment(appointment);
    setShowCancelModal(true);
  };

  // Actual cancellation function - called from the modal
  const confirmCancelAppointment = async () => {
    if (!cancellingAppointment) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/salon/appointments/${cancellingAppointment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'bella-salon'
        }
      });

      if (response.ok) {
        // Remove the cancelled appointment from the appointments list
        setAppointments(prev => prev.filter(apt => apt.id !== cancellingAppointment.id));
        
        // Reload today's appointments for staff schedule
        loadTodaysAppointments();
        
        console.log('Appointment cancelled successfully');
        
        // Close modal and reset state
        setShowCancelModal(false);
        setCancellingAppointment(null);
        
        // Show success message (you can replace this with a toast notification later)
        alert('Appointment cancelled successfully!');
      } else {
        console.error('Failed to cancel appointment:', response.statusText);
        alert('Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Error cancelling appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Edit appointment handlers
  const handleEditAppointment = async (appointment) => {
    setEditingAppointment(appointment);
    
    // Load staff and services data for dropdowns
    try {
      const [staffResponse, servicesResponse] = await Promise.all([
        fetch('/api/staff/staff', {
          headers: { 'x-tenant-id': 'bella-salon' }
        }),
        fetch('/api/salon/services', {
          headers: { 'x-tenant-id': 'bella-salon' }
        })
      ]);
      
      const staffResult = await staffResponse.json();
      const servicesResult = await servicesResponse.json();
      
      if (staffResult.success) {
        setStaff(staffResult.data);
      }
      if (servicesResult.success) {
        setServices(servicesResult.data);
        
        // Now that services are loaded, find the service ID
        let serviceId = appointment.offering_id || appointment.service_id || "";
        if (!serviceId && appointment.service_name) {
          const matchingService = servicesResult.data.find(s => s.name === appointment.service_name);
          if (matchingService) {
            serviceId = matchingService.id;
            console.log('🔍 Found service ID by name:', { serviceName: appointment.service_name, serviceId });
          }
        }
        
        // Extract time from scheduled_at if time field is not available or in wrong format
        let timeValue = appointment.time || "";
        console.log('🕐 Initial time extraction:', {
          appointmentTime: appointment.time,
          scheduled_at: appointment.scheduled_at,
          appointmentTime_field: appointment.appointmentTime,
          appointment_time_field: appointment.appointment_time,
          timeValue
        });
        
        // First, try to extract from scheduled_at (most reliable)
        if (!timeValue && appointment.scheduled_at) {
          try {
            const date = new Date(appointment.scheduled_at);
            if (!isNaN(date.getTime())) {
              // Convert to 24-hour format for HTML time input
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              timeValue = `${hours}:${minutes}`;
              console.log('🕐 Extracted time from scheduled_at (24-hour):', timeValue);
            } else {
              console.warn('⚠️ Invalid scheduled_at date:', appointment.scheduled_at);
            }
          } catch (error) {
            console.error('❌ Error parsing scheduled_at:', error);
          }
        }
        
        // If still no time, try to extract from other fields
        if (!timeValue) {
          if (appointment.appointmentTime) {
            // Convert 12-hour format to 24-hour format if needed
            timeValue = convertTo24HourFormat(appointment.appointmentTime);
            console.log('🕐 Using appointmentTime (converted):', timeValue);
          } else if (appointment.appointment_time) {
            // Convert 12-hour format to 24-hour format if needed
            timeValue = convertTo24HourFormat(appointment.appointment_time);
            console.log('🕐 Using appointment_time (converted):', timeValue);
          }
        }
        
        // Final fallback - if still no time, use a reasonable default
        if (!timeValue) {
          timeValue = "10:00";
          console.log('🕐 Using default time:', timeValue);
        }
        
        // Find staff ID (this should already be correct)
        let staffId = appointment.staff_id || "";
        console.log('🔍 Staff ID from appointment:', staffId);
        
        // Set the edit appointment data
        const editData = {
          customerName: appointment.customer_name || appointment.customer || "",
          phone: appointment.customer_phone || appointment.phone || "",
          email: appointment.customer_email || appointment.email || "",
          service: serviceId,
          staffMember: staffId,
          date: appointment.scheduled_at ? new Date(appointment.scheduled_at).toISOString().split('T')[0] : "",
          time: timeValue || "10:00", // Default time if none found (24-hour format)
          status: appointment.payment_status || appointment.status || "confirmed",
          notes: appointment.notes || ""
        };
        
        console.log('🔍 Final edit data being set:', {
          originalAppointment: appointment,
          extractedTime: timeValue,
          finalEditData: editData
        });
        
        console.log('🔍 Setting edit appointment data:', editData);
        setEditAppointment(editData);
      }
    } catch (error) {
      console.error('Error loading data for edit modal:', error);
    }
    setShowEditAppointmentModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditAppointmentModal(false);
    setEditingAppointment(null);
    setEditAppointment({
      customerName: "",
      phone: "",
      email: "",
      service: "",
      staffMember: "",
      date: "",
      time: "",
      status: "confirmed",
      notes: ""
    });
  };

  const handleSaveEditAppointment = async () => {
    if (!editingAppointment) return;
    
    setLoading(true);
    try {
      // Validate required fields
      if (!editAppointment.service) {
        alert('Please select a service');
        return;
      }
      
      if (!editAppointment.staffMember) {
        alert('Please select a staff member');
        return;
      }

      // Parse time properly - convert from 12-hour format to 24-hour format
      let timeString = editAppointment.time;
      if (timeString.includes(' AM') || timeString.includes(' PM')) {
        // Convert 12-hour format to 24-hour format for API
        const [timePart, ampm] = timeString.split(' ');
        const [hours, minutes] = timePart.split(':');
        let hour24 = parseInt(hours);
        
        if (ampm === 'PM' && hour24 !== 12) {
          hour24 += 12;
        } else if (ampm === 'AM' && hour24 === 12) {
          hour24 = 0;
        }
        
        timeString = `${hour24.toString().padStart(2, '0')}:${minutes}`;
      }
      
      // Find service and staff details for duration and price
      const selectedService = services.find(s => s.id === editAppointment.service);
      const selectedStaff = staff.find(s => s.id === editAppointment.staffMember);
      
      // Create appointment data for API
      const appointmentData = {
        customer_name: editAppointment.customerName,
        customer_phone: editAppointment.phone,
        customer_email: editAppointment.email,
        service_id: editAppointment.service,
        staff_id: editAppointment.staffMember,
        scheduled_at: (() => {
          try {
            const dateTimeString = `${editAppointment.date}T${timeString}:00`;
            console.log('🕐 Creating scheduled_at:', dateTimeString);
            const date = new Date(dateTimeString);
            if (isNaN(date.getTime())) {
              throw new Error('Invalid date/time combination');
            }
            return date.toISOString();
          } catch (error) {
            console.error('❌ Error creating scheduled_at:', error);
            throw new Error('Invalid time format. Please enter a valid time.');
          }
        })(),
        duration_minutes: selectedService?.duration_minutes || 60,
        amount: selectedService?.base_price || 0,
        currency: 'INR',
        payment_status: editAppointment.status,
        notes: editAppointment.notes
      };

      console.log('💾 Saving edited appointment:', appointmentData);

      // Update appointment via API
      const response = await fetch(`/api/salon/appointments/${editingAppointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'bella-salon' },
        body: JSON.stringify(appointmentData)
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      const updatedAppointment = await response.json();
      console.log('✅ Appointment updated successfully:', updatedAppointment);

      // Refresh appointments data
      const [appointmentsData, servicesData, staffData] = await Promise.all([
        salonApi.appointments.getAll(),
        salonApi.services.getAll(),
        staffApi.getAll()
      ]);
      
      // Transform and enhance appointments
      const transformedBookings = transformApiBookingsToUI(appointmentsData);
      const enhancedAppointments = transformedBookings.map(apt => {
        const appointmentDateTime = new Date(apt.scheduled_at || '');
        const timeString = formatTime(apt.appointmentTime || '') || appointmentDateTime.toLocaleTimeString('en-IN', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        });
        
        return {
          ...apt,
          customer: apt.customer_name,
          service: apt.service_name || apt.service || 'Service',
          staff: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned',
          duration: apt.duration_minutes || apt.duration || 60,
          time: timeString,
          status: apt.payment_status || apt.status || 'confirmed',
          amount: parseFloat(apt.amount || 0),
          customer_name: apt.customer_name,
          service_name: apt.service_name || 'Service',
          staff_name: staffData.find(s => s.id === apt.staff_id)?.name || staffData.find(s => s.name === 'Priya Sharma')?.name || 'Unassigned',
          duration_minutes: apt.duration_minutes || apt.duration || 60,
          phone: apt.customer_phone,
          email: apt.customer_email
        };
      });
      
      setAppointments(enhancedAppointments);
      
      // Reload today's appointments for staff schedule
      loadTodaysAppointments();
      
      // Close modal
      handleCloseEditModal();
      alert('Appointment updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      alert('Failed to update appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection 
          onEditAppointment={handleEditAppointment}
          onCancelAppointment={handleCancelAppointment}
          onOpenQuickBook={handleOpenQuickBook}
          onOpenCheckIn={handleOpenCheckIn}
          onOpenProcessPayment={handleOpenProcessPayment}
          onOpenSendReminders={handleOpenSendReminders}
          onOpenViewSchedule={handleOpenViewSchedule}
          onOpenWalkIn={handleOpenWalkIn}
          onOpenDailySummary={handleOpenDailySummary}
        />;
      case "services":
        return <ServicesSection />;
      case "staff":
        return <StaffSection 
          todaysAppointments={todaysAppointments}
          setTodaysAppointments={setTodaysAppointments}
          scheduleLoading={scheduleLoading}
          loadTodaysAppointments={loadTodaysAppointments}
        />;
      case "calendar":
        return <CalendarSection 
          loadTodaysAppointments={loadTodaysAppointments}
        />;
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
        {!sidebarCollapsed && (
          <div className="w-64 transition-all duration-300">
            <Sidebar>
              <SidebarContent className="p-6">
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel className="text-lg font-bold mb-6 px-0">Bella Salon</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-3">
                      {menuItems.map((item) => (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activeSection === item.id}
                            onClick={() => setActiveSection(item.id)}
                            size="lg"
                            className="h-14 px-4 py-4 gap-4 text-base font-semibold"
                          >
                            <item.icon className="h-6 w-6" />
                            <span>{item.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
          </div>
        )}
        
        <main className="flex-1 overflow-hidden">
          <Header 
            currentSection={getCurrentSectionName()} 
            onSidebarToggle={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
          />
          <div className="h-[calc(100vh-4rem)] overflow-auto p-6">
            {renderSection()}
          </div>
        </main>
      </div>
      
      {/* Edit Appointment Modal */}
      {showEditAppointmentModal && editingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Edit Appointment</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCloseEditModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Original Appointment Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Original Appointment</h4>
              <p className="text-sm text-gray-600">
                {editingAppointment.customer_name || editingAppointment.customer} - {editingAppointment.service_name || editingAppointment.service}
              </p>
              <p className="text-sm text-gray-600">
                {editingAppointment.scheduled_at ? new Date(editingAppointment.scheduled_at).toLocaleDateString('en-IN') : ''} at {editingAppointment.time} with {editingAppointment.staff_name || editingAppointment.staff}
              </p>
            </div>

            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  value={editAppointment.customerName}
                  onChange={(e) => setEditAppointment({...editAppointment, customerName: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={editAppointment.phone}
                  onChange={(e) => setEditAppointment({...editAppointment, phone: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editAppointment.email}
                  onChange={(e) => setEditAppointment({...editAppointment, email: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter email address"
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium mb-2">Service *</label>
                <select
                  value={editAppointment.service}
                  onChange={(e) => setEditAppointment({...editAppointment, service: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - ₹{service.base_price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium mb-2">Staff Member</label>
                <select
                  value={editAppointment.staffMember}
                  onChange={(e) => setEditAppointment({...editAppointment, staffMember: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="">Select a staff member</option>
                  {staff.map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.name} - {staffMember.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <input
                    type="date"
                    value={editAppointment.date}
                    onChange={(e) => setEditAppointment({...editAppointment, date: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <input
                    type="time"
                    value={editAppointment.time}
                    onChange={(e) => setEditAppointment({...editAppointment, time: e.target.value})}
                    className="w-full p-3 border border-input rounded-md bg-background"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={editAppointment.status}
                  onChange={(e) => setEditAppointment({...editAppointment, status: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any special requirements or notes"
                  value={editAppointment.notes}
                  onChange={(e) => setEditAppointment({...editAppointment, notes: e.target.value})}
                  className="w-full p-3 border border-input rounded-md bg-background"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={handleCloseEditModal}>
                Cancel
              </Button>
              <Button onClick={handleSaveEditAppointment} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Modals */}
      
      {/* Quick Book Modal */}
      {showQuickBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Quick Booking</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowQuickBookModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter customer name"
                  value={quickBookData.customerName}
                  onChange={(e) => setQuickBookData(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Customer phone number"
                  value={quickBookData.phone}
                  onChange={(e) => setQuickBookData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Customer email"
                  value={quickBookData.email}
                  onChange={(e) => setQuickBookData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium mb-2">Service *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={quickBookData.service}
                    onChange={(e) => setQuickBookData(prev => ({ ...prev, service: e.target.value }))}
                  >
                    <option value="">Select service</option>
                    {availableServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ₹{service.base_price}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Staff Member */}
              <div>
                <label className="block text-sm font-medium mb-2">Staff Member *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={quickBookData.staff}
                    onChange={(e) => setQuickBookData(prev => ({ ...prev, staff: e.target.value }))}
                  >
                    <option value="">Select staff</option>
                    {availableStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full p-3 border border-input rounded-md bg-background"
                      value={quickBookData.date}
                      onChange={(e) => setQuickBookData(prev => ({ ...prev, date: e.target.value }))}
                    />
                    <Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time *</label>
                  <div className="relative">
                    <input
                      type="time"
                      className="w-full p-3 border border-input rounded-md bg-background pr-10"
                      value={quickBookData.time}
                      onChange={(e) => setQuickBookData(prev => ({ ...prev, time: e.target.value }))}
                    />
                    <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Any special requests or notes"
                  value={quickBookData.notes}
                  onChange={(e) => setQuickBookData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowQuickBookModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickBookSubmit} disabled={quickBookLoading}>
                {quickBookLoading ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Customer Check-in</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCheckInModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Select Appointment */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Appointment *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={checkInData.appointmentId}
                    onChange={(e) => setCheckInData(prev => ({ ...prev, appointmentId: e.target.value }))}
                  >
                    <option value="">Select appointment to check in</option>
                    {availableAppointments.map((appointment) => {
                      const time = appointment.scheduled_at ? 
                        new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        }) : 'N/A';
                      return (
                        <option key={appointment.id} value={appointment.id}>
                          {appointment.customer_name || 'Unknown'} - {appointment.service_name || 'Service'} - {time}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Check-in Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Check-in Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Any additional notes about the customer's arrival"
                  value={checkInData.checkInNotes}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, checkInNotes: e.target.value }))}
                />
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium mb-2">Special Requests</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Any special requests or preferences"
                  value={checkInData.specialRequests}
                  onChange={(e) => setCheckInData(prev => ({ ...prev, specialRequests: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowCheckInModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCheckInSubmit} disabled={checkInLoading}>
                {checkInLoading ? 'Checking In...' : 'Check In Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Process Payment Modal */}
      {showProcessPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Process Payment</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowProcessPaymentModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Select Appointment */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Appointment *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={paymentData.appointmentId}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, appointmentId: e.target.value }))}
                  >
                    <option value="">Select appointment for payment</option>
                    {paymentAppointments.map((appointment) => {
                      const time = appointment.scheduled_at ? 
                        new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        }) : 'N/A';
                      return (
                        <option key={appointment.id} value={appointment.id}>
                          {appointment.customer_name || 'Unknown'} - {appointment.service_name || 'Service'} - ₹{appointment.amount || 0}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter amount"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              {/* Tip */}
              <div>
                <label className="block text-sm font-medium mb-2">Tip</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter tip amount"
                  value={paymentData.tip}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, tip: e.target.value }))}
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Credit Card</option>
                    <option value="upi">UPI</option>
                    <option value="netbanking">Net Banking</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Payment Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Service Amount:</span>
                    <span>₹{paymentData.amount || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tip:</span>
                    <span>₹{paymentData.tip || '0.00'}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>₹{(parseFloat(paymentData.amount || 0) + parseFloat(paymentData.tip || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowProcessPaymentModal(false)}>
                Cancel
              </Button>
              <Button onClick={handlePaymentSubmit} disabled={paymentLoading}>
                {paymentLoading ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Send Reminders Modal */}
      {showSendRemindersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Send Reminders</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSendRemindersModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Reminder Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Reminder Type *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={reminderData.reminderType}
                    onChange={(e) => setReminderData(prev => ({ ...prev, reminderType: e.target.value }))}
                  >
                    <option value="tomorrow">All Tomorrow's Appointments</option>
                    <option value="today">Today's Appointments</option>
                    <option value="week">This Week's Appointments</option>
                    <option value="custom">Custom Selection</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Appointment Count */}
              {reminderAppointments.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    Found {reminderAppointments.length} appointment{reminderAppointments.length !== 1 ? 's' : ''} for {reminderData.reminderType === 'tomorrow' ? 'tomorrow' : reminderData.reminderType === 'today' ? 'today' : 'this week'}
                  </p>
                </div>
              )}

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium mb-2">Custom Message (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Add a custom message to the reminder (optional)"
                  value={reminderData.customMessage}
                  onChange={(e) => setReminderData(prev => ({ ...prev, customMessage: e.target.value }))}
                />
              </div>

              {/* Preview */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-blue-800">Preview:</h4>
                <p className="text-sm text-blue-700">
                  {reminderData.customMessage || 
                    `"Hi [Customer Name], this is a reminder about your appointment ${reminderData.reminderType === 'tomorrow' ? 'tomorrow' : 'today'} at [Time] for [Service] with [Staff]. See you soon! - Bella Salon"`
                  }
                </p>
              </div>

              {/* Appointments List */}
              {reminderAppointments.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Appointments to Remind:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {reminderAppointments.map((appointment) => {
                      const time = appointment.scheduled_at ? 
                        new Date(appointment.scheduled_at).toLocaleTimeString('en-IN', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        }) : 'N/A';
                      return (
                        <div key={appointment.id} className="text-xs bg-gray-50 rounded p-2">
                          {appointment.customer_name} - {appointment.service_name} - {time}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowSendRemindersModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendRemindersSubmit} disabled={reminderLoading || reminderAppointments.length === 0}>
                {reminderLoading ? 'Sending...' : `Send ${reminderAppointments.length} Reminders`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Schedule Modal */}
      {showViewScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Staff Schedule Overview</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowViewScheduleModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {scheduleLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading staff schedules...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {scheduleData.staffSchedules.map((staff, index) => (
                  <div key={staff.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3">{staff.name}</h4>
                    <div className="space-y-2">
                      {staff.appointments.length > 0 ? (
                        staff.appointments.map((appointment) => {
                          const statusColor = appointment.status === 'completed' ? 'bg-green-500' : 
                                            appointment.status === 'checked-in' ? 'bg-blue-500' : 
                                            'bg-orange-500';
                          return (
                            <div key={appointment.id} className="flex items-center gap-2">
                              <div className={`w-2 h-2 ${statusColor} rounded-full`}></div>
                              <span className="text-sm">
                                {appointment.time} - {appointment.customer_name} ({appointment.service_name})
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-sm text-gray-500">No appointments today</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowViewScheduleModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Walk-in Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Walk-in Customer</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowWalkInModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-gray-600 mb-6">Quickly register a walk-in customer and check availability.</p>
            
            <div className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Name *</label>
                <input
                  type="text"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter customer name"
                  value={walkInData.customerName}
                  onChange={(e) => setWalkInData(prev => ({ ...prev, customerName: e.target.value }))}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter phone number"
                  value={walkInData.phone}
                  onChange={(e) => setWalkInData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Enter email address"
                  value={walkInData.email}
                  onChange={(e) => setWalkInData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium mb-2">Service *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={walkInData.service}
                    onChange={(e) => setWalkInData(prev => ({ ...prev, service: e.target.value }))}
                  >
                    <option value="">Select service</option>
                    {walkInServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ₹{service.base_price}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Staff */}
              <div>
                <label className="block text-sm font-medium mb-2">Assign Staff *</label>
                <div className="relative">
                  <select 
                    className="w-full p-3 border border-input rounded-md bg-background appearance-none"
                    value={walkInData.staff}
                    onChange={(e) => setWalkInData(prev => ({ ...prev, staff: e.target.value }))}
                  >
                    <option value="">Select staff member</option>
                    {walkInStaff.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} - {staff.role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Time *</label>
                <input
                  type="time"
                  className="w-full p-3 border border-input rounded-md bg-background"
                  value={walkInData.time}
                  onChange={(e) => setWalkInData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-input rounded-md bg-background"
                  placeholder="Any additional notes or special requests"
                  value={walkInData.notes}
                  onChange={(e) => setWalkInData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowWalkInModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleWalkInSubmit} disabled={walkInLoading}>
                {walkInLoading ? 'Registering...' : 'Register Walk-in'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Summary Modal */}
      {showDailySummaryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Daily Summary</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowDailySummaryModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {dailySummaryLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-500">Loading daily summary...</div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-900">{dailySummaryData.appointments}</div>
                    <div className="text-sm text-gray-600">Total Appointments</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-gray-900">₹{dailySummaryData.revenue.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{dailySummaryData.completedAppointments}</div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{dailySummaryData.pendingAppointments}</div>
                    <div className="text-sm text-yellow-600">Pending</div>
                  </div>
                </div>

                {dailySummaryData.topServices.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Top Services Today</h4>
                    <div className="space-y-2">
                      {dailySummaryData.topServices.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <span className="font-medium">{item.service}</span>
                          <span className="text-sm text-gray-600">{item.count} appointments</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dailySummaryData.staffPerformance.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Staff Performance</h4>
                    <div className="space-y-2">
                      {dailySummaryData.staffPerformance.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                          <span className="font-medium">{item.staff}</span>
                          <span className="text-sm text-gray-600">{item.count} appointments</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex justify-center">
              <Button onClick={() => setShowDailySummaryModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && cancellingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Cancel Appointment
              </h3>
              <Button variant="ghost" size="sm" onClick={() => {
                setShowCancelModal(false);
                setCancellingAppointment(null);
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel the appointment for <strong>{cancellingAppointment.customer_name || cancellingAppointment.customer} at {cancellingAppointment.appointment_time || cancellingAppointment.time}</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This action cannot be undone. The customer will be notified about the cancellation.
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingAppointment(null);
                }} 
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmCancelAppointment}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? 'Cancelling...' : 'Cancel Appointment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}
// Force deployment Tue Sep 30 16:11:16 IST 2025
// Force deployment 1759229037
