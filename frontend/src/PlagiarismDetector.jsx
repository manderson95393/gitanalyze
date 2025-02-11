// PlagiarismDetector class to analyze repository data for signs of plagiarism
class PlagiarismDetector {
    constructor(repoData) {
      this.repo = repoData;
      this.commitActivity = repoData.commit_activity;
      this.languages = repoData.languages;
      this.contributors = repoData.contributors;
      this.aiAnalysis = repoData.ai_analysis;
    }
  
    // Analyze commit patterns for suspicious activity
    analyzeCommitPatterns() {
      const redFlags = [];
      const commits = this.commitActivity.recent_commits;
      
      if (commits.length < 2) {
        redFlags.push({
          type: 'commit_pattern',
          severity: 'high',
          description: 'Repository has very few commits which is highly suspicious'
        });
        return redFlags;
      }
  
      // Sort commits by date
      const sortedCommits = [...commits].sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstCommit = new Date(sortedCommits[0].date);
      const lastCommit = new Date(sortedCommits[sortedCommits.length - 1].date);
      
      // Calculate time span in days
      const timeSpanDays = (lastCommit - firstCommit) / (1000 * 60 * 60 * 24);
      
      if (timeSpanDays <= 2) {
        redFlags.push({
          type: 'commit_pattern',
          severity: 'high',
          description: 'All commits were made within 2 days - highly suspicious for copied code'
        });
      } else if (timeSpanDays <= 7) {
        redFlags.push({
          type: 'commit_pattern',
          severity: 'medium',
          description: 'All commits were made within 7 days - potentially suspicious activity'
        });
      }
  
      // Check for identical commit messages
      const commitMessages = commits.map(c => c.message);
      const uniqueMessages = new Set(commitMessages);
      if (uniqueMessages.size / commitMessages.length < 0.3) {
        redFlags.push({
          type: 'commit_messages',
          severity: 'medium',
          description: 'Low variety in commit messages suggests automated or bulk commits'
        });
      }
  
      return redFlags;
    }
  
    // Analyze contributor patterns
    analyzeContributorPatterns() {
      const redFlags = [];
      
      // Check if repository has very few contributors despite size
      const totalCode = Object.values(this.languages).reduce((a, b) => a + b, 0);
      const codePerContributor = totalCode / this.contributors.length;
      
      if (codePerContributor > 1000000 && this.contributors.length < 3) {
        redFlags.push({
          type: 'contributor_ratio',
          severity: 'high',
          description: 'Large codebase with suspiciously few contributors'
        });
      }
  
      return redFlags;
    }
  
    // Analyze code quality metrics
    analyzeCodeQuality() {
      const redFlags = [];
      const { score_breakdown } = this.aiAnalysis;
      
      // Check for inconsistent code quality
      if (score_breakdown) {
        const scores = Object.values(score_breakdown);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / scores.length;
        
        if (variance > 0.5) {
          redFlags.push({
            type: 'code_quality',
            severity: 'medium',
            description: 'Highly inconsistent code quality across codebase'
          });
        }
      }
  
      return redFlags;
    }
  
    // Calculate overall plagiarism risk score
    calculateRiskScore() {
      const commitFlags = this.analyzeCommitPatterns();
      const contributorFlags = this.analyzeContributorPatterns();
      const codeQualityFlags = this.analyzeCodeQuality();
      
      const allRedFlags = [...commitFlags, ...contributorFlags, ...codeQualityFlags];
  
      // Increased weights for time-based commit patterns
      const severityWeights = {
        high: 1.0,
        medium: 0.6,
        low: 0.3
      };
  
      // Give more weight to commit pattern flags
      const weightedScore = allRedFlags.reduce((score, flag) => {
        const weight = severityWeights[flag.severity];
        // Double the impact of commit pattern flags
        return score + (flag.type === 'commit_pattern' ? weight * 2 : weight);
      }, 0);
  
      // Normalize score to 0-100 range with higher impact from commit patterns
      const normalizedScore = Math.min(100, weightedScore * 15);
  
      return {
        score: normalizedScore,
        risk_level: normalizedScore > 70 ? 'High' : normalizedScore > 40 ? 'Medium' : 'Low',
        red_flags: allRedFlags,
        timestamp: new Date().toISOString()
      };
    }
  
    // Generate detailed report
    generateReport() {
      const riskAnalysis = this.calculateRiskScore();
      
      return {
        repository_name: this.repo.repository.name,
        analysis_timestamp: riskAnalysis.timestamp,
        risk_assessment: {
          score: riskAnalysis.score,
          risk_level: riskAnalysis.risk_level,
          red_flags: riskAnalysis.red_flags
        },
        recommendations: this.generateRecommendations(riskAnalysis.red_flags),
        metadata: {
          total_commits: this.commitActivity.total_commits,
          languages_used: Object.keys(this.languages),
          contributor_count: this.contributors.length
        }
      };
    }
  
    // Generate recommendations based on detected issues
    generateRecommendations(redFlags) {
      const recommendations = new Set();
      
      redFlags.forEach(flag => {
        switch(flag.type) {
          case 'commit_pattern':
            recommendations.add('Investigate commit history for bulk copying of code');
            recommendations.add('Review git logs for signs of repository copying');
            break;
          case 'contributor_ratio':
            recommendations.add('Review contributor permissions and access patterns');
            recommendations.add('Verify authenticity of large code contributions');
            break;
          case 'code_quality':
            recommendations.add('Conduct detailed code review of inconsistent sections');
            recommendations.add('Check for mixing of different coding styles/standards');
            break;
        }
      });
  
      return Array.from(recommendations);
    }
  }
  
  export default PlagiarismDetector;
