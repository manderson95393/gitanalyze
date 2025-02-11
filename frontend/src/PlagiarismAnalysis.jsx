import React from 'react';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import PlagiarismDetector from './PlagiarismDetector';

const PlagiarismAnalysis = ({ analysis }) => {
  if (!analysis) return null;

  const detector = new PlagiarismDetector(analysis);
  const report = detector.generateReport();

  const getRiskIcon = (riskLevel) => {
    switch(riskLevel) {
      case 'High':
        return <ShieldAlert className="w-6 h-6 text-red-600" />;
      case 'Medium':
        return <Shield className="w-6 h-6 text-yellow-600" />;
      case 'Low':
        return <ShieldCheck className="w-6 h-6 text-green-600" />;
      default:
        return <Shield className="w-6 h-6 text-gray-600" />;
    }
  };

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h3 className="text-xl font-semibold text-red-900">Plagiarism Analysis</h3>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getRiskColor(report.risk_assessment.risk_level)}`}>
          {getRiskIcon(report.risk_assessment.risk_level)}
          <span className="font-medium">{report.risk_assessment.risk_level} Risk</span>
          <span className="font-bold ml-2">{Math.round(report.risk_assessment.score)}/100</span>
        </div>
      </div>

      {report.risk_assessment.red_flags.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-red-900 mb-3">Detected Issues</h4>
          <div className="space-y-3">
            {report.risk_assessment.red_flags.map((flag, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  flag.severity === 'high' 
                    ? 'bg-red-50' 
                    : flag.severity === 'medium' 
                    ? 'bg-yellow-50' 
                    : 'bg-orange-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    flag.severity === 'high' 
                      ? 'text-red-600' 
                      : flag.severity === 'medium' 
                      ? 'text-yellow-600' 
                      : 'text-orange-600'
                  }`} />
                  <span className="font-medium capitalize">{flag.severity} Risk</span>
                </div>
                <p className="mt-1 text-gray-700">{flag.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div>
          <h4 className="font-medium text-red-900 mb-3">Recommendations</h4>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            {report.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="text-gray-600">
            Total Commits: <span className="font-medium text-gray-900">{report.metadata.total_commits}</span>
          </div>
          <div className="text-gray-600">
            Contributors: <span className="font-medium text-gray-900">{report.metadata.contributor_count}</span>
          </div>
          <div className="text-gray-600">
            Languages: <span className="font-medium text-gray-900">{report.metadata.languages_used.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismAnalysis;
