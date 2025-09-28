import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, User, AlertCircle } from 'lucide-react';
import { availability } from '@/lib/availability-api';

interface TimeSlotSelectorProps {
  staffId: string;
  date: string;
  duration: number; // in minutes
  onSlotSelect: (slot: string) => void;
  selectedSlot?: string;
  disabled?: boolean;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  formatted_time: string;
  is_available: boolean;
}

export function TimeSlotSelector({ 
  staffId, 
  date, 
  duration, 
  onSlotSelect, 
  selectedSlot,
  disabled = false 
}: TimeSlotSelectorProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableSlots();
  }, [staffId, date, duration]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await availability.api.getAvailableSlots(staffId, date);
      setSlots(data);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setError('Failed to load available time slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getSlotStatus = (slot: TimeSlot) => {
    if (!slot.is_available) return 'unavailable';
    if (selectedSlot === slot.formatted_time) return 'selected';
    return 'available';
  };

  const getSlotVariant = (slot: TimeSlot) => {
    const status = getSlotStatus(slot);
    switch (status) {
      case 'selected':
        return 'default';
      case 'available':
        return 'outline';
      case 'unavailable':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isSlotDisabled = (slot: TimeSlot) => {
    return disabled || !slot.is_available;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading time slots...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={loadAvailableSlots}>
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-2">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No available time slots for this date</p>
              <p className="text-sm text-muted-foreground">
                Try selecting a different date or contact the salon for availability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Available Time Slots
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select a time slot for your {duration}-minute appointment
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {slots.map((slot, index) => {
            const status = getSlotStatus(slot);
            const isDisabled = isSlotDisabled(slot);
            
            return (
              <Button
                key={index}
                variant={getSlotVariant(slot)}
                size="sm"
                className={`h-12 ${
                  status === 'selected' 
                    ? 'bg-primary text-primary-foreground' 
                    : status === 'unavailable'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-primary hover:text-primary-foreground'
                }`}
                disabled={isDisabled}
                onClick={() => !isDisabled && onSlotSelect(slot.formatted_time)}
              >
                <div className="flex flex-col items-center">
                  <span className="font-medium">{slot.formatted_time}</span>
                  {status === 'unavailable' && (
                    <span className="text-xs opacity-75">Unavailable</span>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {selectedSlot && (
          <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Selected: {selectedSlot}</span>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Available slots are shown in blue</p>
          <p>• Unavailable slots are grayed out</p>
          <p>• Selected slot is highlighted</p>
        </div>
      </CardContent>
    </Card>
  );
}
