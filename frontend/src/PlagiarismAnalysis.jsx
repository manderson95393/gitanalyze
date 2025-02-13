import React from 'react';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';


const PlagiarismAnalysis = ({ analysis }) => {
  console.log("PlagiarismAnalysis received props:", {
    hasAnalysis: !!analysis,
    analysisKeys: analysis ? Object.keys(analysis) : [],
    hasPlagiarismAnalysis: analysis?.plagiarism_analysis ? true : false,
    plagiarismKeys: analysis?.plagiarism_analysis ? Object.keys(analysis.plagiarism_analysis) : []
  });

  
  if (!analysis?.plagiarism_analysis) return null;

  const { risk_assessment, metadata, recommendations } = analysis.plagiarism_analysis;

  const getRiskIcon = (riskLevel) => {
    switch(riskLevel) {
      case 'Beware':
        return <ShieldAlert className="w-6 h-6 text-red-600" />;
      case 'Average':
        return <Shield className="w-6 h-6 text-yellow-600" />;
      case 'Good':
        return <ShieldCheck className="w-6 h-6 text-green-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'Beware':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Average':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Good':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high':
        return 'bg-red-50 text-red-600';
      case 'medium':
        return 'bg-yellow-50 text-yellow-600';
      case 'low':
        return 'bg-orange-50 text-orange-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-semibold text-red-900">Plagiarism Analysis</h3>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getRiskColor(risk_assessment.risk_level)}`}>
          {getRiskIcon(risk_assessment.risk_level)}
          <span className="font-medium">{risk_assessment.risk_level}</span>
          <span className="font-bold ml-2">{risk_assessment.score}/100</span>
        </div>
      </div>

      {/* Repository Age Warning */}
      {metadata.repository_age_days <= 30 && (
        <div className="mb-4 flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-sm">
          <Clock className="w-5 h-5 mr-2" />
          <div>
            <span className="font-semibold">Warning:</span>
            <span className="ml-1">
              New Repository - {metadata.repository_age_days} days old
            </span>
          </div>
        </div>
      )}

      {/* Red Flags Section */}
      {risk_assessment.red_flags.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-red-900 mb-3">Detected Issues</h4>
          <div className="space-y-3">
            {risk_assessment.red_flags.map((flag, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${getSeverityColor(flag.severity)}`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium capitalize">{flag.severity} Risk</span>
                </div>
                <p className="mt-1 text-gray-700">{flag.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Section */}
      <div className="mb-6">
        <h4 className="font-medium text-red-900 mb-3">Detailed Analysis</h4>
        <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
          {risk_assessment.ai_analysis}
        </div>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-red-900 mb-3">Recommendations</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-gray-600">
            Total Commits: <span className="font-medium text-gray-900">{metadata.total_commits}</span>
          </div>
          <div className="text-gray-600">
            Contributors: <span className="font-medium text-gray-900">{metadata.contributor_count}</span>
          </div>
          <div className="text-gray-600">
            Repository Age: <span className="font-medium text-gray-900">{metadata.repository_age_days} days</span>
          </div>
          <div className="text-gray-600">
            Languages: <span className="font-medium text-gray-900">{metadata.languages_used.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismAnalysis;