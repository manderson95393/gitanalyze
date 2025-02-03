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
from datetime import datetime
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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    access_count = db.Column(db.Integer, default=1)

def get_repo_hash(repo_url):
    return hashlib.md5(repo_url.encode()).hexdigest()

def analyze_code_with_ai(repo_info, files_content):
    prompt = f"""
    Analyze this GitHub repository:
    Name: {repo_info['name']}
    Description: {repo_info['description']}
    Stars: {repo_info['stars']}
    Forks: {repo_info['forks']}
    
    Code samples:
    {files_content}
    
    Provide:
    1. A score (Bad/Average/Good)
    2. Key strengths
    3. Areas for improvement
    4. Specific recommendations
    
    Format as JSON.
    """

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a senior software architect performing code reviews."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" }
    )
    
    return response.choices[0].message.content

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
    
    repo_info = requests.get(base_url, headers=headers).json()
    languages = requests.get(f'{base_url}/languages', headers=headers).json()
    commits = requests.get(f'{base_url}/commits', params={'per_page': 30}, headers=headers).json()
    contributors = requests.get(f'{base_url}/contributors', params={'per_page': 10}, headers=headers).json()
    
    files_content = get_repository_files(owner, repo)
    files_summary = "\n".join([f"File: {f['path']}\n{f['content'][:500]}...\n" for f in files_content])
    
    ai_analysis = analyze_code_with_ai({
        'name': repo_info['name'],
        'description': repo_info['description'],
        'stars': repo_info['stargazers_count'],
        'forks': repo_info['forks_count']
    }, files_summary)
    
    ai_results = json.loads(ai_analysis)
    
    return {
        'repository': {
            'name': repo_info['name'],
            'description': repo_info['description'],
            'stars': repo_info['stargazers_count'],
            'forks': repo_info['forks_count'],
            'open_issues': repo_info['open_issues_count'],
            'created_at': repo_info['created_at'],
            'last_updated': repo_info['updated_at']
        },
        'languages': languages,
        'commit_activity': {
            'total_commits': len(commits),
            'recent_commits': [{'sha': c['sha'][:7], 
                              'message': c['commit']['message'],
                              'date': c['commit']['author']['date']} 
                             for c in commits[:5]]
        },
        'contributors': [{'login': c['login'], 
                         'contributions': c['contributions']} 
                        for c in contributors],
        'ai_analysis': ai_results,
        'analysis_date': datetime.utcnow().isoformat()
    }


@app.route('/')
def index():
    if not github.authorized:
        return redirect(url_for('github.login'))
    return redirect('http://localhost:3000')  # Redirect to React app after auth


@app.route('/api/analyze', methods=['POST'])
def analyze():
    if not github.authorized:
        return jsonify({'error': 'Not authorized'}), 401
    
    user_data = github.get('/user').json()
    username = user_data['login']
    
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