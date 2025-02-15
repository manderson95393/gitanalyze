import traceback
from flask import redirect, url_for, session
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_dance.contrib.github import make_github_blueprint, github
from flask_sqlalchemy import SQLAlchemy
import json
import os
import requests
import urllib
from datetime import datetime, timezone
import hashlib
from dotenv import load_dotenv
import base64
import random


os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
load_dotenv()

app = Flask(__name__)
app.config.update(
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_TYPE='filesystem'
)
CORS(app, origins=["http://localhost:3000"],
     supports_credentials=True)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

# SQLite configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///github_analyzer.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class RepoAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    repo_url = db.Column(db.String(500), unique=True, nullable=False)
    repo_hash = db.Column(db.String(32), unique=True, nullable=False)
    analysis_data = db.Column(db.JSON, nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    access_count = db.Column(db.Integer, default=1)

    def __init__(self, repo_url, repo_hash, analysis_data, created_by):
        self.repo_url = repo_url
        self.repo_hash = repo_hash
        if isinstance(analysis_data, str):
            self.analysis_data = json.loads(analysis_data)
        else:
            self.analysis_data = analysis_data
        self.created_by = created_by

def get_repo_hash(repo_url):
    return hashlib.md5(repo_url.encode()).hexdigest()
    
def analyze_code_with_ai(repo_info, files_content, url):
    openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
    score_components = {}
    total_score = 0
    max_score = 5
    findings = {"strengths": [], "areas_for_improvement": [], "recommendations": []}
    
    # Documentation Score (1 point)
    readme_files = [f for f in files_content if f['path'].lower() == 'readme.md']
    has_readme = len(readme_files) > 0
    
    if has_readme:
        readme_content = readme_files[0]['content']
        readme_length = len(readme_content)
        if readme_length > 500:
            score_components['documentation'] = 1
            findings['strengths'].append("Comprehensive README documentation")
        else:
            score_components['documentation'] = 0.5
            findings['areas_for_improvement'].append("README could be more detailed")
            findings['recommendations'].append("Expand README with installation, usage, and contribution guidelines")
    else:
        score_components['documentation'] = 0
        findings['areas_for_improvement'].append("Missing README documentation")
        findings['recommendations'].append("Add a README.md file with project documentation")

    # Project Structure Score (1 point)
    has_requirements = any(f['path'].endswith(('.txt', '.toml', 'requirements.txt', 'package.json')) for f in files_content)
    has_gitignore = any(f['path'] == '.gitignore' for f in files_content)
    has_tests = any('test' in f['path'].lower() for f in files_content)
    
    structure_score = 0
    if has_requirements:
        structure_score += 0.4
        findings['strengths'].append("Dependency management files present")
    else:
        findings['recommendations'].append("Add dependency management files (requirements.txt/package.json)")
    
    if has_gitignore:
        structure_score += 0.3
        findings['strengths'].append("Proper git configuration with .gitignore")
    
    if has_tests:
        structure_score += 0.3
        findings['strengths'].append("Testing infrastructure present")
    else:
        findings['areas_for_improvement'].append("No tests found")
        findings['recommendations'].append("Add unit tests to ensure code quality")
    
    score_components['structure'] = structure_score

    # Community Engagement Score (1 point)
    stars = repo_info['stars']
    forks = repo_info['forks']
    watchers = repo_info.get('watchers_count', 0)
    collaborators = len(repo_info.get('collaborators', []))
    tags = len(repo_info.get('tags', []))
    
    repo_created = datetime.strptime(repo_info['created_at'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    last_update = datetime.strptime(repo_info['last_updated'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)

    # Maintenance Score (1 point)
    repo_age_days = (now - repo_created).days
    days_since_update = (now - last_update).days
    total_commits = repo_info.get('total_commits', 0)
    
    # Calculate commit frequency (commits per month)
    if repo_age_days < 1:
        commit_frequency = 0
    else:
        commit_frequency = (total_commits * 30) / repo_age_days

    # Calculate engagement score based on multiple factors
    engagement_factors = {
        'stars': min(stars / 100, 0.3),
        'forks': min(forks / 50, 0.2),
        'watchers': min(watchers / 50, 0.15),
        'collaborators': min(collaborators / 5, 0.15),
        'tags': min(tags / 10, 0.1),
        'commit_activity': min(commit_frequency / 20, 0.1)
    }
    
    engagement_score = sum(engagement_factors.values())
    engagement_score = round(min(engagement_score, 1.0), 2)
    score_components['engagement'] = engagement_score
    
    engagement_details = []
    if stars > 0:
        engagement_details.append(f"{stars} stars")
    if forks > 0:
        engagement_details.append(f"{forks} forks")
    if watchers > 0:
        engagement_details.append(f"{watchers} watchers")
    
    if engagement_details:
        findings['strengths'].append(f"Community engagement: {', '.join(engagement_details)}")
    
    if engagement_score < 0.3:
        findings['areas_for_improvement'].append("Could benefit from more community engagement")
        findings['recommendations'].append("Consider promoting the repository to attract more contributors")

    if commit_frequency >= 10:
        frequency_score = 0.6
    elif commit_frequency >= 4:
        frequency_score = 0.4
    elif commit_frequency >= 1:
        frequency_score = 0.2
    else:
        frequency_score = 0.1

    if days_since_update < 7:
        recency_score = 0.4
    elif days_since_update < 30:
        recency_score = 0.3
    elif days_since_update < 90:
        recency_score = 0.2
    else:
        recency_score = 0

    maintenance_score = frequency_score + recency_score
    
    if maintenance_score >= 0.8:
        findings['strengths'].append("Highly active maintenance with regular commits")
    elif maintenance_score >= 0.5:
        findings['strengths'].append("Regular maintenance activity")
    elif maintenance_score >= 0.3:
        findings['areas_for_improvement'].append("Repository could benefit from more frequent updates")
    else:
        findings['areas_for_improvement'].append("Repository appears to be unmaintained")
    
    score_components['maintenance'] = maintenance_score

    # Issues Score (1 point)
    open_issues = repo_info['open_issues_count']
    if open_issues == 0:
        issues_score = 1
    elif open_issues < 10:
        issues_score = 0.8
    elif open_issues < 50:
        issues_score = 0.6
    else:
        issues_score = 0.4
        findings['areas_for_improvement'].append(f"Large number of open issues ({open_issues})")
    
    score_components['issues'] = issues_score

    if repo_age_days <= 7:
        maturity_score = 0.2
        findings['areas_for_improvement'].append("Repository is very new with limited commit history")
        findings['recommendations'].append("Continue developing the project and making regular commits")
    elif repo_age_days <= 30:
        maturity_score = 0.6
        findings['areas_for_improvement'].append("Repository is relatively new")
    else:
        maturity_score = 1.0
        findings['strengths'].append("Repository has established history")
    
    score_components['maturity'] = maturity_score
    max_score = 6

    total_score = sum(score_components.values())
    normalized_score = round((total_score / max_score) * 5, 1)
    
    if normalized_score >= 4.5:
        rating = "Excellent"
    elif normalized_score >= 3.5:
        rating = "Good"
    elif normalized_score >= 2.5:
        rating = "Average"
    elif normalized_score >= 1.5:
        rating = "Poor"
    else:
        rating = "Bad"

    personalities = [
        "Serious Detective",
        "Comedian",
        "Storyteller",
        "Teacher",
        "Tech Geek",
        "Frat guy",
        "Narcissist",
        "Old-Timey Gentleman",
        "Coach",
        "Grandpa who cares",
        "Motivational Speaker",
        "Hacker"
    ]
    random_index = random.randint(0, 11)
    random_personality = personalities[random_index]
    print(random_personality)
    analysis_prompt = f"""
        We are having a informal conversation. Use emojis. You are a crypto coin trader but also a {random_personality}.
        We together are seeking out coins with software projects.
        There are a lot of scam projects that steal code or do not work. 
        Please look for plagiarized code, poor code practices such as exposed API keys (Keys that are not empty or placeholders), and the history of the repository.
        Repositories that are brand new or have all their commits within a week indicate scam likely projects.

        Here is a baseline:
        https://github.com/zxvghy/SOLpanion-extension is a score of Beware.
        https://github.com/sgAIqO0psl51xk/coinseek is a score of Caution.
        https://github.com/Stanford/AWS-SSO is a score of Average.
        https://github.com/elizaOS/eliza is a score of Good.
        https://github.com/0xPlaygrounds/rig is a score of Excellent.

        Here is the repository:
        {url} 

        Start with a grade: Beware, Average, and Good.

        Underline each of the category titles from here forward. 

        Provide a cohesive analysis of: 
        1. Plagiarism or theft of code.
        2. Code quality, structure, and practices. 
        3. Overall engagement, activity, and community sentiment.
        
        Next provide a brief numbered list of Key Strengths 
        Next provide a brief numbered list for Areas of Improvement
        
        Finally Provide final thoughts.
"""
    
    response = None
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {openrouter_api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "openai/chatgpt-4o-latest",
                "messages": [{"role": "user", "content": analysis_prompt}]
            }
        )
        
        ai_response = response.json()
        analysis_text = ai_response['choices'][0]['message']['content']
        result = "\n".join(analysis_text[1:])
        
        print(analysis_text)
        if "Beware" in analysis_text[:20]:
            grade = "Beware"
        elif "Caution" in analysis_text[:20]:
            grade = "Beware"
        elif "Average" in analysis_text[:20]:
            grade = "Average"
        elif "Good" in analysis_text[:20]:
            grade = "Good"
        elif "Excellent" in analysis_text[:20]:
            grade = "Good"        
        else:
            grade = "Average"

        analysis = {
            "score": rating,
            "numeric_score": normalized_score,
            "score_breakdown": score_components,
            "strengths": findings['strengths'],
            "areas_for_improvement": findings['areas_for_improvement'],
            "recommendations": findings['recommendations'],
            "ai_insights": analysis_text,
            "grade": grade
        }
        
        return json.dumps(analysis)
    except Exception as e:
        print(f"Error in AI analysis: {str(e)}")
        return json.dumps({
            "score": rating,
            "numeric_score": normalized_score,
            "score_breakdown": score_components,
            "strengths": findings['strengths'],
            "areas_for_improvement": findings['areas_for_improvement'],
            "recommendations": findings['recommendations'],
            "ai_insights": "AI analysis currently unavailable"
        })


def get_repository_files(owner, repo):
    token = session.get('github_token')
    if not token:
        raise Exception('Not authenticated')
        
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    files_content = []
    try:
        response = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}/contents',
            headers=headers
        )
        contents = response.json()
        
        for item in contents[:5]:
            if item['type'] == 'file':
                if item['size'] <= 1000000:
                    file_response = requests.get(item['url'], headers=headers)
                    file_content = file_response.json()
                    content = base64.b64decode(file_content['content']).decode('utf-8', errors='ignore')
                    files_content.append({
                        'path': item['path'],
                        'content': content[:1000]
                    })
    except Exception as e:
        print(f"Error fetching repository contents: {str(e)}")
    
    return files_content


def is_valid_github_url(url):
    """Validate if the URL matches GitHub repository format."""
    try:
        # Allow both HTTPS and SSH formats
        if url.startswith('git@github.com:'):
            parts = url.split(':')[1].split('/')
        else:
            # Remove trailing .git if present
            url = url.rstrip('.git')
            parsed = urllib.parse.urlparse(url)
            if parsed.netloc != 'github.com':
                return False
            parts = parsed.path.strip('/').split('/')
            
        # Check if we have owner/repo format
        if len(parts) != 2:
            return False
            
        owner, repo = parts
        return bool(owner and repo)
    except:
        return False


def is_repo_accessible(owner, repo, token):
    """Check if the repository exists and is publicly accessible."""
    try:
        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        response = requests.get(
            f'https://api.github.com/repos/{owner}/{repo}',
            headers=headers
        )
        
        if response.status_code != 200:
            return False, "Repository not found or inaccessible"
            
        repo_data = response.json()
        if repo_data.get('private', False):
            return False, "Repository is private"
            
        return True, None
    except Exception as e:
        return False, str(e)
    

def analyze_repository(repo_url):
    token = session.get('github_token')
    if not token:
        raise Exception('Not authenticated')
        
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    parts = repo_url.rstrip('/').split('/')
    owner = parts[-2]
    repo = parts[-1]
    
    base_url = f'https://api.github.com/repos/{owner}/{repo}'
    
    print("Analyzing repository:", repo_url)
    
    repo_response = requests.get(base_url, headers=headers)
    repo_info = repo_response.json()
    
    languages = requests.get(f'{base_url}/languages', headers=headers).json()
    commits = requests.get(f'{base_url}/commits', params={'per_page': 30}, headers=headers).json()
    contributors = requests.get(f'{base_url}/contributors', params={'per_page': 10}, headers=headers).json()
    total_commits = len(commits)
    is_single_commit = total_commits == 1
    files_content = get_repository_files(owner, repo)

    watchers_response = requests.get(f'{base_url}/watchers', headers=headers)
    watchers = watchers_response.json()
    
    tags_response = requests.get(f'{base_url}/tags', headers=headers)
    tags = tags_response.json()
    
    collaborators_response = requests.get(f'{base_url}/collaborators', headers=headers)
    collaborators = collaborators_response.json()
    
    repo_data = {
        'repository': {
            'name': repo_info['name'],
            'description': repo_info['description'],
            'stars': repo_info['stargazers_count'],
            'forks': repo_info['forks_count'],
            'open_issues': repo_info['open_issues_count'],
            'created_at': repo_info['created_at'],
            'last_updated': repo_info['updated_at'],
            'is_single_commit': is_single_commit
        },
        'commit_activity': {
            'total_commits': total_commits,
            'recent_commits': [{'sha': c['sha'][:7], 
                              'message': c['commit']['message'],
                              'date': c['commit']['author']['date']} 
                             for c in commits[:5]]
        },
        'languages': languages,
        'contributors': [{'login': c['login'], 
                         'contributions': c['contributions']} 
                        for c in contributors]
    }

    ai_analysis = analyze_code_with_ai({
        'name': repo_info['name'],
        'description': repo_info['description'],
        'stars': repo_info['stargazers_count'],
        'forks': repo_info['forks_count'],
        'watchers_count': len(watchers),
        'tags': tags,
        'collaborators': collaborators,
        'total_commits': len(commits),
        'created_at': repo_info['created_at'],
        'last_updated': repo_info['updated_at'],
        'open_issues_count': repo_info['open_issues_count']
    }, files_content, url = repo_url )
        
    print("AI Analysis Results:", ai_analysis)
    
    final_analysis = {
        **repo_data,
        'ai_analysis': json.loads(ai_analysis),
        'analysis_date': datetime.now(timezone.utc).isoformat()
    }
    
    print("Final Analysis Structure:", {
        'keys': list(final_analysis.keys()),
        'has_plagiarism': 'plagiarism_analysis' in final_analysis,
        'plagiarism_type': type(final_analysis.get('plagiarism_analysis')).__name__
    })
    
    return final_analysis


@app.route('/')
def index():
    if not github.authorized:
        return redirect(url_for('github.login'))
    return redirect('http://localhost:3000')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'github_token' not in session:
        return jsonify({'error': 'Not authorized'}), 401
    
    try:
        # Github authentication check
        headers = {
            'Authorization': f'token {session["github_token"]}',
            'Accept': 'application/vnd.github.v3+json'
        }
        user_response = requests.get('https://api.github.com/user', headers=headers)
        if user_response.status_code != 200:
            return jsonify({'error': 'GitHub authentication failed'}), 401
            
        user_data = user_response.json()
        username = user_data['login']
        
        # Get repository URL
        repo_url = request.json.get('repo_url')
        if not repo_url:
            return jsonify({'error': 'Repository URL is required'}), 400
        
        # Check cache
        repo_hash = get_repo_hash(repo_url)
        existing_analysis = RepoAnalysis.query.filter_by(repo_hash=repo_hash).first()
        if existing_analysis:
            existing_analysis.access_count += 1
            db.session.commit()
            
            print("Returning cached analysis")
            return jsonify({
                'analysis': existing_analysis.analysis_data,
                'cached': True,
                'analyzed_by': existing_analysis.created_by,
                'analyzed_at': existing_analysis.created_at.isoformat()
            })
        
        # Perform new analysis
        print(f"Starting new analysis for {repo_url}")
        analysis = analyze_repository(repo_url)
        
        if not analysis:
            return jsonify({'error': 'Analysis failed'}), 500
            
        print("Analysis complete. Saving to database...")
        new_analysis = RepoAnalysis(
            repo_url=repo_url,
            repo_hash=repo_hash,
            analysis_data=analysis,
            created_by=username
        )
        db.session.add(new_analysis)
        db.session.commit()
        
        response_data = {
            'analysis': analysis,
            'cached': False,
            'analyzed_by': username,
            'analyzed_at': datetime.now(timezone.utc).isoformat()
        }
        
        print("Sending response to frontend")
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in analyze route: {str(e)}")
        traceback.print_exc()  # Print full stack trace
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/stats')
def get_stats():
    total_analyses = RepoAnalysis.query.count()
    most_accessed = RepoAnalysis.query.order_by(RepoAnalysis.access_count.desc()).limit(5).all()
    
    return jsonify({
        'total_analyses': total_analyses,
        'most_popular': [{
            'repo_url': analysis.repo_url,
            'access_count': analysis.access_count,
            'last_accessed': analysis.created_at.isoformat()
        } for analysis in most_accessed]
    })

@app.route('/login/github/authorized')
def authorized():
    resp = github.authorized_response()
    if resp:
        session['github_token'] = resp['access_token']
        return redirect('http://localhost:3000')
    return redirect('http://localhost:3000')

@app.route('/login/github')
def github_login():
    params = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'redirect_uri': 'http://localhost:5000/callback',
        'scope': 'repo user'
    }
    auth_url = f'https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}'
    return redirect(auth_url)

@app.route('/callback')
def github_callback():
    code = request.args.get('code')
    if not code:
        return redirect('http://localhost:3000?error=access_denied')

    try:
        response = requests.post(
            'https://github-auth-worker.avgtraderandyyy.workers.dev',
            json={'code': code},
            headers={'Content-Type': 'application/json'}
        )
        
        data = response.json()
        if 'access_token' not in data:
            return redirect('http://localhost:3000?error=token_error')

        session['github_token'] = data['access_token']
        return redirect('http://localhost:3000')
        
    except Exception as e:
        print(f"Error in callback: {str(e)}")
        return redirect('http://localhost:3000?error=server_error')

@app.route('/api/auth/user')
def get_user():
    token = session.get('github_token')
    if not token:
        return jsonify({'error': 'Not authorized'}), 401
        
    try:
        response = requests.get(
            'https://api.github.com/user',
            headers={
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json'
            }
        )
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/clear-cache', methods=['POST'])
def clear_cache():
    try:
        # Print current analyses
        analyses = RepoAnalysis.query.all()
        print("Current analyses in DB:", [
            {
                'url': a.repo_url,
                'keys': list(a.analysis_data.keys()) if a.analysis_data else None
            } for a in analyses
        ])
        
        # Clear all analyses
        RepoAnalysis.query.delete()
        db.session.commit()
        return jsonify({'message': 'Cache cleared successfully'})
    except Exception as e:
        print(f"Error clearing cache: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

@app.route('/api/auth/logout')
def logout():
    session.pop('github_token', None)
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)