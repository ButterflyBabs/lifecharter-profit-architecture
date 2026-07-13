// app/(app)/businesses/[id]/classification/page.tsx
// TPA Pathway Classification Wizard Page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Hammer,
  Sprout,
  TrendingUp,
  Building2,
  RefreshCw,
  CircleDollarSign,
  Coins,
  Banknote,
  Wallet,
  CreditCard,
  Landmark,
  Gem,
  Crown,
  User,
  Users,
  UsersRound,
  Building,
  Castle,
  Search,
  Tag,
  Clock,
  Settings,
  Megaphone,
  Package,
  Heart,
  Coffee,
  Rocket,
  Handshake,
  Bed,
  Compass,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  classifyTPA,
  pathwayInfo,
  wizardSteps,
  stageOptions,
  revenueOptions,
  teamOptions,
  challengeOptions,
  intentOptions,
} from '@/lib/classification/tpa-logic';
import type { 
  TPAClassificationInput, 
  TPAPathway,
  BusinessStage,
  RevenueRange,
  TeamSize,
  PrimaryChallenge,
  GrowthIntent,
} from '@/lib/classification/tpa-types';

interface PageProps {
  params: {
    id: string;
  };
}

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  Lightbulb,
  Hammer,
  Sprout,
  TrendingUp,
  Building2,
  RefreshCw,
  CircleDollarSign,
  Coins,
  Banknote,
  Wallet,
  CreditCard,
  Landmark,
  Gem,
  Crown,
  User,
  Users,
  UsersRound,
  Building,
  Castle,
  Search,
  Tag,
  Clock,
  Settings,
  Megaphone,
  Package,
  Heart,
  Coffee,
  Rocket,
  Handshake,
  Bed,
  Compass,
  Settings2,
  Foundation: Compass,
};

export default function ClassificationPage({ params }: PageProps) {
  const router = useRouter();
  const { id: businessId } = params;
  
  const [business, setBusiness] = useState<{ name: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ReturnType<typeof classifyTPA> | null>(null);
  
  const [formData, setFormData] = useState<Partial<TPAClassificationInput>>({});

  // Fetch business data
  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch(`/api/businesses/${businessId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch business');
        }
        const data = await response.json();
        setBusiness(data.business);
        
        // Check for existing classification
        const classResponse = await fetch(`/api/businesses/${businessId}/classification`);
        if (classResponse.ok) {
          const classData = await classResponse.json();
          if (classData.classification) {
            // Pre-fill with existing data
            setFormData({
              stage: classData.classification.stage,
              revenueRange: classData.classification.revenue_range,
              teamSize: classData.classification.team_size,
              primaryChallenge: classData.classification.primary_challenge,
              growthIntent: classData.classification.growth_intent,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load business');
      } finally {
        setIsLoading(false);
      }
    }

    fetchBusiness();
  }, [businessId]);

  const handleNext = () => {
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate final classification
      if (isFormComplete(formData)) {
        const result = classifyTPA(formData as TPAClassificationInput);
        setClassificationResult(result);
        setShowResults(true);
      }
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isFormComplete(formData)) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/businesses/${businessId}/classification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: formData.stage,
          revenue_range: formData.revenueRange,
          team_size: formData.teamSize,
          primary_challenge: formData.primaryChallenge,
          growth_intent: formData.growthIntent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save classification');
      }

      router.push(`/businesses/${businessId}`);
      router.refresh();
    } catch (error) {
      console.error('Error saving classification:', error);
      setError('Failed to save classification. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormComplete = (data: Partial<TPAClassificationInput>): data is TPAClassificationInput => {
    return !!(
      data.stage &&
      data.revenueRange &&
      data.teamSize &&
      data.primaryChallenge &&
      data.growthIntent
    );
  };

  const canProceed = () => {
    const step = wizardSteps[currentStep];
    switch (step.id) {
      case 'stage':
        return !!formData.stage;
      case 'revenue':
        return !!formData.revenueRange;
      case 'team':
        return !!formData.teamSize;
      case 'challenge':
        return !!formData.primaryChallenge;
      case 'intent':
        return !!formData.growthIntent;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1F315B]" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-16">
          <p className="text-red-600 mb-4">{error || 'Business not found'}</p>
          <Link href="/businesses">
            <Button className="bg-[#1F315B]">Back to Businesses</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Results view
  if (showResults && classificationResult) {
    const pathway = pathwayInfo[classificationResult.pathway];
    
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Back link */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-sm text-[#5E3B6C] hover:text-[#1F315B] transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Questions
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF63] to-[#E8D5A3] mb-4">
            <Sparkles className="h-8 w-8 text-[#1F315B]" />
          </div>
          <h1 className="text-3xl font-bold text-[#1F315B] font-display">
            Your Pathway Revealed
          </h1>
          <p className="text-[#5E3B6C] mt-2">
            Based on your answers, here is your Profit Architecture pathway
          </p>
        </div>

        {/* Pathway Card */}
        <Card className={cn(
          "p-8 mb-8 border-2",
          pathway.bgColor,
          pathway.borderColor
        )}>
          <div className="text-center">
            {/* Pathway Number Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1F315B] text-white font-bold text-lg mb-4">
              {pathway.number}
            </div>
            
            {/* Pathway Name */}
            <h2 className={cn("text-3xl font-bold mb-2 font-display", pathway.color)}>
              Pathway {pathway.number}: {pathway.name}
            </h2>
            
            {/* Tagline */}
            <p className="text-lg text-[#5E3B6C] mb-4">{pathway.tagline}</p>
            
            {/* Confidence */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 rounded-full text-sm text-[#1F315B]">
              <CheckCircle2 className="h-4 w-4 text-[#2E7C83]" />
              Confidence: {Math.round(classificationResult.confidence * 100)}%
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 p-4 bg-white/60 rounded-lg">
            <p className="text-[#1F315B]">{pathway.description}</p>
          </div>

          {/* Focus Areas */}
          <div className="mt-6">
            <h3 className="font-semibold text-[#1F315B] mb-3">Key Focus Areas:</h3>
            <div className="flex flex-wrap gap-2">
              {pathway.focusAreas.map((area, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white/70 rounded-full text-sm text-[#5E3B6C] border border-[#D4AF63]/30"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Reasoning */}
          {classificationResult.reasoning.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-[#1F315B] mb-3">Why this pathway?</h3>
              <ul className="space-y-2">
                {classificationResult.reasoning.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5E3B6C]">
                    <span className="text-[#D4AF63] mt-1">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card className="p-6 mb-8 bg-white/80 border-[#D4AF63]/20">
          <h3 className="font-semibold text-[#1F315B] mb-4">Your Classification Summary</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#5E3B6C]">Business Stage</dt>
              <dd className="font-medium text-[#1F315B]">
                {stageOptions.find(o => o.value === formData.stage)?.label}
              </dd>
            </div>
            <div>
              <dt className="text-[#5E3B6C]">Revenue Range</dt>
              <dd className="font-medium text-[#1F315B]">
                {revenueOptions.find(o => o.value === formData.revenueRange)?.label}
              </dd>
            </div>
            <div>
              <dt className="text-[#5E3B6C]">Team Size</dt>
              <dd className="font-medium text-[#1F315B]">
                {teamOptions.find(o => o.value === formData.teamSize)?.label}
              </dd>
            </div>
            <div>
              <dt className="text-[#5E3B6C]">Primary Challenge</dt>
              <dd className="font-medium text-[#1F315B]">
                {challengeOptions.find(o => o.value === formData.primaryChallenge)?.label}
              </dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-[#5E3B6C]">Growth Intent</dt>
              <dd className="font-medium text-[#1F315B]">
                {intentOptions.find(o => o.value === formData.growthIntent)?.label}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={handleBack}
            className="border-[#1F315B] text-[#1F315B] hover:bg-[#1F315B]/5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Update Answers
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-white hover:opacity-90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm & Continue
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Wizard steps
  const currentStepData = wizardSteps[currentStep];
  const progress = ((currentStep + 1) / wizardSteps.length) * 100;

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'stage':
        return (
          <div className="grid gap-4 md:grid-cols-2">
            {stageOptions.map((option) => {
              const Icon = iconMap[option.icon || ''] || Lightbulb;
              const isSelected = formData.stage === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: option.value as BusinessStage })}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all duration-200",
                    isSelected
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 shadow-lg"
                      : "border-[#CDBFD6]/30 bg-white/60 hover:border-[#D4AF63]/50 hover:bg-white/80"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg transition-colors",
                      isSelected ? "bg-[#1F315B] text-white" : "bg-[#F6F1E8] text-[#1F315B]"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1F315B] text-lg">{option.label}</h4>
                      <p className="text-sm text-[#5E3B6C] mt-1">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-6 w-6 text-[#2E7C83] flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'revenue':
        return (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {revenueOptions.map((option) => {
              const Icon = iconMap[option.icon || ''] || CircleDollarSign;
              const isSelected = formData.revenueRange === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, revenueRange: option.value as RevenueRange })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all duration-200",
                    isSelected
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 shadow-lg"
                      : "border-[#CDBFD6]/30 bg-white/60 hover:border-[#D4AF63]/50 hover:bg-white/80"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors",
                    isSelected ? "bg-[#1F315B] text-white" : "bg-[#F6F1E8] text-[#1F315B]"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-[#1F315B]">{option.label}</h4>
                  <p className="text-xs text-[#5E3B6C] mt-1">{option.description}</p>
                </button>
              );
            })}
          </div>
        );

      case 'team':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamOptions.map((option) => {
              const Icon = iconMap[option.icon || ''] || User;
              const isSelected = formData.teamSize === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, teamSize: option.value as TeamSize })}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all duration-200",
                    isSelected
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 shadow-lg"
                      : "border-[#CDBFD6]/30 bg-white/60 hover:border-[#D4AF63]/50 hover:bg-white/80"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-lg transition-colors",
                      isSelected ? "bg-[#1F315B] text-white" : "bg-[#F6F1E8] text-[#1F315B]"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1F315B]">{option.label}</h4>
                      <p className="text-sm text-[#5E3B6C]">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[#2E7C83]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'challenge':
        return (
          <div className="grid gap-3 md:grid-cols-2">
            {challengeOptions.map((option) => {
              const Icon = iconMap[option.icon || ''] || Settings;
              const isSelected = formData.primaryChallenge === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, primaryChallenge: option.value as PrimaryChallenge })}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200",
                    isSelected
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 shadow-lg"
                      : "border-[#CDBFD6]/30 bg-white/60 hover:border-[#D4AF63]/50 hover:bg-white/80"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isSelected ? "bg-[#1F315B] text-white" : "bg-[#F6F1E8] text-[#1F315B]"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1F315B]">{option.label}</h4>
                      <p className="text-xs text-[#5E3B6C]">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[#2E7C83]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 'intent':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {intentOptions.map((option) => {
              const Icon = iconMap[option.icon || ''] || TrendingUp;
              const isSelected = formData.growthIntent === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, growthIntent: option.value as GrowthIntent })}
                  className={cn(
                    "p-5 rounded-xl border-2 text-left transition-all duration-200",
                    isSelected
                      ? "border-[#D4AF63] bg-[#D4AF63]/10 shadow-lg"
                      : "border-[#CDBFD6]/30 bg-white/60 hover:border-[#D4AF63]/50 hover:bg-white/80"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-lg transition-colors",
                      isSelected ? "bg-[#1F315B] text-white" : "bg-[#F6F1E8] text-[#1F315B]"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#1F315B]">{option.label}</h4>
                      <p className="text-sm text-[#5E3B6C] mt-1">{option.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-[#2E7C83] flex-shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/businesses/${businessId}`}
          className="inline-flex items-center text-sm text-[#5E3B6C] hover:text-[#1F315B] transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {business.name}
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1F315B] font-display">
          Business Classification
        </h1>
        <p className="text-[#5E3B6C] mt-2">
          Answer 5 questions to determine your Profit Architecture pathway
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#1F315B]">
            Step {currentStep + 1}: {currentStepData.title}
          </span>
          <span className="text-sm text-[#5E3B6C]">
            {currentStep + 1} of {wizardSteps.length}
          </span>
        </div>
        <Progress 
          value={progress} 
          className="h-2 bg-[#CDBFD6]/30"
        />
        <p className="text-sm text-[#5E3B6C] mt-2">
          {currentStepData.description}
        </p>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1F315B] font-display">
          {currentStepData.question}
        </h2>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-[#CDBFD6]/30">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
          className="border-[#1F315B] text-[#1F315B] hover:bg-[#1F315B]/5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="bg-gradient-to-r from-[#1F315B] to-[#5E3B6C] text-white hover:opacity-90 disabled:opacity-50"
        >
          {currentStep === wizardSteps.length - 1 ? (
            <>
              See Results
              <Sparkles className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
