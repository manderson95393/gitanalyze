import { useState, useEffect, useRef } from 'react';
import { GithubIcon, Search, BarChart2, GitFork, Star, Clock, Users, Database, Brain, Check, X, AlertTriangle } from 'lucide-react';

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ScoreBadge = ({ score, numericScore }) => {
  const scoreConfig = {
    'Good': { color: 'bg-green-100 text-green-800', icon: Check },
    'Average': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
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
      <div className="text-lg font-semibold">
        {numericScore}/5
      </div>
    </div>
  );
};

const AIAnalysis = ({ aiAnalysis }) => {
  if (!aiAnalysis) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-green-900">AI Analysis</h3>
        </div>
        <ScoreBadge score={aiAnalysis.score} numericScore={aiAnalysis.numeric_score} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {Object.entries(aiAnalysis.score_breakdown).map(([category, score]) => (
          <div key={category} className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-800 capitalize">{category}</div>
            <div className="text-lg font-semibold text-green-900">{(score * 5).toFixed(1)}/5</div>
            <div className="w-full bg-green-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${score * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-green-900 mb-2">Key Strengths</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-green-900 mb-2">Areas for Improvement</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.areas_for_improvement.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-green-900 mb-2">Recommendations</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Matrix rain parameters
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = new Array(Math.floor(columns)).fill(1);
    
    // Characters to use in the rain
    const matrix = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789";
    
    // Animation function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // Increased fade for more contrast
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'rgba(0, 255, 65, 0.35)'; // Semi-transparent Matrix green
      ctx.font = fontSize + 'px monospace';
      
      // Draw rain
      for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    // Run animation
    const interval = setInterval(draw, 33);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

const LandingPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <ParticleBackground />
      
      <div className="text-center space-y-8 p-8 relative z-10">
        <div className="flex items-center justify-center space-x-4">
          <GithubIcon className="w-12 h-12 text-green-400" />
          <h1 className="text-4xl font-bold text-green-400 font-mono">Repo Analyzer</h1>
        </div>
        
        <p className="text-xl text-green-300 max-w-2xl font-mono">
          Analyze GitHub repositories with AI-powered insights. Get detailed metrics, code quality analysis, and actionable recommendations.
        </p>
        
        <div className="relative">
          <a 
            href="http://localhost:5000/login/github" 
            className="inline-flex items-center space-x-3 px-6 py-3 bg-black/50 border border-green-400/50 text-green-400 rounded-lg hover:bg-green-900/20 hover:border-green-400 transition-all duration-200 text-lg font-mono"
          >
            <GithubIcon className="w-6 h-6" />
            <span>Login with GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
};

const MainContent = ({ user, stats, loading, repoUrl, setRepoUrl, handleAnalyze, error, analysis, analysisInfo, onLogout }) => {
  const renderAnalysis = (analysis, analysisInfo) => {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-200 hover:shadow-lg transition-shadow duration-200">
          {analysisInfo.cached && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-green-800 bg-green-50 p-2 rounded">
              <Database className="w-4 h-4" />
              <span>Analysis from cache - Originally analyzed by {analysisInfo.analyzedBy} on {formatDate(analysisInfo.analyzedAt)}</span>
            </div>
          )}

          {analysis.commit_activity.total_commits === 1 && (
            <div className="mb-4 flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg shadow-sm">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <div>
                <span className="font-semibold">Warning:</span>
                <span className="ml-1">Single commit repository - proceed with CAUTION!</span>
              </div>
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-4 text-green-900">{analysis.repository.name}</h2>
          <p className="text-gray-600 mb-4">{analysis.repository.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
              <Star className="w-5 h-5 text-green-600" />
              <span className="text-green-900">{analysis.repository.stars} stars</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
              <GitFork className="w-5 h-5 text-green-600" />
              <span className="text-green-900">{analysis.repository.forks} forks</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <span className="text-green-900">Created {formatDate(analysis.repository.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-green-900">{analysis.contributors.length} contributors</span>
            </div>
          </div>
        </div>

        <AIAnalysis aiAnalysis={analysis.ai_analysis} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-200 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-xl font-semibold mb-4 text-green-900">Languages</h3>
            <div className="space-y-2">
              {Object.entries(analysis.languages).map(([language, bytes]) => (
                <div key={language} className="flex justify-between items-center">
                  <span className="text-green-800">{language}</span>
                  <span className="text-gray-600">{Math.round(bytes / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-200 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-xl font-semibold mb-4 text-green-900">Recent Commits</h3>
            <div className="space-y-4">
              {analysis.commit_activity.recent_commits.map((commit) => (
                <div key={commit.sha} className="border-b border-green-100 pb-2">
                  <div className="text-sm text-green-600">{commit.sha}</div>
                  <div className="text-gray-900">{commit.message}</div>
                  <div className="text-sm text-gray-600">{formatDate(commit.date)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GithubIcon className="w-6 h-6 text-green-900" />
            <span className="text-xl font-semibold text-green-900">Repo Analyzer</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full border-2 border-green-200" />
              <span className="text-green-900">{user.login}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-200 mb-8 hover:shadow-lg transition-shadow duration-200">
            <h3 className="text-lg font-semibold mb-2 text-green-900">Analytics Stats</h3>
            <div className="text-sm text-green-800">
              Total repositories analyzed: {stats.total_analyses}
            </div>
          </div>
        )}

        <form onSubmit={handleAnalyze} className="mb-8">
          <div className="flex space-x-4">
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Enter GitHub repository URL"
              className="flex-1 p-2 border border-green-200 rounded-md focus:ring-2 focus:ring-green-200 focus:border-green-300 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
            {error}
          </div>
        )}

        {analysis && analysisInfo && renderAnalysis(analysis, analysisInfo)}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setError(error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  
    fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch(err => console.error('Error fetching user:', err));
  
    fetch('http://localhost:5000/api/stats', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis);
        setAnalysisInfo({
          cached: data.cached,
          analyzedBy: data.analyzed_by,
          analyzedAt: data.analyzed_at
        });
      }
    } catch (err) {
      setError('Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', {
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {!user ? (
        <LandingPage />
      ) : (
        <MainContent
          user={user}
          stats={stats}
          loading={loading}
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          handleAnalyze={handleAnalyze}
          error={error}
          analysis={analysis}
          analysisInfo={analysisInfo}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
