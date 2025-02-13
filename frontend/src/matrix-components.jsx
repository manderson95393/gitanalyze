import React, { useEffect, useRef } from 'react';

const MatrixRainComponent = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = new Array(Math.floor(columns)).fill(1);
    
    const matrix = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
    
    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';
      
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 opacity-50" />;
};

const GlowingCardComponent = ({ children, className = "" }) => {
  return (
    <div className={`relative overflow-hidden rounded-lg transition-all duration-300 hover:scale-[1.02] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20 animate-pulse" />
      <div className="relative bg-black/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/30">
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
      className="relative px-6 py-2 bg-green-500/20 text-green-400 rounded border border-green-500/50 
                 hover:bg-green-500/30 hover:border-green-400 transition-all duration-200
                 hover:scale-105 active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed
                 before:content-[''] before:absolute before:inset-0 before:bg-green-400/20 
                 before:opacity-0 hover:before:opacity-100 before:transition-opacity"
    >
      {children}
    </button>
  );
};

const CyberInput = ({ value, onChange, placeholder, required = false }) => {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-2 bg-black/80 text-green-400 border border-green-500/50 
                 rounded focus:ring-2 focus:ring-green-500/50 focus:border-green-400
                 placeholder-green-700 outline-none transition-all duration-200"
    />
  );
};

export { MatrixRainComponent as default, GlowingCardComponent, CyberButton, CyberInput };