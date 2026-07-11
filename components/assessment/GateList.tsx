/**
 * Gate List Component
 */

interface Gate {
  id: string;
  gate_key: string;
  title: string;
  description: string | null;
  gate_category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: string;
  blocks_growth: boolean;
  blocks_assessment_submission: boolean;
  target_resolution_date: string | null;
}

interface GateListProps {
  gates: Gate[];
  assessmentId: string;
}

export function GateList({ gates }: GateListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return '💰';
      case 'operational': return '⚙️';
      case 'legal': return '⚖️';
      case 'founder': return '👤';
      case 'market': return '📈';
      case 'team': return '👥';
      case 'strategic': return '🎯';
      default: return '⚠️';
    }
  };
  
  if (gates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Critical Gates</h3>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-500">No open critical gates</p>
          <p className="text-sm text-gray-400 mt-1">All gates have been resolved or accepted</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Critical Gates</h3>
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
            {gates.length} open
          </span>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {gates.map((gate) => (
          <div key={gate.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getCategoryIcon(gate.gate_category)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-gray-900">{gate.title}</h4>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded border ${getSeverityColor(gate.severity)}`}>
                    {gate.severity}
                  </span>
                  {gate.blocks_growth && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800">
                      Blocks Growth
                    </span>
                  )}
                </div>
                {gate.description && (
                  <p className="text-sm text-gray-600 mt-1">{gate.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="capitalize">{gate.gate_category}</span>
                  {gate.target_resolution_date && (
                    <span>
                      Target: {new Date(gate.target_resolution_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
