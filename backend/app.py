from flask import redirect, url_for, session
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_dance.contrib.github import make_github_blueprint, github
from flask_sqlalchemy import SQLAlchemy
from openai import OpenAI
import json
import os
import requests
import urllib
from datetime import datetime, timezone
import hashlib
from dotenv import load_dotenv
import base64


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

# OpenAI setup
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

class RepoAnalysis(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    repo_url = db.Column(db.String(500), unique=True, nullable=False)
    repo_hash = db.Column(db.String(32), unique=True, nullable=False)
    analysis_data = db.Column(db.JSON, nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    access_count = db.Column(db.Integer, default=1)

def get_repo_hash(repo_url):
    return hashlib.md5(repo_url.encode()).hexdigest()

def analyze_code_with_ai(repo_info, files_content):
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
    
    # Fix timezone-aware datetime comparisons
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
        'stars': min(stars / 100, 0.3),  # Up to 0.3 points for stars
        'forks': min(forks / 50, 0.2),   # Up to 0.2 points for forks
        'watchers': min(watchers / 50, 0.15),  # Up to 0.15 points for watchers
        'collaborators': min(collaborators / 5, 0.15),  # Up to 0.15 points for collaborators
        'tags': min(tags / 10, 0.1),  # Up to 0.1 points for tags
        'commit_activity': min(commit_frequency / 20, 0.1)  # Up to 0.1 points for commit activity
    }
    
    engagement_score = sum(engagement_factors.values())
    
    # Round to prevent floating point issues
    engagement_score = round(min(engagement_score, 1.0), 2)
    
    score_components['engagement'] = engagement_score
    
    # Update the engagement findings
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

    
    # Score based on commit frequency and recency
    if total_commits <= 2:
        maintenance_score = 0
    else:
        # Base score from commit frequency
        if commit_frequency >= 10:  # Very active: 10+ commits per month
            frequency_score = 0.6
        elif commit_frequency >= 4:  # Moderately active: 4-10 commits per month
            frequency_score = 0.4
        elif commit_frequency >= 1:  # Somewhat active: 1-4 commits per month
            frequency_score = 0.2
        else:
            frequency_score = 0.1

        # Recency score
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

    commit_count = repo_info.get('commit_count', 0)  # You'll need to pass this from the repo_info
    
    if repo_age_days <= 7 and commit_count <= 5:
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
    max_score = 6  # Update max_score since we added a new component

    # Calculate final score (keep your existing calculation)
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

    analysis = {
        "score": rating,
        "numeric_score": normalized_score,
        "score_breakdown": score_components,
        "strengths": findings['strengths'],
        "areas_for_improvement": findings['areas_for_improvement'],
        "recommendations": findings['recommendations']
    }
    
    return json.dumps(analysis)

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

def analyze_repository(repo_url):
    #  if not (repo_url.startswith('http://github.com/') or repo_url.startswith('https://github.com/')):
    #     raise Exception('Invalid GitHub repository URL')
    
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
    
    # Add print statements
    print("Analyzing repository:", repo_url)
    
    repo_response = requests.get(base_url, headers=headers)
    repo_info = repo_response.json()
    
    print("DEBUG - Repository Info:")
    print(f"Open Issues Count: {repo_info.get('open_issues_count')}")
    print(f"Full repo info: {repo_info}")
    
    languages = requests.get(f'{base_url}/languages', headers=headers).json()
    commits = requests.get(f'{base_url}/commits', params={'per_page': 30}, headers=headers).json()
    contributors = requests.get(f'{base_url}/contributors', params={'per_page': 10}, headers=headers).json()
    total_commits = len(commits)
    is_single_commit = total_commits == 1
    files_content = get_repository_files(owner, repo)

    # Replace the github.get calls with requests:
    watchers_response = requests.get(f'https://api.github.com/repos/{owner}/{repo}/watchers', headers=headers)
    watchers = watchers_response.json()
    
    tags_response = requests.get(f'https://api.github.com/repos/{owner}/{repo}/tags', headers=headers)
    tags = tags_response.json()
    
    collaborators_response = requests.get(f'https://api.github.com/repos/{owner}/{repo}/collaborators', headers=headers)
    collaborators = collaborators_response.json()
    
    # Debug
    print("Repository Info:")
    print(f"Name: {repo_info['name']}")
    print(f"Open Issues Count: {repo_info['open_issues_count']}")
    print(f"Raw repo info:", repo_info)  # This will print all available data


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
    }, files_content)
    
    ai_results = json.loads(ai_analysis)
    
    return {
        'repository': {
            'name': repo_info['name'],
            'description': repo_info['description'],
            'stars': repo_info['stargazers_count'],
            'forks': repo_info['forks_count'],
            'open_issues': repo_info['open_issues_count'],
            'created_at': repo_info['created_at'],
            'last_updated': repo_info['updated_at'],
            'is_single_commit': is_single_commit  # Add this
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
                        for c in contributors],
        'ai_analysis': ai_results,
        'analysis_date': datetime.now(timezone.utc).isoformat()
    }


@app.route('/')
def index():
    if not github.authorized:
        return redirect(url_for('github.login'))
    return redirect('http://localhost:3000')  # Redirect to React app after auth


@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'github_token' not in session:
        return jsonify({'error': 'Not authorized'}), 401
    
    try:
        headers = {
            'Authorization': f'token {session["github_token"]}',
            'Accept': 'application/vnd.github.v3+json'
        }
        user_response = requests.get('https://api.github.com/user', headers=headers)
        user_data = user_response.json()
        username = user_data['login']
        
        # Rest of your analyze function remains the same
    
        repo_url = request.json.get('repo_url')
        if not repo_url:
            return jsonify({'error': 'Repository URL is required'}), 400
        
        repo_hash = get_repo_hash(repo_url)
        
        existing_analysis = RepoAnalysis.query.filter_by(repo_hash=repo_hash).first()
        if existing_analysis:
            existing_analysis.access_count += 1
            db.session.commit()
            
            return jsonify({
                'analysis': existing_analysis.analysis_data,
                'cached': True,
                'analyzed_by': existing_analysis.created_by,
                'analyzed_at': existing_analysis.created_at.isoformat()
            })
        
        try:
            analysis = analyze_repository(repo_url)
            
            new_analysis = RepoAnalysis(
                repo_url=repo_url,
                repo_hash=repo_hash,
                analysis_data=analysis,
                created_by=username
            )
            db.session.add(new_analysis)
            db.session.commit()
            
            return jsonify({
                'analysis': analysis,
                'cached': False,
                'analyzed_by': username,
                'analyzed_at': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    except Exception as e:
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


# Add these routes to your Flask app
@app.route('/login/github')
def github_login():
    # Generate the GitHub authorization URL
    params = {
        'client_id': os.getenv('GITHUB_CLIENT_ID'),
        'redirect_uri': 'http://localhost:5000/callback',  # Backend callback URL
        'scope': 'repo user'
    }
    auth_url = f'https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}'
    return redirect(auth_url)

@app.route('/callback')
def github_callback():
    # Get the code from GitHub
    code = request.args.get('code')
    if not code:
        return redirect('http://localhost:3000?error=access_denied')

    try:
        # Exchange code for token using your worker
        response = requests.post(
            'https://github-auth-worker.avgtraderandyyy.workers.dev',
            json={'code': code},
            headers={'Content-Type': 'application/json'}
        )
        
        data = response.json()
        if 'access_token' not in data:
            return redirect('http://localhost:3000?error=token_error')

        # Store the token in session
        session['github_token'] = data['access_token']
        
        # Redirect back to React frontend
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

# Optional: Add logout endpoint
@app.route('/api/auth/logout')
def logout():
    session.pop('github_token', None)
    # Clear the entire session if you want to be thorough
    session.clear()
    return jsonify({'message': 'Logged out successfully'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
