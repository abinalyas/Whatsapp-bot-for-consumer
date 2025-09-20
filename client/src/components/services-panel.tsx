import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit } from "lucide-react";
import type { Service } from "@shared/schema";

export function ServicesPanel() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  if (isLoading) {
    return (
      <Card data-testid="services-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Services & Pricing</CardTitle>
            <Button size="sm" data-testid="button-add-service">
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border border-border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toLowerCase()) {
      case 'haircut':
        return { icon: 'fas fa-cut', color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/20' };
      case 'facial':
        return { icon: 'fas fa-sparkles', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/20' };
      case 'massage':
        return { icon: 'fas fa-hands', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/20' };
      default:
        return { icon: 'fas fa-star', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-900/20' };
    }
  };

  return (
    <Card data-testid="services-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Services & Pricing</CardTitle>
          <Button size="sm" data-testid="button-add-service">
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services?.map((service) => {
            const serviceStyle = getServiceIcon(service.name);
            return (
              <div
                key={service.id}
                className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`service-item-${service.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${serviceStyle.bg} rounded-lg flex items-center justify-center`}>
                      <i className={`${serviceStyle.icon} ${serviceStyle.color}`}></i>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground" data-testid={`service-name-${service.id}`}>
                        {service.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {service.description || `${service.name} service`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span
                      className="text-lg font-semibold text-foreground"
                      data-testid={`service-price-${service.id}`}
                    >
                      ₹{service.price}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-edit-service-${service.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Bookings today: <span className="font-medium text-foreground">0</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      service.isActive
                        ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400"
                    }
                  >
                    {service.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
