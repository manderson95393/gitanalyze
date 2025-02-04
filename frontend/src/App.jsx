import { useState, useEffect } from 'react';
import { GithubIcon, Search, BarChart2, GitFork, Star, Clock, Users, Database, Brain, Check, X, AlertTriangle } from 'lucide-react';
import ScoreBadge from './ScoreBadge';
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AIAnalysis = ({ aiAnalysis }) => {
  if (!aiAnalysis) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center space-x-3 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-semibold">AI Analysis</h3>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-gray-600">Repository Score:</span>
          <ScoreBadge score={aiAnalysis.score} />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Key Strengths</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.areas_for_improvement.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
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

export default function App() {
  const [user, setUser] = useState(null);
  const [repoUrl, setRepoUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Check for error params in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setError(error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  
    // Fetch user data
    fetch('http://localhost:5000/api/auth/user', {
      credentials: 'include'  // Important for sending cookies
    })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setUser(data);
        }
      })
      .catch(err => console.error('Error fetching user:', err));
  
    // Fetch stats
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
        credentials: 'include', // Add this
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

  const renderAnalysis = () => {
    if (!analysis || !analysisInfo) return null;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow">
          {analysisInfo.cached && (
            <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-2 rounded">
              <Database className="w-4 h-4" />
              <span>Analysis from cache - Originally analyzed by {analysisInfo.analyzedBy} on {formatDate(analysisInfo.analyzedAt)}</span>
            </div>
          )}
          
          <h2 className="text-2xl font-bold mb-4">{analysis.repository.name}</h2>
          <p className="text-gray-600 mb-4">{analysis.repository.description}</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>{analysis.repository.stars} stars</span>
            </div>
            <div className="flex items-center space-x-2">
              <GitFork className="w-5 h-5 text-blue-500" />
              <span>{analysis.repository.forks} forks</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <span>Created {formatDate(analysis.repository.created_at)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span>{analysis.contributors.length} contributors</span>
            </div>
          </div>
        </div>

        <AIAnalysis aiAnalysis={analysis.ai_analysis} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Languages</h3>
            <div className="space-y-2">
              {Object.entries(analysis.languages).map(([language, bytes]) => (
                <div key={language} className="flex justify-between items-center">
                  <span>{language}</span>
                  <span className="text-gray-600">{Math.round(bytes / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Recent Commits</h3>
            <div className="space-y-4">
              {analysis.commit_activity.recent_commits.map((commit) => (
                <div key={commit.sha} className="border-b pb-2">
                  <div className="text-sm text-gray-600">{commit.sha}</div>
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <GithubIcon className="w-6 h-6" />
            <span className="text-xl font-semibold">Repo Analyzer</span>
          </div>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" />
                <span>{user.login}</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await fetch('http://localhost:5000/api/auth/logout', {
                      credentials: 'include'
                    });
                    setUser(null);
                  } catch (error) {
                    console.error('Error logging out:', error);
                  }
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Logout
              </button>
            </div>
          ) : (
            <a href="http://localhost:5000/login/github" className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800">
              <GithubIcon className="w-4 h-4" />
              <span>Login with GitHub</span>
            </a>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {stats && (
          <div className="bg-white p-4 rounded-lg shadow mb-8">
            <h3 className="text-lg font-semibold mb-2">Analytics Stats</h3>
            <div className="text-sm text-gray-600">
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
              className="flex-1 p-2 border rounded-md"
              required
            />
            <button
              type="submit"
              disabled={loading || !user}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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

        {renderAnalysis()}
      </main>
    </div>
  );
}