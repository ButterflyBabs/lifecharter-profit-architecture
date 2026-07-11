// components/business/classification-wizard.tsx
// Multi-step classification wizard

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PathwayBadge } from './pathway-badge';
import { 
  classifyBusiness, 
  type OrganizationType,
  type BusinessModel,
  type CustomerType,
  type BusinessStage,
  type Pathway,
  type ClassificationInput,
} from '@/lib/business/classification';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Package,
  RefreshCw,
  Clock,
  Heart,
  FileText,
  Users2
} from 'lucide-react';

interface ClassificationWizardProps {
  businessId: string;
  onComplete: () => void;
}

type Step = 
  | 'organization-type'
  | 'business-model'
  | 'customer-type'
  | 'stage'
  | 'indicators'
  | 'review';

const steps: { id: Step; title: string; description: string }[] = [
  { id: 'organization-type', title: 'Organization Type', description: 'What type of organization is this?' },
  { id: 'business-model', title: 'Business Model', description: 'How does the business make money?' },
  { id: 'customer-type', title: 'Customer Type', description: 'Who are the customers?' },
  { id: 'stage', title: 'Business Stage', description: 'What stage is the business in?' },
  { id: 'indicators', title: 'Additional Indicators', description: 'Any other important factors?' },
  { id: 'review', title: 'Review & Confirm', description: 'Review the classification' },
];

const organizationTypes: { value: OrganizationType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'for_profit', label: 'For-Profit', description: 'Traditional profit-seeking business', icon: DollarSign },
  { value: 'nonprofit', label: 'Nonprofit', description: 'Mission-driven organization', icon: Heart },
  { value: 'social_enterprise', label: 'Social Enterprise', description: 'Mission + profit combined', icon: Building2 },
  { value: 'cooperative', label: 'Cooperative', description: 'Member-owned organization', icon: Users2 },
];

const businessModels: { value: BusinessModel; label: string; description: string }[] = [
  { value: 'product_sales', label: 'Product Sales', description: 'Selling physical or digital products' },
  { value: 'service_delivery', label: 'Service Delivery', description: 'Providing services to clients' },
  { value: 'subscription', label: 'Subscription', description: 'Recurring subscription revenue' },
  { value: 'membership', label: 'Membership', description: 'Membership-based access or benefits' },
  { value: 'licensing', label: 'Licensing', description: 'Licensing intellectual property' },
  { value: 'advertising', label: 'Advertising', description: 'Ad-supported revenue model' },
  { value: 'transaction_fees', label: 'Transaction Fees', description: 'Fees on transactions' },
  { value: 'freemium', label: 'Freemium', description: 'Free + premium tiers' },
  { value: 'marketplace', label: 'Marketplace', description: 'Connecting buyers and sellers' },
  { value: 'franchise', label: 'Franchise', description: 'Franchise model' },
  { value: 'donation_based', label: 'Donation Based', description: 'Relies on donations' },
  { value: 'grant_funded', label: 'Grant Funded', description: 'Funded by grants' },
  { value: 'hybrid', label: 'Hybrid', description: 'Multiple revenue streams' },
];

const customerTypes: { value: CustomerType; label: string; description: string; icon: React.ElementType }[] = [
  { value: 'b2b', label: 'B2B', description: 'Business to Business', icon: Building2 },
  { value: 'b2c', label: 'B2C', description: 'Business to Consumer', icon: Users },
  { value: 'b2b2c', label: 'B2B2C', description: 'Business to Business to Consumer', icon: TrendingUp },
  { value: 'b2g', label: 'B2G', description: 'Business to Government', icon: Building2 },
  { value: 'hybrid', label: 'Hybrid', description: 'Multiple customer types', icon: Users },
];

const stages: { value: BusinessStage; label: string; description: string }[] = [
  { value: 'concept_prelaunch', label: 'Concept / Pre-launch', description: 'Idea stage, not yet launched' },
  { value: 'startup_validation', label: 'Startup / Validation', description: 'Early stage, validating product-market fit' },
  { value: 'early_traction', label: 'Early Traction', description: 'Has customers, finding rhythm' },
  { value: 'established', label: 'Established', description: 'Stable operations, consistent revenue' },
  { value: 'turnaround', label: 'Turnaround', description: 'Established but facing challenges' },
  { value: 'growth', label: 'Growth', description: 'Expanding rapidly' },
  { value: 'scale', label: 'Scale', description: 'Scaling operations efficiently' },
  { value: 'exit_transition', label: 'Exit / Transition', description: 'Preparing for sale or transition' },
];

export function ClassificationWizard({ businessId, onComplete }: ClassificationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classification, setClassification] = useState<ReturnType<typeof classifyBusiness> | null>(null);
  
  const [formData, setFormData] = useState<{
    organizationType: OrganizationType | '';
    businessModels: BusinessModel[];
    customerTypes: CustomerType[];
    stages: BusinessStage[];
    hasInventory?: boolean;
    hasRecurringRevenue?: boolean;
    isCapacityConstrained?: boolean;
    hasDonors?: boolean;
    hasGrants?: boolean;
    hasBoard?: boolean;
  }>({
    organizationType: '',
    businessModels: [],
    customerTypes: [],
    stages: [],
  });

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStepData.id) {
      case 'organization-type':
        return !!formData.organizationType;
      case 'business-model':
        return formData.businessModels.length > 0;
      case 'customer-type':
        return formData.customerTypes.length > 0;
      case 'stage':
        return formData.stages.length > 0;
      case 'indicators':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Calculate classification when reaching review step
      if (steps[currentStep + 1].id === 'review' && formData.organizationType) {
        const input: ClassificationInput = {
          organizationType: formData.organizationType,
          businessModels: formData.businessModels,
          customerTypes: formData.customerTypes,
          stages: formData.stages,
          hasInventory: formData.hasInventory,
          hasRecurringRevenue: formData.hasRecurringRevenue,
          isCapacityConstrained: formData.isCapacityConstrained,
          hasDonors: formData.hasDonors,
          hasGrants: formData.hasGrants,
          hasBoard: formData.hasBoard,
        };
        setClassification(classifyBusiness(input));
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!classification) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_type: formData.organizationType,
          business_models: formData.businessModels,
          customer_types: formData.customerTypes,
          stages: formData.stages,
          has_inventory: formData.hasInventory,
          has_recurring_revenue: formData.hasRecurringRevenue,
          is_capacity_constrained: formData.isCapacityConstrained,
          has_donors: formData.hasDonors,
          has_grants: formData.hasGrants,
          has_board: formData.hasBoard,
          confirm: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save classification');
      }

      onComplete();
    } catch (error) {
      console.error('Error saving classification:', error);
      alert('Failed to save classification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelection = <T extends string>(array: T[], value: T): T[] => {
    if (array.includes(value)) {
      return array.filter((v) => v !== value);
    }
    return [...array, value];
  };

  const renderStep = () => {
    switch (currentStepData.id) {
      case 'organization-type':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {organizationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.organizationType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, organizationType: type.value })}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'business-model':
        return (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {businessModels.map((model) => {
              const isSelected = formData.businessModels.includes(model.value);
              return (
                <button
                  key={model.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      businessModels: toggleSelection(formData.businessModels, model.value),
                    })
                  }
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{model.label}</h4>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'customer-type':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {customerTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = formData.customerTypes.includes(type.value);
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      customerTypes: toggleSelection(formData.customerTypes, type.value),
                    })
                  }
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium">{type.label}</h4>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'stage':
        return (
          <div className="space-y-3">
            {stages.map((stage) => {
              const isSelected = formData.stages.includes(stage.value);
              return (
                <button
                  key={stage.value}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      stages: toggleSelection(formData.stages, stage.value),
                    })
                  }
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{stage.label}</h4>
                      <p className="text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'indicators':
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">Select any additional indicators that apply:</p>
            
            {[
              { key: 'hasInventory', label: 'Manages Inventory', description: 'Business holds physical inventory', icon: Package },
              { key: 'hasRecurringRevenue', label: 'Recurring Revenue', description: 'Has subscription or recurring billing', icon: RefreshCw },
              { key: 'isCapacityConstrained', label: 'Capacity Constrained', description: 'Limited by time/people capacity', icon: Clock },
              { key: 'hasDonors', label: 'Has Donors', description: 'Receives donations from supporters', icon: Heart },
              { key: 'hasGrants', label: 'Grant Funded', description: 'Receives grant funding', icon: FileText },
              { key: 'hasBoard', label: 'Has Board', description: 'Governed by a board of directors', icon: Users2 },
            ].map((indicator) => {
              const Icon = indicator.icon;
              const isSelected = formData[indicator.key as keyof typeof formData] as boolean;
              return (
                <button
                  key={indicator.key}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      [indicator.key]: !isSelected,
                    })
                  }
                  className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4 ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{indicator.label}</h4>
                    <p className="text-sm text-muted-foreground">{indicator.description}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            {classification && (
              <>
                <div className="text-center py-6 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Recommended Pathway</p>
                  <div className="flex justify-center mb-3">
                    <PathwayBadge pathway={classification.primaryPathway} size="lg" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {Math.round(classification.confidence * 100)}%
                  </p>
                </div>

                {classification.secondaryPathways.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Secondary Pathways</h4>
                    <div className="flex flex-wrap gap-2">
                      {classification.secondaryPathways.map((pathway) => (
                        <PathwayBadge key={pathway} pathway={pathway} size="sm" />
                      ))}
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-3">Classification Details</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Organization Type</dt>
                      <dd className="capitalize">{classification.organizationType.replace('_', ' ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Business Models</dt>
                      <dd className="capitalize">{classification.businessModels.length} selected</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Customer Types</dt>
                      <dd className="uppercase">{classification.customerTypes.join(', ')}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Stages</dt>
                      <dd className="capitalize">{classification.stages.length} selected</dd>
                    </div>
                  </dl>
                </div>

                {classification.evidence.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Evidence</h4>
                    <ul className="space-y-1 text-sm">
                      {classification.evidence.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-muted-foreground">
                          • {item.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{currentStepData.title}</span>
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">{renderStep()}</div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Classification
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
