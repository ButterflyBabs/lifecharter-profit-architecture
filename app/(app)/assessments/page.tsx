/**
 * Assessments List Page - LifeCharter Brand Styling
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';

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
  
  // Get status badge color - LifeCharter Brand Colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-[#2E7C83]/10 text-[#2E7C83] border-[#2E7C83]/30';
      case 'in_review': return 'bg-[#5E3B6C]/10 text-[#5E3B6C] border-[#5E3B6C]/30';
      case 'submitted': return 'bg-[#CDBFD6]/30 text-[#5E3B6C] border-[#CDBFD6]/50';
      case 'in_progress': return 'bg-[#D4AF63]/15 text-[#1F315B] border-[#D4AF63]/30';
      case 'awaiting_information': return 'bg-[#B9A9A9]/20 text-[#1F315B] border-[#B9A9A9]/40';
      case 'held': return 'bg-red-50 text-red-700 border-red-200';
      case 'superseded': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-[#F6F1E8] text-[#1F315B] border-[#D4AF63]/20';
    }
  };
  
  // Get mode badge color
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'emergency': return 'bg-red-50 text-red-700 border-red-200';
      case 'pulse': return 'bg-[#2E7C83]/10 text-[#2E7C83] border-[#2E7C83]/30';
      case 'comprehensive': return 'bg-[#5E3B6C]/10 text-[#5E3B6C] border-[#5E3B6C]/30';
      default: return 'bg-[#F6F1E8] text-[#1F315B] border-[#D4AF63]/20';
    }
  };
  
  // Format score
  const formatScore = (score: number | null) => {
    if (score === null) return '-';
    return (score / 100).toFixed(2);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F1E8] via-[#FDFBF7] to-[#F6F1E8]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="font-editorial italic text-[#5E3B6C] text-sm mb-1">Profit Architecture</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#1F315B]">Assessments</h1>
            <p className="font-body text-[#1F315B]/60 mt-1">Manage your business architecture evaluations</p>
          </div>
          <Link
            href="/assessments/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#1F315B] to-[#2a3f6e] text-[#F6F1E8] rounded-xl font-medium hover:shadow-lg hover:shadow-[#1F315B]/25 transition-all duration-300 font-body border border-[#D4AF63]/30"
          >
            <Plus className="w-4 h-4" />
            New Assessment
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-5">
            <p className="font-body text-sm text-[#1F315B]/60">Total Assessments</p>
            <p className="font-display text-3xl font-bold text-[#1F315B]">{assessments?.length ?? 0}</p>
          </div>
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-5">
            <p className="font-body text-sm text-[#1F315B]/60">In Progress</p>
            <p className="font-display text-3xl font-bold text-[#D4AF63]">
              {assessments?.filter(a => a.status === 'in_progress').length ?? 0}
            </p>
          </div>
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-5">
            <p className="font-body text-sm text-[#1F315B]/60">Pending Review</p>
            <p className="font-display text-3xl font-bold text-[#5E3B6C]">
              {assessments?.filter(a => a.status === 'submitted' || a.status === 'in_review').length ?? 0}
            </p>
          </div>
          <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 p-5">
            <p className="font-body text-sm text-[#1F315B]/60">Emergency Mode</p>
            <p className="font-display text-3xl font-bold text-red-600">
              {assessments?.filter(a => a.is_emergency).length ?? 0}
            </p>
          </div>
        </div>
        
        {/* Assessments Table */}
        <div className="bg-[#FDFBF7] rounded-2xl shadow-sacred border border-[#D4AF63]/20 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-[#1F315B]/5 border-b border-[#D4AF63]/20">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Assessment
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Business
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Mode
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#1F315B]/70 uppercase tracking-wider font-body">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF63]/10">
              {assessments?.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-[#D4AF63]/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-body text-sm font-medium text-[#1F315B]">
                          #{assessment.assessment_number}
                        </div>
                        {assessment.title && (
                          <div className="font-body text-sm text-[#1F315B]/60">{assessment.title}</div>
                        )}
                      </div>
                      {assessment.is_preliminary && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-[#2E7C83]/10 text-[#2E7C83] rounded-full border border-[#2E7C83]/20 font-body">
                          Preliminary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-body text-sm text-[#1F315B]">
                      {assessment.business?.name ?? 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border font-body ${getModeColor(assessment.mode)}`}>
                      {assessment.mode === 'pulse' && 'Pulse'}
                      {assessment.mode === 'comprehensive' && 'Comprehensive'}
                      {assessment.mode === 'emergency' && 'Emergency'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border font-body ${getStatusColor(assessment.status)}`}>
                      {assessment.status.replace(/_/g, ' ')}
                    </span>
                    {assessment.is_emergency && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-50 text-red-700 rounded-full border border-red-200 font-body">
                        Emergency
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-body text-sm text-[#1F315B]">
                      {formatScore(assessment.overall_score)}
                    </div>
                    {assessment.data_confidence > 0 && (
                      <div className="font-body text-xs text-[#1F315B]/50">
                        {assessment.data_confidence}% confidence
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-body text-sm text-[#1F315B]/60">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-body text-sm">
                    <Link
                      href={`/assessments/${assessment.id}`}
                      className="text-[#5E3B6C] hover:text-[#1F315B] font-medium transition-colors"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              
              {(!assessments || assessments.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF63]/10 flex items-center justify-center mb-3 border border-[#D4AF63]/20">
                        <ClipboardList className="w-6 h-6 text-[#D4AF63]" />
                      </div>
                      <p className="font-body text-[#1F315B]/70">No assessments found.</p>
                      <p className="font-body text-sm text-[#1F315B]/50 mt-1">Create your first assessment to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}