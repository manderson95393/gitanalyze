import React, { useEffect, useRef } from 'react';
import { motion } from "framer-motion";

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
  const glitchAnim = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  const charAnim = {
    hidden: { opacity: 0, y: -20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  return (
    <motion.div
      className="relative my-12"
      initial="hidden"
      animate="visible"
      variants={glitchAnim}
    >
      {/* Main container */}
      <div className="relative bg-black bg-opacity-95 py-12 px-16 rounded-xl border-2 border-green-400/50 shadow-xl shadow-green-500/30">
        {/* Digital circuit pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTIwIDBMMCAyMGgyMHptMCA0MEw0MCAyMEgyMHoiIGZpbGw9IiMwMGZmMDAiLz48L3N2Zz4=')]"></div>
        
        {/* Grade label with scan line effect */}
        <div className="text-xl text-green-400 mb-6 text-center font-mono relative overflow-hidden">
          <div className="animate-scan absolute w-full h-2 bg-green-400/20"></div>
          SYSTEM EVALUATION COMPLETE
        </div>
        
        {/* Grade display */}
        <div className="text-8xl md:text-9xl font-bold text-center tracking-widest text-green-400 font-mono relative px-8">
          <div className="relative z-10 transform scale-125">
            {grade.split('').map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charAnim}
                className="inline-block relative"
                style={{
                  textShadow: '0 0 20px rgba(74, 222, 128, 0.5), 0 0 40px rgba(74, 222, 128, 0.3)'
                }}
              >
                {char}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


export { MatrixRainComponent as default, GlowingCardComponent, CyberButton, MatrixGrade };
