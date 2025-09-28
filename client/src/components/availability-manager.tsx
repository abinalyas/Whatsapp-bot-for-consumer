import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Save, Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { availability } from '@/lib/availability-api';

interface AvailabilityManagerProps {
  staffId: string;
  staffName: string;
  onSave?: (availability: any[]) => void;
  onCancel?: () => void;
}

interface DayAvailability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start_time?: string;
  break_end_time?: string;
  max_appointments: number;
}

const DAYS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

export function AvailabilityManager({ staffId, staffName, onSave, onCancel }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailability();
  }, [staffId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await availability.api.getStaffAvailability(staffId, '');
      setAvailability(data);
    } catch (err) {
      console.error('Error loading availability:', err);
      setError('Failed to load availability');
      // Initialize with default availability
      setAvailability(DAYS.map(day => ({
        day_of_week: day.value,
        start_time: '09:00',
        end_time: '17:00',
        is_available: day.value >= 1 && day.value <= 5, // Monday to Friday
        break_start_time: '12:00',
        break_end_time: '13:00',
        max_appointments: 1
      })));
    } finally {
      setLoading(false);
    }
  };

  const updateDayAvailability = (dayOfWeek: number, updates: Partial<DayAvailability>) => {
    setAvailability(prev => 
      prev.map(day => 
        day.day_of_week === dayOfWeek 
          ? { ...day, ...updates }
          : day
      )
    );
  };

  const addDayAvailability = (dayOfWeek: number) => {
    const newDay: DayAvailability = {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
      break_start_time: '12:00',
      break_end_time: '13:00',
      max_appointments: 1
    };
    setAvailability(prev => [...prev, newDay]);
  };

  const removeDayAvailability = (dayOfWeek: number) => {
    setAvailability(prev => prev.filter(day => day.day_of_week !== dayOfWeek));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await availability.api.updateStaffAvailability(staffId, availability);
      onSave?.(availability);
    } catch (err) {
      console.error('Error saving availability:', err);
      setError('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const getDayAvailability = (dayOfWeek: number): DayAvailability | undefined => {
    return availability.find(day => day.day_of_week === dayOfWeek);
  };

  const formatTime = (time: string): string => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Availability for {staffName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {DAYS.map(day => {
          const dayAvailability = getDayAvailability(day.value);
          const isAvailable = dayAvailability?.is_available || false;

          return (
            <div key={day.value} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{day.label}</h3>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={(checked) => {
                      if (checked && !dayAvailability) {
                        addDayAvailability(day.value);
                      } else if (!checked && dayAvailability) {
                        removeDayAvailability(day.value);
                      } else if (dayAvailability) {
                        updateDayAvailability(day.value, { is_available: checked });
                      }
                    }}
                  />
                  <Badge variant={isAvailable ? "default" : "secondary"}>
                    {isAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                {!isAvailable && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addDayAvailability(day.value)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {isAvailable && dayAvailability && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Working Hours */}
                  <div className="space-y-2">
                    <Label>Working Hours</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={dayAvailability.start_time}
                        onValueChange={(value) => updateDayAvailability(day.value, { start_time: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={dayAvailability.end_time}
                        onValueChange={(value) => updateDayAvailability(day.value, { end_time: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Break Hours */}
                  <div className="space-y-2">
                    <Label>Break Hours (Optional)</Label>
                    <div className="flex items-center gap-2">
                      <Select
                        value={dayAvailability.break_start_time || ''}
                        onValueChange={(value) => updateDayAvailability(day.value, { break_start_time: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Start" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">to</span>
                      <Select
                        value={dayAvailability.break_end_time || ''}
                        onValueChange={(value) => updateDayAvailability(day.value, { break_end_time: value })}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="End" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map(time => (
                            <SelectItem key={time} value={time}>
                              {formatTime(time)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Max Appointments */}
                  <div className="space-y-2">
                    <Label>Max Concurrent Appointments</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={dayAvailability.max_appointments}
                      onChange={(e) => updateDayAvailability(day.value, { 
                        max_appointments: parseInt(e.target.value) || 1 
                      })}
                      className="w-20"
                    />
                  </div>

                  {/* Remove Day */}
                  <div className="flex items-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeDayAvailability(day.value)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Availability'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
