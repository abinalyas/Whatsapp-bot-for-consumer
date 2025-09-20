import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Check, MessageCircle, Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import type { Booking } from "@shared/schema";

export function ActivityFeed() {
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { icon: Check, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/20' };
      case 'pending':
        return { icon: AlertTriangle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/20' };
      default:
        return { icon: MessageCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' };
    }
  };

  const getActivityText = (booking: Booking) => {
    switch (booking.status) {
      case 'confirmed':
        return `Payment completed for ${booking.serviceId} service`;
      case 'pending':
        return `Payment pending for ${booking.serviceId} service`;
      default:
        return `New booking for ${booking.serviceId} service`;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-activity">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : bookings && bookings.length > 0 ? (
            bookings.slice(0, 5).map((booking) => {
              const activityStyle = getActivityIcon(booking.status);
              const IconComponent = activityStyle.icon;
              
              return (
                <div key={booking.id} className="flex items-start space-x-3" data-testid={`activity-item-${booking.id}`}>
                  <div className={`w-8 h-8 ${activityStyle.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <IconComponent className={`h-4 w-4 ${activityStyle.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{booking.customerName || booking.phoneNumber}</span>{" "}
                      {getActivityText(booking)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(new Date(booking.createdAt))}
                    </p>
                  </div>
                  {booking.status === 'confirmed' && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ₹{booking.amount}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            // Empty state
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Activity will appear here when customers interact with your bot
              </p>
            </div>
          )}

          {/* Static activity items for demonstration */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">Rahul</span> started a new conversation
              </p>
              <p className="text-xs text-muted-foreground">5 minutes ago</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                Bot configuration updated successfully
              </p>
              <p className="text-xs text-muted-foreground">1 hour ago</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button variant="ghost" className="w-full text-center" data-testid="button-view-all-activity-footer">
              View all activity
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
