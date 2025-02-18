import traceback
from flask import Flask, jsonify, request, send_from_directory
import json
import os
import requests
import urllib
from datetime import datetime, timezone
import hashlib
from dotenv import load_dotenv
import base64
import random
from bs4 import BeautifulSoup

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
load_dotenv()

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
app.config.update(
    SESSION_COOKIE_SECURE=False,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='Lax',
    SESSION_TYPE='filesystem'
)

app.secret_key = os.getenv('FLASK_SECRET_KEY')

def get_repo_hash(repo_url):
    return hashlib.md5(repo_url.encode()).hexdigest()
    
def analyze_code_with_ai(repo_info, files_content, url):
    openrouter_api_key = os.getenv('OPENROUTER_API_KEY')


    # Process repository metadata
    repo_metadata = f"""
            Repository Metadata:
            - Name: {repo_info['name']}
            - Description: {repo_info['description']}
            - Stars: {repo_info['stars']}
            - Forks: {repo_info['forks']}
            - Watchers: {repo_info['watchers_count']}
            - Total Commits: {repo_info['total_commits']}
            - Tags Count: {len(repo_info['tags'])}
            - Collaborators Count: {len(repo_info['collaborators'])}
            - Open Issues: {repo_info['open_issues_count']}
            - Created: {repo_info['created_at']}
            - Last Updated: {repo_info['last_updated']}
        """

    # Experiment with varied personas
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

    s1 = f"Throughout this analysis I want you take on the persona of {random_personality} and use some emojis. With this persona in mind, you are also crypto coin trader."
    s2 = "Throughout this analysis I want you to be serious but fun and use emojis. You are a crypto coin trader who is slightly humorous."

    analysis_prompt = f"""
        {s2}
        
        We together are seeking out coins with software projects.
        There are a lot of scam projects that steal code or do not work. 
        Please look for plagiarized code, poor code practices such as exposed API keys (Keys that are not empty or placeholders), and the history of the repository.
        Repositories that are brand new or have all their commits within a week indicate scam likely projects.

        Here is a baseline:
        https://github.com/zxvghy/SOLpanion-extension is a score of Beware.
        https://github.com/sgAIqO0psl51xk/coinseek is a score of Caution.
        https://github.com/Stanford/AWS-SSO and https://github.com/manderson95393/gitanalyze is a score of Average.
        https://github.com/elizaOS/eliza is a score of Good.
        https://github.com/0xPlaygrounds/rig is a score of Excellent.

        Here is the repository url and metadata:
        {url, repo_metadata} 

        The very first output should be a grade: Beware, Caution, Average, Good, and Excellent.

        Begin the introduction next.

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
        
        if "Beware" in analysis_text[:25]:
            grade = "Beware"
        elif "Caution" in analysis_text[:25]:
            grade = "Caution"
        elif "Average" in analysis_text[:25]:
            grade = "Average"
        elif "Good" in analysis_text[:25]:
            grade = "Good"
        elif "Excellent" in analysis_text[:25]:
            grade = "Excellent"        
        else:
            grade = "Average"

        rating = None
        normalized_score = None
        score_components = None
        findings = None
        analysis = {
            "score": rating,
            "numeric_score": normalized_score,
            "score_breakdown": score_components,
            "strengths": findings,
            "areas_for_improvement": findings,
            "recommendations": findings,
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
    # Get the GitHub token from an environment variable
    token = os.getenv('GITHUB_PAT')
    if not token:
        raise Exception('GitHub PAT not found. Ensure it is set in the environment.')

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


def is_public_github_repo(repo_url, headers):
    try:
        # Validate the URL format
        if not repo_url.startswith("https://github.com/"):
            return False, "Invalid GitHub URL"

        # Extract owner and repository name
        parts = repo_url.rstrip("/").split("/")
        if len(parts) < 5:  # URL should have at least "https://github.com/{owner}/{repo}"
            return False, "Invalid GitHub repository format"

        owner, repo = parts[-2], parts[-1]
        
        # GitHub API endpoint for the repository
        api_url = f"https://api.github.com/repos/{owner}/{repo}"

        # Make an unauthenticated request
        response = requests.get(api_url, headers=headers)

        if response.status_code == 200:
            return True, "Valid public GitHub repository"
        elif response.status_code == 404:
            return False, "Repository not found or private"
        else:
            return False, f"Unexpected status code: {response.status_code}"
    except Exception as e:
        return False, f"Error: {str(e)}"
    

def parse_number(text):
    """Parse numbers that might include k, m suffixes"""
    if not text:
        return 0
        
    # Clean up the text
    text = text.strip().lower()
    
    # Handle k/m suffixes
    multiplier = 1
    if 'k' in text:
        multiplier = 1000
        text = text.replace('k', '')
    elif 'm' in text:
        multiplier = 1000000
        text = text.replace('m', '')
        
    try:
        # Extract numeric part
        number = float(''.join(c for c in text if c.isdigit() or c == '.'))
        return int(number * multiplier)
    except (ValueError, TypeError):
        return 0
    

def scrape_repository_info(repo_url):
    """Scrape basic repository information from GitHub webpage."""
    try:
        response = requests.get(repo_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get star count - Updated selector
        stars_element = soup.select_one('a[href$="stargazers"] span.Counter')
        stars = parse_number(stars_element.text.strip() if stars_element else '0')
        
        # Get fork count - Updated selector
        forks_element = soup.select_one('a[href$="forks"] span.Counter')
        forks = parse_number(forks_element.text.strip() if forks_element else '0')
        
        # Get languages - Updated selector and parsing
        languages = {}
        lang_stats = soup.select('div[data-test-selector="languages-stats"] span.color-fg-default')
        for lang_elem in lang_stats:
            lang_name = lang_elem.text.strip()
            # Find the percentage in the next sibling
            percent_elem = lang_elem.find_next_sibling('span', class_='color-fg-muted')
            if percent_elem:
                percent_text = percent_elem.text.strip().rstrip('%')
                try:
                    lang_percent = float(percent_text)
                    languages[lang_name] = lang_percent
                except ValueError:
                    continue
        
        # Get creation date and last update - Updated selector
        dates = soup.select('relative-time')
        created_at = None
        last_updated = None
        
        if dates:
            try:
                # Look for creation date in page text
                creation_element = soup.find('span', string=lambda text: text and 'Created' in text)
                if creation_element:
                    created_time = creation_element.find_next('relative-time')
                    if created_time:
                        created_at = created_time.get('datetime')
                
                # Last updated is typically the first relative-time element
                last_updated = dates[0].get('datetime')
            except Exception as e:
                print(f"Error parsing dates: {e}")
        
        # Fallback dates if not found
        if not created_at:
            created_at = datetime.now(timezone.utc).isoformat()
        if not last_updated:
            last_updated = datetime.now(timezone.utc).isoformat()
        
        # Get contributors count - Updated selector
        contributors_element = soup.select_one('a[href$="contributors"] span.Counter')
        contributors_count = parse_number(contributors_element.text.strip() if contributors_element else '0')
        
        return {
            'stars': stars,
            'forks': forks,
            'languages': languages,
            'created_at': created_at,
            'last_updated': last_updated,
            'contributors_count': contributors_count
        }
    except Exception as e:
        print(f"Error scraping repository: {e}")
        # Return default values if scraping fails
        return {
            'stars': 0,
            'forks': 0,
            'languages': {},
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_updated': datetime.now(timezone.utc).isoformat(),
            'contributors_count': 0
        }
    

def analyze_repository(repo_url):
    try:
        # Get the GitHub token from an environment variable
        token = os.getenv('GITHUB_PAT')
        if not token:
            raise Exception('GitHub PAT not found. Ensure it is set in the environment.')

        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }

        # URL Validation
        valid = is_public_github_repo(repo_url, headers)
        if not valid[0]:
            return "Invalid"
        
        parts = repo_url.rstrip("/").split("/")
        if len(parts) < 5:  # URL should have at least "https://github.com/{owner}/{repo}"
            return False, "Invalid GitHub repository format"

        owner, repo = parts[-2], parts[-1]

        base_url = f'https://api.github.com/repos/{owner}/{repo}'
                
        repo_response = requests.get(base_url, headers=headers)
        repo_info = repo_response.json()

        # Web scrape repo -----------------
        # Scrape basic repository information
        scraped_info = scrape_repository_info(repo_url)

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
            'contributors': scraped_info['contributors_count']
        }

        ai_analysis = analyze_code_with_ai({
            'name': repo_info['name'],
            'description':repo_info['description'],
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
    except Exception as e:
        print(e)

@app.route('/')
def serve():
    """Serve React App"""
    return send_from_directory(app.static_folder, 'index.html')

# Handle React routing by returning index.html for all non-API routes
@app.errorhandler(404)
def not_found(e):
    if request.path.startswith('/api/'):
        return jsonify(error=str(e)), 404
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    # Get the GitHub token from an environment variable
    token = os.getenv('GITHUB_PAT')
    if not token:
        raise Exception('GitHub PAT not found. Ensure it is set in the environment.')
    
    try:
        # Github authentication check
        headers = {
            'Authorization': f'token {token}',
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
                
        analysis = analyze_repository(repo_url)

        if not analysis:
            return jsonify({'error': 'Analysis failed'}), 500
            
        if analysis == 'Invalid':
            return jsonify({'error': 'Invalid GitHub Repository'}), 500
                
        response_data = {
            'analysis': analysis,
            'cached': False,
            'analyzed_by': username,
            'analyzed_at': datetime.now(timezone.utc).isoformat()
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        print(f"Error in analyze route: {str(e)}")
        traceback.print_exc()  # Print full stack trace
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        app.run(debug=True)
