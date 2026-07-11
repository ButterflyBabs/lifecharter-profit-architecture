'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AssessmentActionsProps {
  assessmentId: string;
  status: string;
  canSubmit: boolean;
}

export function AssessmentActions({ assessmentId, status, canSubmit }: AssessmentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start assessment');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit assessment');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve assessment');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
      
      <div className="flex gap-2">
        {status === 'draft' && (
          <button
            onClick={handleStart}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Start Assessment'}
          </button>
        )}

        {(status === 'in_progress' || status === 'awaiting_information') && (
          <button
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}

        {(status === 'submitted' || status === 'in_review') && (
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  );
}
