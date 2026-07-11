/**
 * Assessments List Page
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AssessmentsPage() {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Fetch assessments
  const { data: assessments } = await supabase
    .from('tpa_assessment_runs')
    .select(`
      *,
      business:tpa_businesses(id, name),
      assignedFacilitator:assigned_facilitator_id(email)
    `)
    .order('created_at', { ascending: false });
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'submitted': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_information': return 'bg-orange-100 text-orange-800';
      case 'held': return 'bg-red-100 text-red-800';
      case 'superseded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get mode badge color
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'pulse': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comprehensive': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format score
  const formatScore = (score: number | null) => {
    if (score === null) return '-';
    return (score / 100).toFixed(2);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600 mt-1">Manage Profit Architecture assessments</p>
        </div>
        <Link
          href="/assessments/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          New Assessment
        </Link>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Assessments</p>
          <p className="text-2xl font-bold">{assessments?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {assessments?.filter(a => a.status === 'in_progress').length ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Pending Review</p>
          <p className="text-2xl font-bold text-blue-600">
            {assessments?.filter(a => a.status === 'submitted' || a.status === 'in_review').length ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Emergency Mode</p>
          <p className="text-2xl font-bold text-red-600">
            {assessments?.filter(a => a.is_emergency).length ?? 0}
          </p>
        </div>
      </div>
      
      {/* Assessments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assessment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Business
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assessments?.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        #{assessment.assessment_number}
                      </div>
                      {assessment.title && (
                        <div className="text-sm text-gray-500">{assessment.title}</div>
                      )}
                    </div>
                    {assessment.is_preliminary && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        Preliminary
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {assessment.business?.name ?? 'Unknown'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded border ${getModeColor(assessment.mode)}`}>
                    {assessment.mode === 'pulse' && 'Pulse'}
                    {assessment.mode === 'comprehensive' && 'Comprehensive'}
                    {assessment.mode === 'emergency' && 'Emergency'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(assessment.status)}`}>
                    {assessment.status.replace(/_/g, ' ')}
                  </span>
                  {assessment.is_emergency && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                      Emergency
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatScore(assessment.overall_score)}
                  </div>
                  {assessment.data_confidence > 0 && (
                    <div className="text-xs text-gray-500">
                      {assessment.data_confidence}% confidence
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(assessment.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/assessments/${assessment.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            
            {(!assessments || assessments.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No assessments found. Create your first assessment to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
