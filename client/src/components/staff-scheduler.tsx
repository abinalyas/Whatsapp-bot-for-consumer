import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Plus, Edit, Trash2 } from 'lucide-react';
import { staffApi } from '@/lib/staff-api';
import { availability } from '@/lib/availability-api';

interface StaffSchedulerProps {
  onStaffSelect?: (staffId: string) => void;
  onAvailabilityEdit?: (staffId: string) => void;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  total_appointments: number;
  upcoming_appointments: number;
}

interface StaffSchedule {
  staffId: string;
  staffName: string;
  appointments: any[];
  availability: any[];
}

export function StaffScheduler({ onStaffSelect, onAvailabilityEdit }: StaffSchedulerProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaffAndSchedules();
  }, [currentWeek]);

  const loadStaffAndSchedules = async () => {
    try {
      setLoading(true);
      const staffData = await staffApi.getAll();
      setStaff(staffData);

      // Load schedules for each staff member
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);
      
      const schedulePromises = staffData.map(async (member) => {
        const [appointments, availability] = await Promise.all([
          staffApi.getAppointments(member.id, { 
            date: weekStart.toISOString().split('T')[0] 
          }),
          availability.api.getStaffAvailability(member.id, '')
        ]);

        return {
          staffId: member.id,
          staffName: member.name,
          appointments,
          availability
        };
      });

      const schedulesData = await Promise.all(schedulePromises);
      setSchedules(schedulesData);
    } catch (err) {
      console.error('Error loading staff schedules:', err);
      setError('Failed to load staff schedules');
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date): Date => {
    const start = new Date(date);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getWeekEnd = (date: Date): Date => {
    const end = new Date(date);
    end.setDate(end.getDate() + (6 - end.getDay()));
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getWeekDays = (): Date[] => {
    const start = getWeekStart(currentWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(newWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getStaffAppointmentsForDay = (staffId: string, date: Date) => {
    const staffSchedule = schedules.find(s => s.staffId === staffId);
    if (!staffSchedule) return [];

    return staffSchedule.appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_at);
      return aptDate.toDateString() === date.toDateString();
    });
  };

  const getStaffAvailabilityForDay = (staffId: string, dayOfWeek: number) => {
    const staffSchedule = schedules.find(s => s.staffId === staffId);
    if (!staffSchedule) return null;

    return staffSchedule.availability.find(avail => avail.day_of_week === dayOfWeek);
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
            <span className="ml-2">Loading staff schedules...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={loadStaffAndSchedules} className="mt-2">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const weekDays = getWeekDays();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Staff Schedule
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[120px] text-center">
                {getWeekStart(currentWeek).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })} - {getWeekEnd(currentWeek).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Staff List */}
      <div className="space-y-4">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.is_active ? "default" : "secondary"}>
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAvailabilityEdit?.(member.id)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit Availability
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekly Schedule Grid */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day, dayIndex) => {
                  const dayOfWeek = day.getDay();
                  const appointments = getStaffAppointmentsForDay(member.id, day);
                  const availability = getStaffAvailabilityForDay(member.id, dayOfWeek);
                  const isAvailable = availability?.is_available || false;

                  return (
                    <div key={dayIndex} className="border rounded-lg p-2">
                      <div className="text-center mb-2">
                        <div className="text-xs font-medium text-muted-foreground">
                          {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-semibold">
                          {day.getDate()}
                        </div>
                      </div>

                      {/* Availability Status */}
                      <div className="mb-2">
                        <Badge 
                          variant={isAvailable ? "default" : "secondary"} 
                          className="text-xs w-full justify-center"
                        >
                          {isAvailable ? "Available" : "Off"}
                        </Badge>
                      </div>

                      {/* Working Hours */}
                      {isAvailable && availability && (
                        <div className="text-xs text-muted-foreground text-center mb-2">
                          <div>{formatTime(availability.start_time)}</div>
                          <div>to</div>
                          <div>{formatTime(availability.end_time)}</div>
                        </div>
                      )}

                      {/* Appointments */}
                      <div className="space-y-1">
                        {appointments.map((apt, aptIndex) => (
                          <div
                            key={aptIndex}
                            className="bg-primary/10 border border-primary/20 rounded px-2 py-1 text-xs"
                            onClick={() => onStaffSelect?.(member.id)}
                          >
                            <div className="font-medium truncate">
                              {new Date(apt.scheduled_at).toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {apt.customer_name}
                            </div>
                            <div className="text-muted-foreground truncate">
                              {apt.service_name}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Appointment Button */}
                      {isAvailable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 text-xs"
                          onClick={() => onStaffSelect?.(member.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Staff Stats */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{member.total_appointments}</div>
                    <div className="text-muted-foreground">Total Appointments</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{member.upcoming_appointments}</div>
                    <div className="text-muted-foreground">Upcoming</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
