// components/business/business-form.tsx
// Create/edit business form component

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { industries, usStates } from '@/lib/business/types';

interface BusinessFormProps {
  initialData?: {
    name?: string;
    alias?: string;
    organization_type?: string;
    industry?: string;
    industry_other?: string;
    location_city?: string;
    location_state?: string;
    years_operating?: number;
    goals?: { id: string; text: string; priority?: string }[];
    concerns?: { id: string; text: string; severity?: string }[];
  };
  onSubmit: (data: {
    name: string;
    alias?: string;
    organization_type: string;
    industry?: string;
    industry_other?: string;
    location_city?: string;
    location_state?: string;
    years_operating?: number;
    goals: { id: string; text: string; priority?: string }[];
    concerns: { id: string; text: string; severity?: string }[];
  }) => void;
  isSubmitting?: boolean;
}

export function BusinessForm({ initialData, onSubmit, isSubmitting }: BusinessFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    alias: initialData?.alias || '',
    organization_type: initialData?.organization_type || '',
    industry: initialData?.industry || '',
    industry_other: initialData?.industry_other || '',
    location_city: initialData?.location_city || '',
    location_state: initialData?.location_state || '',
    years_operating: initialData?.years_operating?.toString() || '',
    goals: initialData?.goals || [],
    concerns: initialData?.concerns || [],
  });

  const [newGoal, setNewGoal] = useState('');
  const [newGoalPriority, setNewGoalPriority] = useState('medium');
  const [newConcern, setNewConcern] = useState('');
  const [newConcernSeverity, setNewConcernSeverity] = useState('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      years_operating: formData.years_operating ? parseFloat(formData.years_operating) : undefined,
    });
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    setFormData({
      ...formData,
      goals: [
        ...formData.goals,
        { id: crypto.randomUUID(), text: newGoal.trim(), priority: newGoalPriority },
      ],
    });
    setNewGoal('');
    setNewGoalPriority('medium');
  };

  const removeGoal = (id: string) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((g) => g.id !== id),
    });
  };

  const addConcern = () => {
    if (!newConcern.trim()) return;
    setFormData({
      ...formData,
      concerns: [
        ...formData.concerns,
        { id: crypto.randomUUID(), text: newConcern.trim(), severity: newConcernSeverity },
      ],
    });
    setNewConcern('');
    setNewConcernSeverity('medium');
  };

  const removeConcern = (id: string) => {
    setFormData({
      ...formData,
      concerns: formData.concerns.filter((c) => c.id !== id),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Business Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter business name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alias">Alias (optional)</Label>
            <Input
              id="alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="e.g., ABC Corp"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="organization_type">Organization Type *</Label>
            <Select
              value={formData.organization_type}
              onValueChange={(value) => setFormData({ ...formData, organization_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="for_profit">For-Profit</SelectItem>
                <SelectItem value="nonprofit">Nonprofit</SelectItem>
                <SelectItem value="social_enterprise">Social Enterprise</SelectItem>
                <SelectItem value="cooperative">Cooperative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select
              value={formData.industry}
              onValueChange={(value) => setFormData({ ...formData, industry: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.industry === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="industry_other">Other Industry</Label>
            <Input
              id="industry_other"
              value={formData.industry_other}
              onChange={(e) => setFormData({ ...formData, industry_other: e.target.value })}
              placeholder="Specify industry"
            />
          </div>
        )}
      </div>

      {/* Location */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Location</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              value={formData.location_city}
              onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location_state">State</Label>
            <Select
              value={formData.location_state}
              onValueChange={(value) => setFormData({ ...formData, location_state: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {usStates.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="years_operating">Years Operating</Label>
          <Input
            id="years_operating"
            type="number"
            min="0"
            step="0.5"
            value={formData.years_operating}
            onChange={(e) => setFormData({ ...formData, years_operating: e.target.value })}
            placeholder="e.g., 5.5"
          />
        </div>
      </div>

      {/* Goals */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Goals</h3>
        
        <div className="space-y-2">
          {formData.goals.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{goal.text}</span>
              <span className="text-xs text-muted-foreground capitalize">{goal.priority}</span>
              <button
                type="button"
                onClick={() => removeGoal(goal.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add a goal..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
          />
          <Select value={newGoalPriority} onValueChange={setNewGoalPriority}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={addGoal}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Concerns */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Concerns</h3>
        
        <div className="space-y-2">
          {formData.concerns.map((concern) => (
            <div key={concern.id} className="flex items-center gap-2 p-2 bg-muted rounded">
              <span className="flex-1">{concern.text}</span>
              <span className="text-xs text-muted-foreground capitalize">{concern.severity}</span>
              <button
                type="button"
                onClick={() => removeConcern(concern.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newConcern}
            onChange={(e) => setNewConcern(e.target.value)}
            placeholder="Add a concern..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConcern())}
          />
          <Select value={newConcernSeverity} onValueChange={setNewConcernSeverity}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="icon" onClick={addConcern}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-4 border-t flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting || !formData.name || !formData.organization_type}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Business' : 'Create Business'}
        </Button>
      </div>
    </form>
  );
}
