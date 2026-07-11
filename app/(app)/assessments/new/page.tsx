/**
 * New Assessment Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Business {
  id: string;
  name: string;
}

interface MethodologyVersion {
  id: string;
  version_number: string;
  status: string;
}

export default function NewAssessmentPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [methodologies, setMethodologies] = useState<MethodologyVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    businessId: '',
    methodologyVersionId: '',
    mode: 'comprehensive' as 'pulse' | 'comprehensive' | 'emergency',
    title: '',
    description: ''
  });
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      // Fetch businesses
      const businessesRes = await fetch('/api/businesses');
      if (businessesRes.ok) {
        const businessesData = await businessesRes.json();
        setBusinesses(businessesData.businesses ?? []);
      }
      
      // Fetch active methodology versions
      const methodologiesRes = await fetch('/api/methodology/versions?status=active');
      if (methodologiesRes.ok) {
        const methodologiesData = await methodologiesRes.json();
        setMethodologies(methodologiesData.versions ?? []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: formData.businessId,
          methodologyVersionId: formData.methodologyVersionId,
          mode: formData.mode,
          title: formData.title || undefined,
          description: formData.description || undefined
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assessment');
      }
      
      const data = await response.json();
      router.push(`/assessments/${data.assessment.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Assessment</h1>
        <p className="text-gray-600 mb-8">Create a new Profit Architecture assessment</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Selection */}
          <div>
            <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-1">
              Business *
            </label>
            <select
              id="businessId"
              value={formData.businessId}
              onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a business</option>
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>
                  {business.name}
                </option>
              ))}
            </select>
            {businesses.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                No businesses found. Please create a business first.
              </p>
            )}
          </div>
          
          {/* Methodology Version */}
          <div>
            <label htmlFor="methodologyVersionId" className="block text-sm font-medium text-gray-700 mb-1">
              Methodology Version *
            </label>
            <select
              id="methodologyVersionId"
              value={formData.methodologyVersionId}
              onChange={(e) => setFormData({ ...formData, methodologyVersionId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a methodology version</option>
              {methodologies.map((version) => (
                <option key={version.id} value={version.id}>
                  Version {version.version_number}
                </option>
              ))}
            </select>
          </div>
          
          {/* Assessment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Mode *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                formData.mode === 'pulse' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="pulse"
                  checked={formData.mode === 'pulse'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'pulse' })}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">Pulse Check</div>
                <div className="text-sm text-gray-500 mt-1">15-30 min quick assessment</div>
                <div className="text-xs text-blue-600 mt-2">Preliminary results</div>
              </label>
              
              <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                formData.mode === 'comprehensive' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="comprehensive"
                  checked={formData.mode === 'comprehensive'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'comprehensive' })}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">Comprehensive</div>
                <div className="text-sm text-gray-500 mt-1">2-4 hour full assessment</div>
                <div className="text-xs text-green-600 mt-2">Complete analysis</div>
              </label>
              
              <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                formData.mode === 'emergency' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="mode"
                  value="emergency"
                  checked={formData.mode === 'emergency'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as 'emergency' })}
                  className="sr-only"
                />
                <div className="font-medium text-gray-900">Emergency</div>
                <div className="text-sm text-gray-500 mt-1">Crisis stabilization</div>
                <div className="text-xs text-red-600 mt-2">Blocks growth</div>
              </label>
            </div>
          </div>
          
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Q4 2024 Assessment"
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional context about this assessment..."
            />
          </div>
          
          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/assessments')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.businessId || !formData.methodologyVersionId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
