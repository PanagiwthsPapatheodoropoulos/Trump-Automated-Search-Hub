# TrASH - Trump Automated Search Hub

## Requirements
Python 3.7+

Npm & Node.js

Elasticsearch 7.17.x

## Instruction
Please open 3 different terminals to run the application simultaneously.

## Installation
### 1. Install & Start Elasticsearch

**Windows:**
```bash
cd C:\path\to\elasticsearch-7.17.x
bin\elasticsearch.bat
```

**Linux/Mac:**
```bash
tar -xzf elasticsearch-7.17.x.tar.gz
cd /path/to/elasticsearch-7.17.x
./bin/elasticsearch
```

### 2. Install Python Dependencies
```bash
pip install -r requirements.txt
python app.py
```

### 3. Frontend (React + CSS)
```bash
npm install
npm run dev
```

## Execution
Open three terminals and execute the commands mentioned above. Ensure you allow a few moments for Elasticsearch to fully initialize and establish a connection.

Note on First Execution:
On the first run, the database will be empty.

Click the Settings icon in the top right corner.

Press the Import from CSV button.

Statistics will be updated automatically, and you can then proceed with the search operations and exercises.

## Additional Implemented Features
Full-Stack Architecture: A complete web application utilizing Python for the backend, Elasticsearch for indexing, and React.js for the frontend.

Improved Search Syntax: Enhanced the user experience by replacing the cumbersome +/|/- syntax with intuitive AND/OR/NOT operators.

MD5 Hashing: Implemented unique identifier generation using MD5 hashing (based on Content + Date). This ensures that re-importing data does not create duplicates.

Real-time Dashboard: Added a dashboard featuring live statistics (Elasticsearch Aggregations) showing data distributions (Total Reactions, Post Types, Averages) in real-time.
