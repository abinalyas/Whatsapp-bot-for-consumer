import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, Check } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  iconColor: string;
  iconBg: string;
  change?: string;
  changeText?: string;
  isPositive?: boolean;
  showCheckIcon?: boolean;
  testId: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  iconColor, 
  iconBg, 
  change, 
  changeText, 
  isPositive = true,
  showCheckIcon = false,
  testId
}: StatCardProps) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground" data-testid={`${testId}-value`}>{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} ${iconColor}`}></i>
          </div>
        </div>
        {change && (
          <div className="mt-4 flex items-center text-sm">
            {showCheckIcon ? (
              <Check className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowUp className={`h-4 w-4 mr-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>{change}</span>
            {changeText && <span className="text-muted-foreground ml-1">{changeText}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
