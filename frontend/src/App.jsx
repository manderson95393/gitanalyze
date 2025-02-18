import { useState, useEffect, useRef } from 'react';
import { SearchCode, Search, GithubIcon, Github, Twitter, ShieldCheck, BarChart2, GitFork, Star, Clock, Users, Database, Brain, Check, X, AlertTriangle, ArrowRight } from 'lucide-react';
import PlagiarismAnalysis from './PlagiarismAnalysis';
import MatrixRainComponent, { GlowingCardComponent, GlowingCardComponent2, CyberButton, CyberInput, MatrixGrade } from './matrix-components';
import { motion,useInView } from "framer-motion";
import ReactMarkdown from "react-markdown"
import LoadingScreen from './LoadingScreen';

const features = [
  {
    icon: BarChart2,
    title: "Advanced Analytics",
    description: "Get detailed metrics and statistics about your repository's health and activity."
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Receive intelligent recommendations powered by machine learning models."
  },
  {
    icon: GitFork,
    title: "Collaboration Metrics",
    description: "Understand contributor activity and collaboration patterns."
  },
  {
    icon: Database,
    title: "Code Quality Analysis",
    description: "Deep dive into code complexity and maintainability metrics."
  },
  {
    icon: Star,
    title: "Popularity Trends",
    description: "Track stars, forks, and community engagement over time."
  },
  {
    icon: AlertTriangle,
    title: "Risk Detection",
    description: "Identify potential risks and security vulnerabilities in your codebase."
  }
];

const SectionWrapper = ({ children }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 50 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
};

const Navbar = ({ variant = 'dark' }) => {
  return (
    <nav className={`${variant === 'dark' ? 'fixed top-0 left-0 right-0 bg-black border-b border-gray-900 p-6 z-50' : 'bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl z-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left side - Logo */}
        <a href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <span className="text-3xl font-bold text-white">ChainGuard</span>
          <div className="flex items-center space-x-2">
            <div className="bg-green-500/10 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </a>


        {/* Right side - Socials or User */}
        <div className="flex items-center space-x-6">
          <>
            <a
              href="https://github.com/manderson95393/gitanalyze"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              <Github className="w-6 h-6" />
            </a>
            <a
              href="https://twitter.com/yourhandle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-green-400 transition-colors"
            >
              <Twitter className="w-6 h-6" />
            </a>
          </>
        </div>
      </div>
    </nav>
  );
};


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

  const [insightsText, setInsightsText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [showGrade, setShowGrade] = useState(false);

  useEffect(() => {
    if (!aiAnalysis.ai_insights) return;
    
    setInsightsText(""); // Reset on new data
    setIsTypingComplete(false);
    setShowGrade(false);

    // First show the grade
    setTimeout(() => setShowGrade(true), 500);
    
    let currentText = "";
    const totalLength = aiAnalysis.ai_insights.length;
    let index = 0;

    const interval = setInterval(() => {
      if (index < totalLength) {
        currentText += aiAnalysis.ai_insights[index];
        setInsightsText(currentText);
        index++;
      } else {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [aiAnalysis.ai_insights]);

  return (
    <div>
      {/* Matrix Grade Display */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showGrade ? 1 : 0, y: showGrade ? 0 : -20 }}
        className="mb-6 flex justify-center"
      >
        <MatrixGrade grade={aiAnalysis.grade} />
      </motion.div>

      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-xl border border-green-500/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Brain className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">AI Analysis</h3>
          </div>
        </div>

        {/* AI Insights Section with Typewriter Effect */}
        {aiAnalysis.ai_insights && (
          <div className="mb-6">
            {/*<h4 className="font-medium text-green-400 mb-3">AI Insights</h4>*/}
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 text-gray-300 whitespace-pre-wrap font-mono">
              <ReactMarkdown>{insightsText}</ReactMarkdown>
              {!isTypingComplete && (
                <span className="animate-ping text-green-400">|</span>
              )}
            </div>
          </div>
        )}

      {/* <div className="space-y-6"> */}
        {/* <div>
          <h4 className="font-medium text-green-900 mb-2">Key Strengths</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div> */}

        {/* <div>
          <h4 className="font-medium text-green-900 mb-2">Areas for Improvement</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.areas_for_improvement.map((area, index) => (
              <li key={index}>{area}</li>
            ))}
          </ul>
        </div> */}

        {/* <div>
          <h4 className="font-medium text-green-900 mb-2">Recommendations</h4>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {aiAnalysis.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div> */}
      {/* </div> */}
      </div>
    </div>
  );
};

const LandingPage = ({ onGetStarted }) => {
  return (
    <div className="bg-black relative overflow-hidden">
      <MatrixRainComponent />
      <Navbar variant="dark" />
      <div className="relative z-10 space-y-12 py-16 pt-32">
      <section className="py-12 flex items-center justify-center">
        <GlowingCardComponent className="text-center p-4 max-w-6xl mx-4">
          <div className="space-y-12">
          <div className="flex items-baseline justify-center space-x-6">
            <h1 className="text-6xl font-bold text-green-400 font-mono">
              <strong>PROTECT</strong> your investments from <em>shorts, scams & exploits</em>
            </h1>
          </div>
            <div className="flex items-baseline justify-center space-x-6">
              <SearchCode className="w-14 h-14 text-green-400" />
            </div>
            
            <p className="text-2xl text-green-300 font-mono leading-relaxed px-8">
              Analyze GitHub repositories with AI-powered insights. Get detailed metrics, code quality analysis, and actionable recommendations.
            </p>
            
            <div className="pt-4">
              <CyberButton 
                onClick={onGetStarted}
                className="hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-center justify-center space-x-3 px-6 py-3">
                  <span>Get Started</span>
                  <ArrowRight className="w-6 h-6" />
                </div>
              </CyberButton>
            </div>
          </div>
        </GlowingCardComponent>
    </section>

        {/* Video Tutorial Section */}
        <SectionWrapper>
          <section className="py-12 flex items-center justify-center px-4">
            <GlowingCardComponent className="max-w-6xl w-full p-12">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                  muted
                  loop
                >
                  <source src="/tutorial-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <h2 className="text-4xl font-bold text-green-400 mt-6 mb-4">
                How It Works
              </h2>
              <p className="text-x1 text-gray-300">
                Watch this quick tutorial to learn how to analyze your GitHub repositories and get actionable insights.
              </p>
            </GlowingCardComponent>
          </section>
        </SectionWrapper>

        <SectionWrapper>
          <section className="py-12 flex items-center justify-center px-4">
            <div className="max-w-6xl w-full">
              <h2 className="text-5xl font-bold text-green-400 text-center mb-12">
                Powerful Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <GlowingCardComponent className="p-6 h-full">
                      <feature.icon className="w-16 h-16 text-green-400 mb-6" />
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-gray-300">
                        {feature.description}
                      </p>
                    </GlowingCardComponent>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </SectionWrapper>
      </div>
    </div>
  );
};


const MainContent = ({ user, stats, loading, repoUrl, setRepoUrl, handleAnalyze, error, analysis, analysisInfo, onLogout }) => {
  const renderAnalysis = (analysis, analysisInfo) => {
    return (
      <div className="space-y-6">
        <AIAnalysis aiAnalysis={analysis.ai_analysis} />

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
              {analysis.commit_activity.recent_commits.slice(0, 5).map((commit) => (
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
      <Navbar variant="light" />

      <main className="max-w-7xl mx-auto px-4 py-8 pt-32">
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

        {loading ? (
          <LoadingScreen />
        ) : (
          analysis && analysisInfo && renderAnalysis(analysis, analysisInfo)
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [showMainContent, setShowMainContent] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

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
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      if (data.error) {
        setError(data.error);
      } else {
        setAnalysis(data.analysis);
        setAnalysisInfo({
          cached: data.cached,
          analyzedAt: data.analyzed_at
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!showMainContent ? (
        <LandingPage onGetStarted={() => setShowMainContent(true)} />
      ) : (
        <MainContent
          stats={stats}
          loading={loading}
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          handleAnalyze={handleAnalyze}
          error={error}
          analysis={analysis}
          analysisInfo={analysisInfo}
        />
      )}
    </>
  );
}
