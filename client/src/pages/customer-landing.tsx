/**
 * Customer Landing Page
 * Public-facing page that adapts to the business configuration
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Calendar,
  DollarSign,
  Users,
  Utensils,
  Scissors,
  Stethoscope,
  Store,
  MessageCircle
} from 'lucide-react';

// Types
interface BusinessConfig {
  id: string;
  businessName: string;
  businessType: {
    id: string;
    name: string;
    category: string;
    terminology: Record<string, string>;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
  };
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };
  offerings: Offering[];
}

interface Offering {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  duration?: number;
  category: string;
  isActive: boolean;
  variants?: {
    id: string;
    name: string;
    priceModifier: number;
  }[];
}

interface BookingForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  offeringId: string;
  variantId?: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

export const CustomerLandingPage: React.FC = () => {
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    offeringId: '',
    preferredDate: '',
    preferredTime: '',
    notes: ''
  });

  useEffect(() => {
    loadBusinessConfig();
  }, []);

  const loadBusinessConfig = async () => {
    try {
      setLoading(true);
      
      // Get business type from URL params or default to salon
      const urlParams = new URLSearchParams(window.location.search);
      const businessType = urlParams.get('type') || 'salon';
      
      // Fetch business configuration from API
      const response = await fetch(`/api/business-config?type=${businessType}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        setBusinessConfig(result.data);
      } else {
        throw new Error('Failed to load business configuration');
      }
    } catch (error) {
      console.error('Failed to load business config:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBusinessIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'beauty & wellness':
        return Scissors;
      case 'food & beverage':
        return Utensils;
      case 'healthcare':
        return Stethoscope;
      case 'retail':
        return Store;
      default:
        return Store;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock booking submission
    console.log('Booking submitted:', {
      ...bookingForm,
      offering: selectedOffering,
      businessId: businessConfig?.id
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`${businessConfig?.businessType.terminology.booking || 'Booking'} request submitted! We'll contact you soon to confirm.`);
    setShowBookingDialog(false);
    setBookingForm({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      offeringId: '',
      preferredDate: '',
      preferredTime: '',
      notes: ''
    });
  };

  const openBookingDialog = (offering: Offering) => {
    setSelectedOffering(offering);
    setBookingForm(prev => ({ ...prev, offeringId: offering.id }));
    setShowBookingDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business information...</p>
        </div>
      </div>
    );
  }

  if (!businessConfig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Not Found</h1>
          <p className="text-gray-600">The requested business could not be loaded.</p>
        </div>
      </div>
    );
  }

  const BusinessIcon = getBusinessIcon(businessConfig.businessType.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="bg-white shadow-sm border-b-4"
        style={{ borderBottomColor: businessConfig.branding.primaryColor }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: businessConfig.branding.primaryColor + '20' }}
              >
                <BusinessIcon 
                  className="h-8 w-8" 
                  style={{ color: businessConfig.branding.primaryColor }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {businessConfig.businessName}
                </h1>
                <p className="text-gray-600">{businessConfig.businessType.name}</p>
              </div>
            </div>
            
            <Button
              className="flex items-center space-x-2"
              style={{ backgroundColor: businessConfig.branding.primaryColor }}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat with WhatsApp Bot</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About {businessConfig.businessName}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Welcome to {businessConfig.businessName}, your premier {businessConfig.businessType.name.toLowerCase()}. 
                  We offer professional {businessConfig.businessType.terminology.offering?.toLowerCase() || 'services'} 
                  with personalized attention and exceptional quality.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>4.9 (127 reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>500+ happy {businessConfig.businessType.terminology.customer?.toLowerCase() || 'customers'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services/Offerings */}
            <Card>
              <CardHeader>
                <CardTitle>Our {businessConfig.businessType.terminology.offering || 'Services'}</CardTitle>
                <CardDescription>
                  Choose from our range of professional {businessConfig.businessType.terminology.offering?.toLowerCase() || 'services'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {businessConfig.offerings.filter(o => o.isActive).map((offering) => (
                    <Card key={offering.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{offering.name}</CardTitle>
                            <Badge variant="secondary" className="mt-1">
                              {offering.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div 
                              className="text-lg font-bold"
                              style={{ color: businessConfig.branding.primaryColor }}
                            >
                              {formatPrice(offering.basePrice)}
                              {offering.variants && offering.variants.length > 0 && '+'}
                            </div>
                            {offering.duration && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDuration(offering.duration)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 text-sm mb-4">{offering.description}</p>
                        
                        {offering.variants && offering.variants.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-medium text-gray-500 mb-2">Options:</p>
                            <div className="flex flex-wrap gap-1">
                              {offering.variants.map(variant => (
                                <Badge key={variant.id} variant="outline" className="text-xs">
                                  {variant.name} 
                                  {variant.priceModifier !== 0 && 
                                    ` (${variant.priceModifier > 0 ? '+' : ''}${formatPrice(variant.priceModifier)})`
                                  }
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button 
                          className="w-full"
                          style={{ backgroundColor: businessConfig.branding.primaryColor }}
                          onClick={() => openBookingDialog(offering)}
                        >
                          Book {businessConfig.businessType.terminology.booking || 'Appointment'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {businessConfig.contact.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{businessConfig.contact.phone}</span>
                  </div>
                )}
                {businessConfig.contact.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{businessConfig.contact.email}</span>
                  </div>
                )}
                {businessConfig.contact.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{businessConfig.contact.address}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours */}
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Saturday</span>
                  <span>9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Bot CTA */}
            <Card 
              className="border-2"
              style={{ borderColor: businessConfig.branding.primaryColor }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle 
                    className="h-5 w-5"
                    style={{ color: businessConfig.branding.primaryColor }}
                  />
                  <span>Quick {businessConfig.businessType.terminology.booking || 'Booking'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Chat with our WhatsApp bot for instant {businessConfig.businessType.terminology.booking?.toLowerCase() || 'booking'} 
                  and quick questions!
                </p>
                <Button 
                  className="w-full"
                  style={{ backgroundColor: businessConfig.branding.primaryColor }}
                >
                  Start WhatsApp Chat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Book {selectedOffering?.name}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below to request your {businessConfig.businessType.terminology.booking?.toLowerCase() || 'appointment'}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={bookingForm.customerPhone}
                onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={bookingForm.customerEmail}
                onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
              />
            </div>

            {selectedOffering?.variants && selectedOffering.variants.length > 0 && (
              <div>
                <Label htmlFor="variant">Option</Label>
                <select
                  id="variant"
                  value={bookingForm.variantId || ''}
                  onChange={(e) => setBookingForm({ ...bookingForm, variantId: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  <option value="">Select an option</option>
                  {selectedOffering.variants.map(variant => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} 
                      {variant.priceModifier !== 0 && 
                        ` (${variant.priceModifier > 0 ? '+' : ''}${formatPrice(variant.priceModifier)})`
                      }
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Input
                  id="preferredDate"
                  type="date"
                  value={bookingForm.preferredDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, preferredDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  value={bookingForm.preferredTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, preferredTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Special Requests</Label>
              <Textarea
                id="notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                rows={3}
                placeholder="Any special requests or notes..."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowBookingDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                style={{ backgroundColor: businessConfig.branding.primaryColor }}
              >
                Submit {businessConfig.businessType.terminology.booking || 'Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerLandingPage;