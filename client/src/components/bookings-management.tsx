import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Search, Calendar, Clock, Phone, User, Filter, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Booking, Service } from "@shared/schema";

export function BookingsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      apiRequest(`/api/bookings/${bookingId}`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });

  const filteredBookings = bookings?.filter(booking => {
    const matchesSearch = booking.phoneNumber.includes(searchQuery) || 
                         (booking.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesService = serviceFilter === "all" || booking.serviceId === serviceFilter;
    
    return matchesSearch && matchesStatus && matchesService;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getServiceName = (serviceId: string) => {
    const service = services?.find(s => s.id === serviceId);
    return service?.name || serviceId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    return timeString || 'N/A';
  };

  const formatAppointmentDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <Card data-testid="bookings-management">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Bookings Management
          </CardTitle>
          <Badge variant="secondary" data-testid="total-bookings-count">
            {filteredBookings.length} bookings
          </Badge>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-bookings"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-40" data-testid="select-service-filter">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services?.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {bookingsLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="h-6 bg-muted rounded w-32"></div>
                  <div className="h-6 bg-muted rounded w-20"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors" data-testid={`booking-item-${booking.id}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {booking.customerName || booking.phoneNumber}
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    ₹{booking.amount}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{getServiceName(booking.serviceId)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.phoneNumber}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatAppointmentDate(booking.appointmentDate?.toString() || null)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(booking.appointmentTime)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Booked: {formatDate(booking.createdAt.toString())}
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                        disabled={updateBookingMutation.isPending}
                        data-testid={`button-confirm-${booking.id}`}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateBookingMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                        disabled={updateBookingMutation.isPending}
                        data-testid={`button-cancel-${booking.id}`}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  
                  {booking.status === 'confirmed' && booking.paymentMethod && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Paid via {booking.paymentMethod}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No bookings found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all" || serviceFilter !== "all" 
                ? "Try adjusting your filters to see more results" 
                : "Bookings will appear here when customers make appointments"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}