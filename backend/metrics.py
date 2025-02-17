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

def generate_metrics(repo_info, files_content, url):
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
