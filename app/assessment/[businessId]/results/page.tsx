/**
 * Assessment Results Page
 * Displays Profit Architecture Assessment results with overall score,
 * component breakdowns, strengths, gaps, and pathway recommendations
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Sample data structure - replace with actual API call
const sampleResults = {
  overallScore: 72,
  pathway: 3, // Optimization
  pathwayName: 'Optimization',
  pathwayDescription: 'Your business has solid foundations. Time to optimize for efficiency and scale.',
  componentScores: {
    revenueArchitecture: 78,
    offerEcosystem: 62,
    pricingStrategy: 85,
    clientAcquisition: 58,
    conversionSystems: 72,
    retentionLtv: 80,
    operationalEfficiency: 52,
    teamTalent: 68,
    financialManagement: 75,
    riskCompliance: 60,
    growthInfrastructure: 48,
    ownerAlignment: 88
  }
};

// Component display names mapping
const componentNames: Record<string, string> = {
  revenueArchitecture: 'Revenue Architecture',
  offerEcosystem: 'Offer Ecosystem',
  pricingStrategy: 'Pricing Strategy',
  clientAcquisition: 'Client Acquisition',
  conversionSystems: 'Conversion Systems',
  retentionLtv: 'Retention & LTV',
  operationalEfficiency: 'Operational Efficiency',
  teamTalent: 'Team & Talent',
  financialManagement: 'Financial Management',
  riskCompliance: 'Risk & Compliance',
  growthInfrastructure: 'Growth Infrastructure',
  ownerAlignment: 'Owner Alignment'
};

// Pathway recommendations mapping
const pathwayRecommendations: Record<number, Array<{ title: string; description: string; actionSteps: string[] }>> = {
  1: [ // Foundation
    {
      title: 'Establish Core Business Fundamentals',
      description: 'Focus on creating a solid foundation before scaling.',
      actionSteps: ['Define your core offer', 'Set up basic financial tracking', 'Document key processes']
    },
    {
      title: 'Clarify Your Value Proposition',
      description: 'Ensure your messaging resonates with your ideal client.',
      actionSteps: ['Identify ideal client avatar', 'Craft compelling messaging', 'Test value proposition']
    },
    {
      title: 'Build Initial Systems',
      description: 'Create repeatable processes for consistency.',
      actionSteps: ['Document client onboarding', 'Create SOPs for key tasks', 'Set up project management']
    }
  ],
  2: [ // Stabilization
    {
      title: 'Stabilize Cash Flow',
      description: 'Create predictable revenue streams.',
      actionSteps: ['Implement recurring revenue models', 'Reduce payment delays', 'Build cash reserves']
    },
    {
      title: 'Strengthen Client Retention',
      description: 'Keep the clients you have while acquiring new ones.',
      actionSteps: ['Create client success program', 'Implement regular check-ins', 'Address churn triggers']
    },
    {
      title: 'Operational Discipline',
      description: 'Build consistency in delivery and operations.',
      actionSteps: ['Standardize service delivery', 'Create quality checkpoints', 'Train team on standards']
    }
  ],
  3: [ // Optimization
    {
      title: 'Streamline Operations',
      description: 'Improve efficiency to increase margins without sacrificing quality.',
      actionSteps: ['Audit current workflows for bottlenecks', 'Automate repetitive tasks', 'Implement performance metrics']
    },
    {
      title: 'Optimize Pricing Strategy',
      description: 'Capture more value without losing clients.',
      actionSteps: ['Analyze competitor pricing', 'Test value-based pricing tiers', 'Create premium offerings']
    },
    {
      title: 'Enhance Client Experience',
      description: 'Increase satisfaction and lifetime value.',
      actionSteps: ['Map and improve client journey', 'Add surprise-and-delight moments', 'Implement feedback loops']
    },
    {
      title: 'Scale Marketing Systems',
      description: 'Create predictable client acquisition.',
      actionSteps: ['Document winning campaigns', 'Build content engine', 'Optimize conversion funnels']
    }
  ],
  4: [ // Acceleration
    {
      title: 'Scale Your Team',
      description: 'Build the capacity to serve more clients at high quality.',
      actionSteps: ['Hire A-players for key roles', 'Create leadership development plan', 'Build culture of excellence']
    },
    {
      title: 'Expand Market Reach',
      description: 'Enter new markets or segments.',
      actionSteps: ['Research adjacent markets', 'Adapt offerings for new segments', 'Launch market entry campaign']
    },
    {
      title: 'Systematize Growth',
      description: 'Create repeatable growth engines.',
      actionSteps: ['Build partnership channel', 'Create referral systems', 'Implement growth experiments']
    }
  ],
  5: [ // Market Leadership
    {
      title: 'Establish Thought Leadership',
      description: 'Become the go-to authority in your space.',
      actionSteps: ['Publish authoritative content', 'Speak at industry events', 'Build personal brand']
    },
    {
      title: 'Strategic Partnerships',
      description: 'Leverage alliances for exponential growth.',
      actionSteps: ['Identify strategic partners', 'Create win-win collaborations', 'Build ecosystem approach']
    },
    {
      title: 'Innovate Your Model',
      description: 'Stay ahead through continuous innovation.',
      actionSteps: ['Research industry trends', 'Pilot new service models', 'Invest in R&D']
    }
  ],
  6: [ // Legacy & Exit
    {
      title: 'Build Transferable Value',
      description: 'Create a business that thrives without you.',
      actionSteps: ['Document all IP and processes', 'Build leadership team', 'Reduce owner dependency']
    },
    {
      title: 'Succession Planning',
      description: 'Prepare for smooth leadership transition.',
      actionSteps: ['Identify and develop successors', 'Create transition timeline', 'Document tribal knowledge']
    },
    {
      title: 'Exit Strategy Execution',
      description: 'Maximize value for your exit event.',
      actionSteps: ['Get business valuation', 'Prepare documentation', 'Engage M&A advisors']
    }
  ]
};

// Score interpretation
const getScoreInterpretation = (score: number): string => {
  if (score >= 85) return 'Excellent foundation with minor refinements needed';
  if (score >= 70) return 'Strong foundation with room for optimization';
  if (score >= 55) return 'Good start with clear areas for improvement';
  if (score >= 40) return 'Basic foundation established, significant growth opportunity';
  return 'Critical attention needed to build core business fundamentals';
};

// Progress bar component
function ScoreProgressBar({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }[size];

  // Color based on score
  const getColorClass = (s: number) => {
    if (s >= 80) return 'bg-green-500';
    if (s >= 60) return 'bg-brand-warm-gold';
    if (s >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`flex-1 bg-gray-200 rounded-full ${heightClass}`}>
      <div
        className={`${getColorClass(score)} ${heightClass} rounded-full transition-all duration-500`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

// Component score item
function ComponentScoreItem({ name, score }: { name: string; score: number }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-brand-deep-indigo">{name}</span>
          <span className="font-semibold text-brand-deep-indigo">{score}%</span>
        </div>
        <ScoreProgressBar score={score} />
      </div>
    </div>
  );
}

// Strength/Gap card
function InsightCard({ 
  title, 
  score, 
  description, 
  type 
}: { 
  title: string; 
  score: number; 
  description: string; 
  type: 'strength' | 'gap';
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      type === 'strength' 
        ? 'bg-green-50 border-green-200' 
        : 'bg-orange-50 border-orange-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-brand-deep-indigo">{title}</h4>
        <span className={`px-2 py-1 rounded text-sm font-medium ${
          type === 'strength'
            ? 'bg-green-100 text-green-800'
            : 'bg-orange-100 text-orange-800'
        }`}>
          {score}%
        </span>
      </div>
      <p className={`text-sm ${
        type === 'strength' ? 'text-green-700' : 'text-orange-700'
      }`}>
        &ldquo;{description}&rdquo;
      </p>
    </div>
  );
}

// Recommendation card
function RecommendationCard({ 
  title, 
  description, 
  actionSteps 
}: { 
  title: string; 
  description: string; 
  actionSteps: string[];
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sacred border border-brand-warm-gold/20">
      <h4 className="font-semibold text-brand-deep-indigo text-lg mb-2">{title}</h4>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-deep-indigo">Action Steps:</p>
        <ul className="space-y-1">
          {actionSteps.map((step, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-brand-warm-gold mt-0.5">•</span>
              {step}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function AssessmentResultsPage() {
  const params = useParams();
  const businessId = params.businessId as string;
  const [results, setResults] = useState(sampleResults);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading - replace with actual API call
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Get sorted components for strengths and gaps
  const sortedComponents = Object.entries(results.componentScores)
    .sort(([, a], [, b]) => b - a);

  const topStrengths = sortedComponents.slice(0, 3);
  const topGaps = sortedComponents.slice(-3).reverse();

  // Strength descriptions
  const strengthDescriptions: Record<string, string> = {
    revenueArchitecture: 'Your revenue model is well-structured and diversified',
    offerEcosystem: 'Your offers work together to serve clients at multiple levels',
    pricingStrategy: 'Your pricing reflects the value you deliver',
    clientAcquisition: 'You have effective channels for attracting ideal clients',
    conversionSystems: 'Your sales process converts prospects consistently',
    retentionLtv: 'You keep clients and maximize their lifetime value',
    operationalEfficiency: 'Your operations run smoothly with minimal waste',
    teamTalent: 'You have the right people in the right roles',
    financialManagement: 'Your financial systems support smart decisions',
    riskCompliance: 'You\'re protected against key business risks',
    growthInfrastructure: 'You have systems needed to scale effectively',
    ownerAlignment: 'You\'re clear on your vision and aligned with your business purpose'
  };

  // Gap descriptions
  const gapDescriptions: Record<string, string> = {
    revenueArchitecture: 'Diversify and strengthen your revenue streams',
    offerEcosystem: 'Create offers that serve clients at multiple levels',
    pricingStrategy: 'Adjust pricing to better reflect your value',
    clientAcquisition: 'Improve marketing to attract ideal clients',
    conversionSystems: 'Optimize your sales process for better conversion',
    retentionLtv: 'Implement strategies to increase client lifetime value',
    operationalEfficiency: 'Streamline operations for better margins',
    teamTalent: 'Build the team capacity you need to grow',
    financialManagement: 'Strengthen financial tracking and planning',
    riskCompliance: 'Address compliance gaps to protect your business',
    growthInfrastructure: 'Systems needed to scale effectively',
    ownerAlignment: 'Clarify your vision and align your business model'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-sacred flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-warm-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-deep-indigo font-medium">Loading your results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-sacred">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-brand-deep-indigo mb-2">
            Your Profit Architecture Score
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Based on your assessment responses, here&apos;s how your business measures up across 12 critical components.
          </p>
        </div>

        {/* Hero Section - Overall Score */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-sacred-lg p-8 md:p-12 text-center border border-brand-warm-gold/30">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-brand-ivory-light to-white shadow-gold-lg border-4 border-brand-warm-gold/30">
                <div>
                  <span className="block text-5xl md:text-6xl font-bold text-brand-deep-indigo">
                    {results.overallScore}
                  </span>
                  <span className="text-gray-400 text-lg">/ 100</span>
                </div>
              </div>
            </div>
            
            <p className="text-xl md:text-2xl font-editorial italic text-brand-deep-indigo mb-6">
              &ldquo;{getScoreInterpretation(results.overallScore)}&rdquo;
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <button className="px-6 py-3 rounded-xl border-2 border-brand-deep-indigo text-brand-deep-indigo font-medium hover:bg-brand-deep-indigo hover:text-white transition-all">
                Retake Assessment
              </button>
              <button className="btn-gold">
                Download Report
              </button>
            </div>
          </div>
        </div>

        {/* Component Scores Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-sacred p-6 md:p-8 border border-brand-warm-gold/20">
            <h2 className="font-display text-2xl font-bold text-brand-deep-indigo mb-6 text-center">
              Component Breakdown
            </h2>
            <div className="space-y-2 divide-y divide-gray-100">
              {Object.entries(results.componentScores).map(([key, score]) => (
                <ComponentScoreItem 
                  key={key} 
                  name={componentNames[key]} 
                  score={score} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Strengths */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-sacred p-6 md:p-8 border border-brand-warm-gold/20">
            <h2 className="font-display text-2xl font-bold text-brand-deep-indigo mb-2 text-center">
              Your Top 3 Strengths
            </h2>
            <p className="text-gray-600 text-center mb-6">
              These are your competitive advantages — leverage them as you grow.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {topStrengths.map(([key, score]) => (
                <InsightCard
                  key={key}
                  title={componentNames[key]}
                  score={score}
                  description={strengthDescriptions[key]}
                  type="strength"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Top 3 Priority Gaps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-2xl shadow-sacred p-6 md:p-8 border border-brand-warm-gold/20">
            <h2 className="font-display text-2xl font-bold text-brand-deep-indigo mb-2 text-center">
              Top 3 Priority Gaps
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Focus here first for the biggest impact on your business.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              {topGaps.map(([key, score]) => (
                <InsightCard
                  key={key}
                  title={componentNames[key]}
                  score={score}
                  description={gapDescriptions[key]}
                  type="gap"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Pathway Recommendations */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-brand-deep-indigo to-brand-royal-plum rounded-2xl shadow-sacred-lg p-6 md:p-8 text-white">
            <div className="text-center mb-8">
              <span className="inline-block px-4 py-1 bg-brand-warm-gold/20 rounded-full text-brand-warm-gold text-sm font-medium mb-3">
                Your Pathway: {results.pathwayName}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
                Recommended Next Steps
              </h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                {results.pathwayDescription}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {pathwayRecommendations[results.pathway]?.map((rec, index) => (
                <RecommendationCard
                  key={index}
                  title={rec.title}
                  description={rec.description}
                  actionSteps={rec.actionSteps}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sacred p-6 md:p-8 border border-brand-warm-gold/20">
            <h2 className="font-display text-xl font-bold text-brand-deep-indigo mb-6 text-center">
              Ready to Take Action?
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href={`/assessment/${businessId}/download`}
                className="btn-gold inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Full Report
              </Link>
              <Link 
                href={`/assessment/${businessId}/action-plan`}
                className="px-6 py-3 rounded-xl border-2 border-brand-sacred-teal text-brand-sacred-teal font-medium hover:bg-brand-sacred-teal hover:text-white transition-all inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Create Action Plan
              </Link>
              <Link 
                href="/dashboard"
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-all inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
