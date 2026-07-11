/**
 * Assessment Detail Page
 */

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AssessmentActions } from './AssessmentActions';
import { ProgressBar } from '@/components/assessment/ProgressBar';
import { ScoreCard } from '@/components/assessment/ScoreCard';
import { GateList } from '@/components/assessment/GateList';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Fetch assessment
  const { data: assessment } = await supabase
    .from('tpa_assessment_runs')
    .select(`
      *,
      business:tpa_businesses(id, name),
      assignedFacilitator:assigned_facilitator_id(email),
      assignedReviewer:assigned_reviewer_id(email)
    `)
    .eq('id', id)
    .single();
  
  if (!assessment) {
    notFound();
  }
  
  // Fetch sections
  const { data: sections } = await supabase
    .from('tpa_assessment_sections')
    .select('*')
    .eq('assessment_id', id)
    .order('sort_order', { ascending: true });
  
  // Fetch gates
  const { data: gates } = await supabase
    .from('tpa_critical_gates')
    .select('*')
    .eq('assessment_id', id)
    .order('severity', { ascending: true });
  
  // Fetch component scores
  const { data: scores } = await supabase
    .from('tpa_component_scores')
    .select(`
      *,
      component:tpa_components(id, code, name)
    `)
    .eq('assessment_id', id)
    .order('score_version', { ascending: false });
  
  // Get latest scores only
  const latestScores = new Map();
  scores?.forEach(score => {
    if (!latestScores.has(score.component_id)) {
      latestScores.set(score.component_id, score);
    }
  });
  
  // Calculate progress
  const totalSections = sections?.length ?? 0;
  const completedSections = sections?.filter(s => s.status === 'complete' || s.status === 'provisional').length ?? 0;
  const overallProgress = totalSections > 0
    ? Math.round((sections?.reduce((sum, s) => sum + s.progress_percentage, 0) ?? 0) / totalSections)
    : 0;
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_information': return 'bg-orange-100 text-orange-800';
      case 'held': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format score
  const formatScore = (score: number | null) => {
    if (score === null) return 'N/A';
    return (score / 100).toFixed(2);
  };
  
  // Get score label
  const getScoreLabel = (score: number | null) => {
    if (score === null) return 'Unknown';
    const s = score / 100;
    if (s >= 4.5) return 'Excellent';
    if (s >= 3.5) return 'Good';
    if (s >= 2.5) return 'Fair';
    if (s >= 1.5) return 'Needs Improvement';
    return 'Critical';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Assessment #{assessment.assessment_number}
            </h1>
            <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(assessment.status)}`}>
              {assessment.status.replace(/_/g, ' ')}
            </span>
            {assessment.is_emergency && (
              <span className="px-3 py-1 text-sm font-medium rounded bg-red-100 text-red-800">
                Emergency
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {assessment.business?.name} • {assessment.mode === 'pulse' ? 'Pulse Check' : assessment.mode === 'emergency' ? 'Emergency' : 'Comprehensive'}
          </p>
          {assessment.title && (
            <p className="text-gray-700 mt-1">{assessment.title}</p>
          )}
        </div>
        
        <AssessmentActions 
          assessmentId={assessment.id}
          status={assessment.status}
          canSubmit={overallProgress >= 80}
        />
      </div>
      
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Overall Progress</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{overallProgress}%</span>
            <span className="text-sm text-gray-500 mb-1">
              ({completedSections}/{totalSections} sections)
            </span>
          </div>
          <ProgressBar progress={overallProgress} className="mt-3" />
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Overall Score</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{formatScore(assessment.overall_score)}</span>
            <span className="text-sm text-gray-500 mb-1">/ 5.00</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {getScoreLabel(assessment.overall_score)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Data Confidence</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold">{assessment.data_confidence}%</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {assessment.data_confidence >= 80 ? 'High' : assessment.data_confidence >= 60 ? 'Medium' : 'Low'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Critical Gates</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-red-600">
              {gates?.filter(g => g.status === 'open' && g.severity === 'critical').length ?? 0}
            </span>
            <span className="text-sm text-gray-500 mb-1">
              critical open
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {gates?.filter(g => g.status === 'open').length ?? 0} total open
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sections */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assessment Sections</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {sections?.map((section) => (
                <div key={section.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        section.status === 'complete' ? 'bg-green-500' :
                        section.status === 'in_progress' ? 'bg-yellow-500' :
                        section.status === 'not_applicable' ? 'bg-gray-300' :
                        'bg-gray-200'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{section.section_name}</p>
                        <p className="text-sm text-gray-500">
                          {section.answered_questions}/{section.total_questions} questions answered
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ProgressBar progress={section.progress_percentage} size="sm" className="w-24" />
                      <Link
                        href={`/assessments/${id}/sections/${section.section_key}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {section.status === 'complete' ? 'Review' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!sections || sections.length === 0) && (
                <div className="px-6 py-8 text-center text-gray-500">
                  No sections found. The assessment may still be initializing.
                </div>
              )}
            </div>
          </div>
          
          {/* Component Scores */}
          {latestScores.size > 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Component Scores</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from(latestScores.values()).map((score) => (
                  <ScoreCard
                    key={score.id}
                    name={score.component?.name ?? 'Unknown'}
                    score={score.raw_score}
                    weightedScore={score.weighted_score}
                    weight={score.weight_applied}
                    confidence={score.confidence_level}
                    dataCompleteness={score.data_completeness}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Gates & Info */}
        <div className="space-y-6">
          {/* Assessment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Assessment Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Business</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {assessment.business?.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Mode</dt>
                <dd className="text-sm font-medium text-gray-900 capitalize">
                  {assessment.mode}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {new Date(assessment.created_at).toLocaleDateString()}
                </dd>
              </div>
              {assessment.assigned_facilitator_id && (
                <div>
                  <dt className="text-sm text-gray-500">Facilitator</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {assessment.assignedFacilitator?.email}
                  </dd>
                </div>
              )}
              {assessment.submitted_at && (
                <div>
                  <dt className="text-sm text-gray-500">Submitted</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {new Date(assessment.submitted_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
          
          {/* Critical Gates */}
          <GateList 
            gates={gates?.filter(g => g.status === 'open' || g.status === 'contained') ?? []}
            assessmentId={id}
          />
          
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/assessments/${id}/scores`}
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                View Scores
              </Link>
              <Link
                href={`/assessments/${id}/gates`}
                className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Manage Gates
              </Link>
              {assessment.status === 'approved' && (
                <Link
                  href={`/assessments/${id}/report`}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Report
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
