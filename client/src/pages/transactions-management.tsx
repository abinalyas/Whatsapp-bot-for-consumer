/**
 * Transactions Management Page
 * Manage orders, bookings, appointments, and other transactions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye,
  Calendar,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowUpDown
} from 'lucide-react';

// Types
interface Transaction {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  offeringId: string;
  offeringName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  totalAmount: number;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  notes?: string;
  customFieldValues?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  history: TransactionHistoryEntry[];
}

interface TransactionHistoryEntry {
  id: string;
  fromState: string;
  toState: string;
  notes?: string;
  timestamp: string;
  userId?: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-purple-100 text-purple-800', icon: Clock },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

export const TransactionsManagementPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'scheduledDate' | 'totalAmount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data for demo
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTransactions([
        {
          id: '1',
          customerName: 'Sarah Johnson',
          customerPhone: '+1-555-0123',
          customerEmail: 'sarah@example.com',
          offeringId: '1',
          offeringName: 'Haircut & Style',
          variantId: '1b',
          variantName: 'Long Hair',
          quantity: 1,
          totalAmount: 60.00,
          status: 'confirmed',
          scheduledDate: '2024-02-15',
          scheduledTime: '14:00',
          notes: 'Customer prefers layers',
          createdAt: '2024-02-10T10:00:00Z',
          updatedAt: '2024-02-10T10:30:00Z',
          history: [
            {
              id: '1a',
              fromState: 'pending',
              toState: 'confirmed',
              notes: 'Payment confirmed',
              timestamp: '2024-02-10T10:30:00Z',
            }
          ]
        },
        {
          id: '2',
          customerName: 'Mike Chen',
          customerPhone: '+1-555-0124',
          offeringId: '2',
          offeringName: 'Color Treatment',
          quantity: 1,
          totalAmount: 120.00,
          status: 'pending',
          scheduledDate: '2024-02-20',
          scheduledTime: '10:00',
          createdAt: '2024-02-12T14:00:00Z',
          updatedAt: '2024-02-12T14:00:00Z',
          history: []
        },
        {
          id: '3',
          customerName: 'Emma Davis',
          customerEmail: 'emma@example.com',
          offeringId: '3',
          offeringName: 'Manicure',
          quantity: 1,
          totalAmount: 25.00,
          status: 'completed',
          scheduledDate: '2024-02-08',
          scheduledTime: '16:30',
          notes: 'Regular customer',
          createdAt: '2024-02-05T09:00:00Z',
          updatedAt: '2024-02-08T17:15:00Z',
          history: [
            {
              id: '3a',
              fromState: 'pending',
              toState: 'confirmed',
              timestamp: '2024-02-05T09:15:00Z',
            },
            {
              id: '3b',
              fromState: 'confirmed',
              toState: 'in_progress',
              timestamp: '2024-02-08T16:30:00Z',
            },
            {
              id: '3c',
              fromState: 'in_progress',
              toState: 'completed',
              timestamp: '2024-02-08T17:15:00Z',
            }
          ]
        },
        {
          id: '4',
          customerName: 'John Smith',
          customerPhone: '+1-555-0125',
          offeringId: '1',
          offeringName: 'Haircut & Style',
          quantity: 1,
          totalAmount: 45.00,
          status: 'no_show',
          scheduledDate: '2024-02-12',
          scheduledTime: '11:00',
          createdAt: '2024-02-08T16:00:00Z',
          updatedAt: '2024-02-12T11:30:00Z',
          history: [
            {
              id: '4a',
              fromState: 'pending',
              toState: 'confirmed',
              timestamp: '2024-02-08T16:15:00Z',
            },
            {
              id: '4b',
              fromState: 'confirmed',
              toState: 'no_show',
              notes: 'Customer did not arrive',
              timestamp: '2024-02-12T11:30:00Z',
            }
          ]
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const statuses = ['all', ...Object.keys(statusConfig)];

  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.offeringName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.customerPhone?.includes(searchTerm);
      const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'scheduledDate':
          aValue = a.scheduledDate ? new Date(a.scheduledDate) : new Date(0);
          bValue = b.scheduledDate ? new Date(b.scheduledDate) : new Date(0);
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = (transactionId: string, newStatus: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { 
            ...t, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            history: [
              ...t.history,
              {
                id: `${t.id}-${Date.now()}`,
                fromState: t.status,
                toState: newStatus,
                timestamp: new Date().toISOString(),
              }
            ]
          }
        : t
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage bookings, orders, and appointments
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
              <DialogDescription>
                Create a new booking, order, or appointment.
              </DialogDescription>
            </DialogHeader>
            <CreateTransactionForm onClose={() => setShowCreateDialog(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, service, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : statusConfig[status as keyof typeof statusConfig]?.label || status}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="scheduledDate-asc">Scheduled Date (Earliest)</option>
                <option value="scheduledDate-desc">Scheduled Date (Latest)</option>
                <option value="totalAmount-desc">Highest Amount</option>
                <option value="totalAmount-asc">Lowest Amount</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{transactions.length}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {formatPrice(transactions.reduce((sum, t) => sum + t.totalAmount, 0))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'completed').length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'pending').length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {filteredTransactions.length} of {transactions.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{transaction.customerName}</div>
                    <div className="text-sm text-muted-foreground">
                      {transaction.offeringName}
                      {transaction.variantName && ` (${transaction.variantName})`}
                    </div>
                    {transaction.scheduledDate && (
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(transaction.scheduledDate)}
                        {transaction.scheduledTime && ` at ${transaction.scheduledTime}`}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold">{formatPrice(transaction.totalAmount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(transaction.status)}
                    
                    <select
                      value={transaction.status}
                      onChange={(e) => handleStatusChange(transaction.id, e.target.value)}
                      className="px-2 py-1 border border-input bg-background rounded text-xs"
                    >
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <option key={status} value={status}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No Transactions Found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                {searchTerm || selectedStatus !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first transaction to get started.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
              <DialogDescription>
                Transaction #{selectedTransaction.id}
              </DialogDescription>
            </DialogHeader>
            <TransactionDetails transaction={selectedTransaction} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Transaction Details Component
const TransactionDetails: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
          <div className="mt-1">
            <div className="font-medium">{transaction.customerName}</div>
            {transaction.customerEmail && (
              <div className="text-sm text-muted-foreground">{transaction.customerEmail}</div>
            )}
            {transaction.customerPhone && (
              <div className="text-sm text-muted-foreground">{transaction.customerPhone}</div>
            )}
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Service</Label>
          <div className="mt-1">
            <div className="font-medium">{transaction.offeringName}</div>
            {transaction.variantName && (
              <div className="text-sm text-muted-foreground">{transaction.variantName}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
          <div className="mt-1 font-semibold text-lg">{formatPrice(transaction.totalAmount)}</div>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status</Label>
          <div className="mt-1">
            {statusConfig[transaction.status as keyof typeof statusConfig] && (
              <Badge className={statusConfig[transaction.status as keyof typeof statusConfig].color}>
                {statusConfig[transaction.status as keyof typeof statusConfig].label}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {transaction.scheduledDate && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Scheduled</Label>
          <div className="mt-1 flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(transaction.scheduledDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
              {transaction.scheduledTime && ` at ${transaction.scheduledTime}`}
            </span>
          </div>
        </div>
      )}

      {transaction.notes && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
          <div className="mt-1 p-3 bg-muted rounded-md text-sm">
            {transaction.notes}
          </div>
        </div>
      )}

      {transaction.history.length > 0 && (
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Status History</Label>
          <div className="mt-2 space-y-2">
            {transaction.history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div>
                  <span className="font-medium">{entry.fromState}</span>
                  <span className="mx-2">→</span>
                  <span className="font-medium">{entry.toState}</span>
                  {entry.notes && (
                    <div className="text-muted-foreground mt-1">{entry.notes}</div>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {formatDateTime(entry.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Create Transaction Form Component
const CreateTransactionForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    offeringName: '',
    scheduledDate: '',
    scheduledTime: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would call the API to create the transaction
    console.log('Creating transaction:', formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="customerPhone">Phone</Label>
          <Input
            id="customerPhone"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="customerEmail">Email</Label>
        <Input
          id="customerEmail"
          type="email"
          value={formData.customerEmail}
          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="offeringName">Service/Product *</Label>
        <Input
          id="offeringName"
          value={formData.offeringName}
          onChange={(e) => setFormData({ ...formData, offeringName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledDate">Scheduled Date</Label>
          <Input
            id="scheduledDate"
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="scheduledTime">Scheduled Time</Label>
          <Input
            id="scheduledTime"
            type="time"
            value={formData.scheduledTime}
            onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Create Transaction
        </Button>
      </div>
    </form>
  );
};

export default TransactionsManagementPage;