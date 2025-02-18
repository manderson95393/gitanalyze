import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";
import { Shield,ShieldCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const MatrixRainComponent = () => {
  const canvasRef = useRef(null);
  const dropsRef = useRef(null);
  const speedsRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const fontSize = 14;
    
    const initializeArrays = () => {
      const columns = Math.floor(canvas.width / fontSize);
      dropsRef.current = new Array(columns).fill(1);
      speedsRef.current = new Array(columns).fill(0).map(() => Math.random() * 0.5 + 0.5);
    };
    
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeArrays(); // Reinitialize arrays when canvas size changes
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // More varied character set including both katakana and Latin
    const matrix = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF♔⚡☆∞❤✓♠♥";
    
    // Create gradient for the fade effect
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0F0');
      gradient.addColorStop(0.9, '#0F0');
      gradient.addColorStop(1, '#040');
      return gradient;
    };

    const draw = () => {
      // Darker fade effect for better contrast
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const gradient = createGradient();
      
      for (let i = 0; i < dropsRef.current.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        
        // Vary the brightness for first character
        if (dropsRef.current[i] === 1) {
          ctx.fillStyle = '#FFF'; // Brightest white for leading character
        } else if (dropsRef.current[i] < 5) {
          ctx.fillStyle = '#9F9'; // Lighter green for recent characters
        } else {
          ctx.fillStyle = gradient; // Normal matrix green for older characters
        }
        
        ctx.font = fontSize + 'px "Courier New", monospace';
        ctx.fillText(text, i * fontSize, dropsRef.current[i] * fontSize);
        
        // Reset drops at random heights with speed variation
        if (dropsRef.current[i] * fontSize > canvas.height && Math.random() > 0.975) {
          dropsRef.current[i] = 0;
          speedsRef.current[i] = Math.random() * 0.5 + 0.5; // Randomize speed when resetting
        }
        
        dropsRef.current[i] += speedsRef.current[i];
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-70" />;
};

const GlowingCardComponent = ({ children, className = '' }) => {
  return (
    <div className={`relative max-w-sm mx-auto ${className}`}>
      {/* Main content */}
      <div className="bg-black bg-opacity-90 backdrop-blur-lg rounded-xl border border-green-500/30 shadow-lg relative z-10 p-6">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-green-400/10 rounded-xl"></div>
        {children}
      </div>
      {/* Ultra-tight glow effect */}
      <div className="absolute -inset-[0.5px] bg-green-500 blur-[1px] opacity-30 animate-pulse rounded-xl"></div>
    </div>
  );
}

const GlowingCardComponent2 = ({ children, className = '' }) => {
  return (
    <div className={`relative max-w-sm mx-auto ${className}`}>
      {/* Outer glow layer */}
      <div className="absolute -inset-0.5 bg-green-500 blur-[0.5px] opacity-75 animate-pulse rounded-lg" />
      
      {/* Inner glow layer */}
      <div className="absolute -inset-[0.5px] bg-green-400 blur-[0.5px] opacity-50 animate-pulse rounded-lg" />
      
      {/* Main content */}
      <div className="bg-black bg-opacity-90 backdrop-blur-lg rounded-lg border border-green-500/70 shadow-lg relative z-10 p-4">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-green-400/30 rounded-lg" />
        {children}
      </div>
    </div>
  );
};

const CyberButton = ({ children, onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative group px-6 py-2 bg-green-500/20 text-green-400 rounded border border-green-500/50 
                 hover:bg-green-500/30 hover:border-green-400 transition-all duration-200
                 hover:scale-105 active:scale-95 overflow-hidden
                 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/30 to-green-400/0 
                      translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      <div className="relative z-10">{children}</div>
    </button>
  );
};


const MatrixGrade = ({ grade }) => {
  // Calculate color and icon based on grade
  const getGradeConfig = (grade) => {
    const configs = {
      Excellent: { 
        colorClass: 'text-green-400 border-green-400 bg-green-400', 
        icon: ShieldCheck,  
        message: 'Strong Security', 
        riskLevel: 'Low',  
        securityScore: 'Strong'  
      },
      Good: { 
        colorClass: 'text-green-400 border-green-400 bg-green-400', 
        icon: ShieldCheck,  
        message: 'Strong Security', 
        riskLevel: 'Low',  
        securityScore: 'Strong' 
      },
      Average: { 
        colorClass: 'text-yellow-400 border-yellow-400 bg-yellow-400',
        icon: AlertCircle, 
        message: 'Moderate Risk',
        riskLevel: 'Medium',
        securityScore: 'Moderate'
      },
      Caution: { 
        colorClass: 'text-orange-400 border-orange-400 bg-orange-400',
        icon: AlertCircle, 
        message: 'High Risk',
        riskLevel: 'High',
        securityScore: 'Poor'
      },
      Beware: { 
        colorClass: 'text-red-400 border-red-400 bg-red-400',
        icon: XCircle, 
        message: 'Critical Risk',
        riskLevel: 'Critical',
        securityScore: 'Critical'
      }
    };
    return configs[grade] || configs.Average;
  };

  const config = getGradeConfig(grade);
  const IconComponent = config.icon;
  const [textColor, borderColor, bgColor] = config.colorClass.split(' ');

  const containerAnim = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const pulseAnim = {
    hidden: { scale: 0.95, opacity: 0.5 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <motion.div
      className="my-12"
      initial="hidden"
      animate="visible"
      variants={containerAnim}
    >
      <div className={`relative bg-gray-900 rounded-2xl ${borderColor} border shadow-2xl overflow-hidden`}>
        {/* Hexagonal background pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute inset-0">
            <pattern
              id="hex" 
              x="0" 
              y="0" 
              width="20" 
              height="20" 
              patternUnits="userSpaceOnUse"
              className={textColor}
            >
              <path d="M10 1L19 5.5L19 14.5L10 19L1 14.5L1 5.5L10 1Z"/>
            </pattern>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#hex)"/>
          </svg>
        </div>

        {/* Content */}
        <div className="relative p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-block mb-4"
              variants={pulseAnim}
            >
              <IconComponent className={`w-16 h-16 ${textColor}`} />
            </motion.div>
            <h3 className="text-xl font-medium text-gray-200 mb-2">
              Repository Security Score
            </h3>
            <p className={`text-lg ${textColor}`}>
              {config.message}
            </p>
          </div>

          {/* Grade Display */}
          <div className="text-center">
            <motion.div 
              className={`text-9xl font-bold ${textColor} font-mono tracking-wider`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              {grade}
            </motion.div>
          </div>

          {/* Grade Context */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Overall Score</div>
              <div className={`text-lg font-medium ${textColor}`}>
                {grade}
              </div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Security Score</div>
              <div className={`text-lg font-medium ${textColor}`}>
                {config.securityScore}
              </div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-400">Risk Level</div>
              <div className={`text-lg font-medium ${textColor}`}>
                {config.riskLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Glowing border effect */}
        <motion.div
          className={`absolute inset-0 opacity-20 ${bgColor}`}
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </div>
    </motion.div>
  );
};

export { MatrixRainComponent as default, GlowingCardComponent, GlowingCardComponent2, CyberButton, MatrixGrade };
