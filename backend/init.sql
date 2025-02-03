CREATE DATABASE github_analyzer;

\c github_analyzer

CREATE TABLE repo_analysis (
    id SERIAL PRIMARY KEY,
    repo_url VARCHAR(500) UNIQUE NOT NULL,
    repo_hash VARCHAR(32) UNIQUE NOT NULL,
    analysis_data JSONB NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1
);

CREATE INDEX idx_repo_hash ON repo_analysis(repo_hash);
CREATE INDEX idx_created_at ON repo_analysis(created_at);
CREATE INDEX idx_access_count ON repo_analysis(access_count DESC);
