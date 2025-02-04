import React from 'react';
import { Check, X, AlertTriangle, Star } from 'lucide-react';

const StarRating = ({ score }) => {
  const getNumericScore = (scoreText) => {
    switch (scoreText) {
      case 'Excellent': return 4.5;
      case 'Good': return 3.5;
      case 'Average': return 2.5;
      case 'Poor': return 2;
      case 'Bad': return 1;
      default: return 0;
    }
  };

  const numericScore = getNumericScore(score);
  const totalStars = 5;

  return (
    <div className="flex items-center space-x-1">
      {[...Array(totalStars)].map((_, index) => {
        const isFilled = index + 1 <= Math.floor(numericScore);
        const isHalf = !isFilled && index + 1 <= Math.ceil(numericScore) && numericScore % 1 !== 0;
        
        return (
          <Star
            key={index}
            className={`w-4 h-4 ${
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : isHalf 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
            }`}
            fill={isFilled || isHalf ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
        );
      })}
    </div>
  );
};

const ScoreBadge = ({ score }) => {
  const scoreConfig = {
    'Excellent': { color: 'bg-purple-100 text-purple-800', icon: Check },
    'Good': { color: 'bg-green-100 text-green-800', icon: Check },
    'Average': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
    'Poor': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    'Bad': { color: 'bg-red-100 text-red-800', icon: X }
  };

  const config = scoreConfig[score] || scoreConfig['Average'];
  const Icon = config.icon;

  return (
    <div className="flex items-center space-x-4">
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium">{score}</span>
      </div>
      <StarRating score={score} />
    </div>
  );
};

export default ScoreBadge;