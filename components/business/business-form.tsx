// components/business/business-form.tsx
// Create/edit business form component with dropdown Goals and Concerns

'use client';

import { useState } from 'react';
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
import { X } from 'lucide-react';
import { industryCategories, usStates, goalOptions, concernOptions, organizationTypeCategories, OrganizationTypeCategory } from '@/lib/business/types';

// Type for goals and concerns with dropdown + other pattern
interface GoalEntry {
  id: string;
  value: string;
  otherText: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface ConcernEntry {
  id: string;
  value: string;
  otherText: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface BusinessFormProps {
  initialData?: {
    name?: string;
    alias?: string;
    organization_type?: string;
    organization_type_category?: OrganizationTypeCategory;
    organization_type_other?: string;
    industry_category?: string;
    industry_subcategory?: string;
    industry_other?: string;
    // Legacy location fields
    location_city?: string;
    location_state?: string;
    // Full address fields
    street_address_line_1?: string;
    street_address_line_2?: string;
    address_city?: string;
    address_state?: string;
    address_zip_code?: string;
    years_operating?: number;
    goals?: { id: string; text: string; priority?: string; type?: string }[];
    concerns?: { id: string; text: string; severity?: string; type?: string }[];
  };
  onSubmit: (data: {
    name: string;
    alias?: string;
    organization_type: string;
    organization_type_category?: OrganizationTypeCategory;
    organization_type_other?: string;
    industry_category?: string;
    industry_subcategory?: string;
    industry_other?: string;
    // Legacy location fields
    location_city?: string;
    location_state?: string;
    // Full address fields
    street_address_line_1?: string;
    street_address_line_2?: string;
    address_city?: string;
    address_state?: string;
    address_zip_code?: string;
    years_operating?: number;
    goals: { id: string; text: string; priority?: string; type?: string }[];
    concerns: { id: string; text: string; severity?: string; type?: string }[];
  }) => void;
  isSubmitting?: boolean;
}

// Convert stored goals to form entries
function goalsToEntries(goals: { id: string; text: string; priority?: string; type?: string }[]): GoalEntry[] {
  return goals.map(g => {
    const matchingOption = goalOptions.find(opt => opt.label === g.text);
    return {
      id: g.id,
      value: matchingOption?.value || (g.type === 'other' ? 'other' : ''),
      otherText: g.type === 'other' ? g.text : '',
      priority: (g.priority as 'critical' | 'high' | 'medium' | 'low') || 'medium',
    };
  });
}

// Convert stored concerns to form entries
function concernsToEntries(concerns: { id: string; text: string; severity?: string; type?: string }[]): ConcernEntry[] {
  return concerns.map(c => {
    const matchingOption = concernOptions.find(opt => opt.label === c.text);
    return {
      id: c.id,
      value: matchingOption?.value || (c.type === 'other' ? 'other' : ''),
      otherText: c.type === 'other' ? c.text : '',
      severity: (c.severity as 'critical' | 'high' | 'medium' | 'low') || 'medium',
    };
  });
}

// Convert form entries to stored goals
function entriesToGoals(entries: GoalEntry[]): { id: string; text: string; priority: string; type: string }[] {
  return entries.map(entry => {
    const option = goalOptions.find(opt => opt.value === entry.value);
    const isOther = entry.value === 'other';
    return {
      id: entry.id,
      text: isOther ? entry.otherText : (option?.label || entry.value),
      priority: entry.priority,
      type: isOther ? 'other' : 'predefined',
    };
  });
}

// Convert form entries to stored concerns
function entriesToConcerns(entries: ConcernEntry[]): { id: string; text: string; severity: string; type: string }[] {
  return entries.map(entry => {
    const option = concernOptions.find(opt => opt.value === entry.value);
    const isOther = entry.value === 'other';
    return {
      id: entry.id,
      text: isOther ? entry.otherText : (option?.label || entry.value),
      severity: entry.severity,
      type: isOther ? 'other' : 'predefined',
    };
  });
}

export function BusinessForm({ initialData, onSubmit, isSubmitting }: BusinessFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    alias: initialData?.alias || '',
    organization_type: initialData?.organization_type || '',
    organization_type_category: initialData?.organization_type_category || undefined as OrganizationTypeCategory | undefined,
    organization_type_other: initialData?.organization_type_other || '',
    industry_category: initialData?.industry_category || '',
    industry_subcategory: initialData?.industry_subcategory || '',
    industry_other: initialData?.industry_other || '',
    // Legacy location fields
    location_city: initialData?.location_city || '',
    location_state: initialData?.location_state || '',
    // Full address fields
    street_address_line_1: initialData?.street_address_line_1 || '',
    street_address_line_2: initialData?.street_address_line_2 || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_zip_code: initialData?.address_zip_code || '',
    years_operating: initialData?.years_operating?.toString() || '',
  });

  // Goals state - up to 3
  const [goals, setGoals] = useState<GoalEntry[]>(() => 
    goalsToEntries(initialData?.goals || []).slice(0, 3)
  );

  // Concerns state - up to 3
  const [concerns, setConcerns] = useState<ConcernEntry[]>(() => 
    concernsToEntries(initialData?.concerns || []).slice(0, 3)
  );

  // Get available subcategories based on selected category
  const selectedCategory = industryCategories.find(
    (cat) => cat.value === formData.industry_category
  );
  const availableSubcategories = selectedCategory?.subcategories || [];

  // Get available organization type entities based on selected category
  const selectedOrgTypeCategory = organizationTypeCategories.find(
    (cat) => cat.value === formData.organization_type_category
  );
  const availableOrgTypeEntities = selectedOrgTypeCategory?.entities || [];

  // Check if "Other" is selected for organization type
  const isOrgTypeOther = formData.organization_type?.includes('other_') || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty goals/concerns
    const validGoals = goals.filter(g => g.value && (g.value !== 'other' || g.otherText.trim()));
    const validConcerns = concerns.filter(c => c.value && (c.value !== 'other' || c.otherText.trim()));
    
    onSubmit({
      ...formData,
      years_operating: formData.years_operating ? parseFloat(formData.years_operating) : undefined,
      goals: entriesToGoals(validGoals),
      concerns: entriesToConcerns(validConcerns),
    });
  };

  // Add a new goal slot
  const addGoalSlot = () => {
    if (goals.length < 3) {
      setGoals([...goals, { id: crypto.randomUUID(), value: '', otherText: '', priority: 'medium' }]);
    }
  };

  // Remove a goal
  const removeGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  // Update a goal
  const updateGoal = (id: string, updates: Partial<GoalEntry>) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  // Add a new concern slot
  const addConcernSlot = () => {
    if (concerns.length < 3) {
      setConcerns([...concerns, { id: crypto.randomUUID(), value: '', otherText: '', severity: 'medium' }]);
    }
  };

  // Remove a concern
  const removeConcern = (id: string) => {
    setConcerns(concerns.filter(c => c.id !== id));
  };

  // Update a concern
  const updateConcern = (id: string, updates: Partial<ConcernEntry>) => {
    setConcerns(concerns.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Group goal options by category for the dropdown
  const goalCategories = Array.from(new Set(goalOptions.map(g => g.category)));
  
  // Group concern options by category for the dropdown
  const concernCategories = Array.from(new Set(concernOptions.map(c => c.category)));

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
            <Label htmlFor="alias">DBA (Doing Business As) (optional)</Label>
            <Input
              id="alias"
              value={formData.alias}
              onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
              placeholder="e.g., ABC Corp"
            />
          </div>
        </div>

        {/* Organization Type - Two-level selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="organization_type_category">Organization Category *</Label>
            <Select
              value={formData.organization_type_category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  organization_type_category: value as OrganizationTypeCategory,
                  organization_type: '', // Reset entity when category changes
                  organization_type_other: '', // Reset other text when category changes
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {organizationTypeCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization_type">Entity Type *</Label>
            <Select
              value={formData.organization_type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  organization_type: value,
                  organization_type_other: value.includes('other_') ? formData.organization_type_other : '',
                })
              }
              disabled={!formData.organization_type_category}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    formData.organization_type_category
                      ? 'Select entity type'
                      : 'Select category first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableOrgTypeEntities.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isOrgTypeOther && (
          <div className="space-y-2">
            <Label htmlFor="organization_type_other">Please specify</Label>
            <Input
              id="organization_type_other"
              value={formData.organization_type_other}
              onChange={(e) =>
                setFormData({ ...formData, organization_type_other: e.target.value })
              }
              placeholder="Specify organization type"
            />
          </div>
        )}

        {/* Industry - Two-level selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="industry_category">Industry Category</Label>
            <Select
              value={formData.industry_category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  industry_category: value,
                  industry_subcategory: '', // Reset subcategory when category changes
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {industryCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry_subcategory">Industry Subcategory</Label>
            <Select
              value={formData.industry_subcategory}
              onValueChange={(value) =>
                setFormData({ ...formData, industry_subcategory: value })
              }
              disabled={!formData.industry_category}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    formData.industry_category
                      ? 'Select subcategory'
                      : 'Select category first'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((sub) => (
                  <SelectItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {formData.industry_category === 'other' && (
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

      {/* Mailing Address */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-medium">Mailing Address</h3>
        
        <div className="space-y-2">
          <Label htmlFor="street_address_line_1">Street Address *</Label>
          <Input
            id="street_address_line_1"
            value={formData.street_address_line_1}
            onChange={(e) => setFormData({ ...formData, street_address_line_1: e.target.value })}
            placeholder="123 Main Street"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="street_address_line_2">Apt, Suite, Unit, etc. (optional)</Label>
          <Input
            id="street_address_line_2"
            value={formData.street_address_line_2}
            onChange={(e) => setFormData({ ...formData, street_address_line_2: e.target.value })}
            placeholder="Suite 100, Apt 4B, etc."
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="address_city">City *</Label>
            <Input
              id="address_city"
              value={formData.address_city}
              onChange={(e) => setFormData({ ...formData, address_city: e.target.value })}
              placeholder="Denver"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_state">State *</Label>
            <Select
              value={formData.address_state}
              onValueChange={(value) => setFormData({ ...formData, address_state: value })}
              required
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

          <div className="space-y-2">
            <Label htmlFor="address_zip_code">ZIP Code *</Label>
            <Input
              id="address_zip_code"
              value={formData.address_zip_code}
              onChange={(e) => {
                // Only allow digits and hyphen
                const value = e.target.value.replace(/[^\d-]/g, '');
                setFormData({ ...formData, address_zip_code: value });
              }}
              placeholder="80202 or 80202-1234"
              pattern="^\d{5}(-\d{4})?$"
              title="Enter a valid ZIP code (5 digits or 5+4 format)"
              required
            />
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

      {/* Top 3 Goals */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Top 3 Goals *</h3>
          <span className="text-xs text-muted-foreground">At least 1 required</span>
        </div>
        
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={goal.id} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-14">Goal {index + 1}:</span>
                  <Select
                    value={goal.value}
                    onValueChange={(value) => updateGoal(goal.id, { value, otherText: value === 'other' ? goal.otherText : '' })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a goal..." />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">
                            {category}
                          </div>
                          {goalOptions
                            .filter(opt => opt.category === category)
                            .map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {goal.value === 'other' && (
                  <div className="flex items-center gap-2 pl-16">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Other:</span>
                    <Input
                      value={goal.otherText}
                      onChange={(e) => updateGoal(goal.id, { otherText: e.target.value })}
                      placeholder="Specify your goal..."
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={goal.priority} onValueChange={(v) => updateGoal(goal.id, { priority: v as GoalEntry['priority'] })}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGoal(goal.id)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {goals.length < 3 && (
          <Button type="button" variant="outline" onClick={addGoalSlot} className="w-full">
            + Add Goal {goals.length + 1}
          </Button>
        )}
      </div>

      {/* Top 3 Concerns */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Top 3 Concerns *</h3>
          <span className="text-xs text-muted-foreground">At least 1 required</span>
        </div>
        
        <div className="space-y-3">
          {concerns.map((concern, index) => (
            <div key={concern.id} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground w-16">Concern {index + 1}:</span>
                  <Select
                    value={concern.value}
                    onValueChange={(value) => updateConcern(concern.id, { value, otherText: value === 'other' ? concern.otherText : '' })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a concern..." />
                    </SelectTrigger>
                    <SelectContent>
                      {concernCategories.map(category => (
                        <div key={category}>
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">
                            {category}
                          </div>
                          {concernOptions
                            .filter(opt => opt.category === category)
                            .map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {concern.value === 'other' && (
                  <div className="flex items-center gap-2 pl-20">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">Other:</span>
                    <Input
                      value={concern.otherText}
                      onChange={(e) => updateConcern(concern.id, { otherText: e.target.value })}
                      placeholder="Specify your concern..."
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={concern.severity} onValueChange={(v) => updateConcern(concern.id, { severity: v as ConcernEntry['severity'] })}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeConcern(concern.id)}
                  className="h-9 w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {concerns.length < 3 && (
          <Button type="button" variant="outline" onClick={addConcernSlot} className="w-full">
            + Add Concern {concerns.length + 1}
          </Button>
        )}
      </div>

      {/* Submit */}
      <div className="pt-4 border-t flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting || !formData.name || !formData.organization_type_category || !formData.organization_type || goals.length === 0 || concerns.length === 0}
        >
          {isSubmitting ? 'Saving...' : initialData ? 'Update Business' : 'Create Business'}
        </Button>
      </div>
    </form>
  );
}
