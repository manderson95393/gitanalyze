import { useState, useEffect, useRef } from 'react';
import { GithubIcon, Github, Search, BarChart2, GitFork, Star, Clock, Users, Database, Brain, Check, X, AlertTriangle } from 'lucide-react';
import PlagiarismAnalysis from './PlagiarismAnalysis';
import MatrixRainComponent, { GlowingCardComponent, CyberButton, CyberInput } from './matrix-components';
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown"


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

  const [insightsText, setInsightsText] = useState("");
  const [showGrade, setShowGrade] = useState(false);

  useEffect(() => {
    if (!aiAnalysis.ai_insights) return;
    
    setInsightsText(""); // Reset on new data
    setShowGrade(false);

    // First show the grade
    setTimeout(() => setShowGrade(true), 500);
    
    let index = 0;
    const interval = setInterval(() => {
      if (index < aiAnalysis.ai_insights.length) {
        setInsightsText((prev) => prev + aiAnalysis.ai_insights[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 20); // Adjust speed (lower = faster)

    return () => clearInterval(interval);
  }, [aiAnalysis.ai_insights]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-green-900">AI Analysis</h3>
        </div>
        <ScoreBadge score={aiAnalysis.score} numericScore={aiAnalysis.numeric_score} />
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {Object.entries(aiAnalysis.score_breakdown).map(([category, score]) => (
          <div key={category} className="bg-green-50 p-4 rounded-lg">
            <div className="text-sm text-green-800 capitalize">{category.replace('_', ' ')}</div>
            <div className="text-lg font-semibold text-green-900">{(score * 5).toFixed(1)}/5</div>
            <div className="w-full bg-green-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${score * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div> */}


      {/* Matrix-style Grade Display */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showGrade ? 1 : 0, y: showGrade ? 0 : -20 }}
        className="mb-6 flex justify-center"
      >
        <div className="relative">
          <div className="absolute inset-0 bg-green-200 opacity-20 animate-pulse rounded-lg"></div>
          <div className="relative bg-black bg-opacity-90 text-green-400 px-8 py-4 rounded-lg border border-green-400 font-mono">
            <div className="text-xs mb-1 text-center">FINAL GRADE</div>
            <div className="text-4xl font-bold text-center tracking-wider">
              {aiAnalysis.grade.split('').map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* AI Insights Section with Typewriter Effect */}
      {aiAnalysis.ai_insights && (
        <div className="mb-6">
          <h4 className="font-medium text-green-900 mb-3">AI Insights</h4>
          <h3 className="font-medium text-green-900 mb-3">{aiAnalysis.grade}</h3>
          <div className="p-4 bg-green-50 rounded-lg text-gray-700 whitespace-pre-wrap font-mono">
            <motion.span
              className="text-gray-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ReactMarkdown>{insightsText}</ReactMarkdown>
            </motion.span>
            <span className="animate-ping">|</span> {/* Blinking Cursor */}
          </div>
        </div>
      )}

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

const LandingPage = ({ onLogin }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black relative overflow-hidden">
      <MatrixRainComponent />
      
      <GlowingCardComponent className="text-center p-12 max-w-2xl mx-4">
        <div className="space-y-12">
          <div className="flex items-center justify-center space-x-4">
            <Search className="w-10 h-10 text-green-400" />
            <h1 className="text-4xl font-bold text-green-400 font-mono">Repo Analyzer</h1>
          </div>
          
          <p className="text-xl text-green-300 font-mono leading-relaxed px-4">
            Analyze GitHub repositories with AI-powered insights. Get detailed metrics, code quality analysis, and actionable recommendations.
          </p>
          
          <div className="pt-4">
            <CyberButton 
              onClick={() => window.location.href = "http://localhost:5000/login/github"}
              className="hover:scale-105 transition-transform duration-200"
            >
              <div className="flex items-center justify-center space-x-3 px-6 py-3">
                <Github className="w-6 h-6" />
                <span>Login with GitHub</span>
              </div>
            </CyberButton>
          </div>
        </div>
      </GlowingCardComponent>
    </div>
  );
};

const MainContent = ({ user, stats, loading, repoUrl, setRepoUrl, handleAnalyze, error, analysis, analysisInfo, onLogout }) => {
  const renderAnalysis = (analysis, analysisInfo) => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20">
          {analysisInfo.cached && (
            <div className="mb-4 flex items-center space-x-2 text-sm bg-gray-800/50 p-3 rounded-lg border border-green-400/20">
              <Database className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">Analysis from cache - Originally analyzed by {analysisInfo.analyzedBy} on {formatDate(analysisInfo.analyzedAt)}</span>
            </div>
          )}

          {analysis.commit_activity.total_commits === 1 && (
            <div className="mb-4 flex items-center px-4 py-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
              <div className="text-red-300">
                <span className="font-semibold">Warning:</span>
                <span className="ml-1">Single commit repository - proceed with CAUTION!</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{analysis.repository.name}</h2>
              <p className="text-gray-400">{analysis.repository.description}</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <div className="px-4 py-2 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="text-xs text-green-400 uppercase">Health Score</div>
                <div className="text-2xl font-bold text-green-300">98%</div>
              </div>
              <div className="px-4 py-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="text-xs text-blue-400 uppercase">Activity</div>
                <div className="text-2xl font-bold text-blue-300">High</div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{analysis.repository.stars}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Stars</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <GitFork className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold text-white">{analysis.repository.forks}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Forks</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-white">{formatDate(analysis.repository.created_at)}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Created On</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-green-500/50 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{analysis.contributors.length}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">Contributors</div>
            </div>
          </div>
        </div>
          
        <AIAnalysis aiAnalysis={analysis.ai_analysis} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Database className="w-5 h-5 mr-2 text-green-400" />
              Languages
            </h3>
            <div className="space-y-4">
              {Object.entries(analysis.languages).map(([language, bytes]) => {
                const percentage = (bytes / Object.values(analysis.languages).reduce((a, b) => a + b, 0)) * 100;
                return (
                  <div key={language} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{language}</span>
                      <span className="text-gray-400">{Math.round(percentage)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-xl shadow-xl border border-green-500/20">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <GitFork className="w-5 h-5 mr-2 text-green-400" />
              Recent Commits
            </h3>
            <div className="space-y-2">
              {analysis.commit_activity.recent_commits.slice(0, 3).map((commit) => (
                <div key={commit.sha} 
                     className="p-3 rounded-lg border border-gray-700 hover:border-green-500/30 transition-all duration-300">
                  <div className="text-xs font-mono text-gray-500">{commit.sha.substring(0, 7)}</div>
                  <div className="text-gray-300 mt-1">{commit.message}</div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(commit.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <GithubIcon className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-xl font-bold text-white">Repo Analyzer</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
              <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full ring-2 ring-green-500/30" />
              <span className="text-gray-300">{user.login}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 hover:border-gray-600 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20 mb-8">
            <div className="flex items-center space-x-4">
              <div className="bg-green-500/10 p-3 rounded-lg">
                <BarChart2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Analytics Dashboard</h3>
                <p className="text-gray-400">Total repositories analyzed: {stats.total_analyses}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20 mb-8">
          <form onSubmit={handleAnalyze} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="Enter GitHub repository URL"
                className="w-full px-4 py-3 bg-gray-800 text-gray-300 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="p-4 mb-8 bg-red-900/20 border border-red-500/30 text-red-400 rounded-xl">
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

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      console.log("API Response:", data);
      if (data.error) {
        setError(data.error);
      } 
      else {
        console.log("Setting analysis:", data.analysis);
        setAnalysis(data.analysis);
        setAnalysisInfo({
          cached: data.cached,
          analyzedBy: data.analyzed_by,
          analyzedAt: data.analyzed_at
        });
      }
    } 
    catch (err) {
      console.error("Analysis error:", err); 
      setError(err.message || 'Failed to analyze repository');
    } 
    finally {
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
