import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20"
    >
      <div className="text-center py-8">
        <h2 className="text-4xl font-mono font-bold text-green-400 mb-4">
          Analyzing<span className="inline-block w-12 text-left">{dots}</span>
        </h2>
        <p className="text-gray-400 text-lg">Please wait while we analyze the new repository</p>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
