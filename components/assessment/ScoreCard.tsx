/**
 * Score Card Component
 */

interface ScoreCardProps {
  name: string;
  score: number | null; // 0-500 scale
  weightedScore?: number | null;
  weight: number;
  confidence?: string | null;
  dataCompleteness?: number | null;
}

export function ScoreCard({
  name,
  score,
  weightedScore,
  weight,
  confidence,
  dataCompleteness
}: ScoreCardProps) {
  // Convert 0-500 to 0-5 scale for display
  const displayScore = score !== null ? (score / 100).toFixed(2) : 'N/A';
  const displayWeighted = weightedScore !== null && weightedScore !== undefined
    ? (weightedScore / 100).toFixed(2)
    : null;
  
  // Get color based on score
  const getScoreColor = (s: number | null) => {
    if (s === null) return 'text-gray-400';
    const normalized = s / 100;
    if (normalized >= 4) return 'text-green-600';
    if (normalized >= 3) return 'text-blue-600';
    if (normalized >= 2) return 'text-yellow-600';
    if (normalized >= 1) return 'text-orange-600';
    return 'text-red-600';
  };
  
  // Get confidence color
  const getConfidenceColor = (c: string | null | undefined) => {
    switch (c) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900">{name}</h4>
        <span className="text-xs text-gray-500">{weight}% weight</span>
      </div>
      
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {displayScore}
        </span>
        <span className="text-sm text-gray-400">/ 5.00</span>
        {displayWeighted && displayWeighted !== displayScore && (
          <span className="text-sm text-gray-500">
            (weighted: {displayWeighted})
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-xs">
        {confidence && (
          <span className={`px-2 py-0.5 rounded ${getConfidenceColor(confidence)}`}>
            {confidence} confidence
          </span>
        )}
        {dataCompleteness !== null && dataCompleteness !== undefined && (
          <span className="text-gray-500">
            {Math.round(dataCompleteness)}% complete
          </span>
        )}
      </div>
    </div>
  );
}
