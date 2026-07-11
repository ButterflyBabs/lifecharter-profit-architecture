// components/business/team-manager.tsx
// Team management component

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  X, 
  Edit2, 
  Mail, 
  Phone, 
  Clock, 
  DollarSign,
  User,
  Loader2,
  Briefcase
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  role_category?: 'owner' | 'leadership' | 'operations' | 'sales' | 'marketing' | 'finance' | 'technical' | 'support' | 'other';
  capacity_hours?: number;
  capacity_type?: 'full_time' | 'part_time' | 'contract' | 'variable';
  cost_per_hour?: number;
  cost_per_month?: number;
  employment_type?: 'employee' | 'contractor' | 'owner' | 'volunteer' | 'intern';
  start_date?: string;
  email?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'former';
  notes?: string;
}

interface TeamManagerProps {
  businessId: string;
}

const roleCategories = [
  { value: 'owner', label: 'Owner' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'operations', label: 'Operations' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Finance' },
  { value: 'technical', label: 'Technical' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' },
];

const capacityTypes = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'variable', label: 'Variable' },
];

const employmentTypes = [
  { value: 'employee', label: 'Employee' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'owner', label: 'Owner' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'intern', label: 'Intern' },
];

export function TeamManager({ businessId }: TeamManagerProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    role_category: 'other',
    capacity_hours: 40,
    capacity_type: 'full_time',
    cost_per_hour: undefined,
    cost_per_month: undefined,
    employment_type: 'employee',
    email: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    fetchTeamMembers();
  }, [businessId]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/team`);
      if (!response.ok) throw new Error('Failed to fetch team members');
      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to add team member');

      await fetchTeamMembers();
      resetForm();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      role_category: 'other',
      capacity_hours: 40,
      capacity_type: 'full_time',
      cost_per_hour: undefined,
      cost_per_month: undefined,
      employment_type: 'employee',
      email: '',
      phone: '',
      notes: '',
    });
  };

  const getRoleCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      owner: 'bg-purple-100 text-purple-800',
      leadership: 'bg-blue-100 text-blue-800',
      operations: 'bg-green-100 text-green-800',
      sales: 'bg-orange-100 text-orange-800',
      marketing: 'bg-pink-100 text-pink-800',
      finance: 'bg-emerald-100 text-emerald-800',
      technical: 'bg-cyan-100 text-cyan-800',
      support: 'bg-gray-100 text-gray-800',
      other: 'bg-slate-100 text-slate-800',
    };
    return colors[category || 'other'] || colors.other;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Add Team Member</h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g., CEO, Developer"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Role Category</Label>
              <Select
                value={formData.role_category}
                onValueChange={(value) => setFormData({ ...formData, role_category: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Capacity Type</Label>
              <Select
                value={formData.capacity_type}
                onValueChange={(value) => setFormData({ ...formData, capacity_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {capacityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Employment Type</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="capacity_hours">Hours/Week</Label>
              <Input
                id="capacity_hours"
                type="number"
                min="0"
                max="168"
                value={formData.capacity_hours}
                onChange={(e) => setFormData({ ...formData, capacity_hours: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_per_hour">Cost/Hour ($)</Label>
              <Input
                id="cost_per_hour"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_hour || ''}
                onChange={(e) => setFormData({ ...formData, cost_per_hour: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_per_month">Cost/Month ($)</Label>
              <Input
                id="cost_per_month"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_per_month || ''}
                onChange={(e) => setFormData({ ...formData, cost_per_month: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name || !formData.role}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {teamMembers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-1">No team members yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add team members to track capacity and costs
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Member
            </Button>
          </div>
        ) : (
          teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium">
                  {member.name.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium">{member.name}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleCategoryColor(member.role_category)}`}>
                    {member.role_category || 'other'}
                  </span>
                  {member.status !== 'active' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
                      {member.status}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{member.role}</p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {member.capacity_hours && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {member.capacity_hours}h/week
                    </span>
                  )}
                  {member.capacity_type && (
                    <span className="capitalize">({member.capacity_type.replace('_', '-')})</span>
                  )}
                  {member.cost_per_hour && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      ${member.cost_per_hour}/hr
                    </span>
                  )}
                  {member.employment_type && (
                    <span className="capitalize">{member.employment_type}</span>
                  )}
                </div>

                {(member.email || member.phone) && (
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {member.email}
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {member.phone}
                      </a>
                    )}
                  </div>
                )}

                {member.notes && (
                  <p className="text-sm text-muted-foreground mt-2">{member.notes}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {teamMembers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">{teamMembers.length}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">
              {teamMembers.reduce((sum, m) => sum + (m.capacity_hours || 0), 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Hours/Week</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">
              {teamMembers.filter((m) => m.employment_type === 'employee').length}
            </p>
            <p className="text-xs text-muted-foreground">Employees</p>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-2xl font-bold">
              ${Math.round(teamMembers.reduce((sum, m) => sum + (m.cost_per_month || 0), 0)).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Monthly Cost</p>
          </div>
        </div>
      )}
    </div>
  );
}
