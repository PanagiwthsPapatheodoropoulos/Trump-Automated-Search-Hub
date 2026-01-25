 # TrASH — Trump Automated Search Hub

[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-7.17.x-005571?style=for-the-badge&logo=elasticsearch)](https://www.elastic.co/)
[![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![React](https://img.shields.io/badge/React-Frontend-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**TrASH** is a high-performance, full-stack search engine platform designed to index and analyze large datasets. Leveraging the power of Elasticsearch for complex queries and React for an intuitive user experience, it provides real-time data insights and advanced information retrieval capabilities.



---

 ## 🚀 Key Features

 ### Advanced Information Retrieval
* **Intuitive Syntax:** Replaced cumbersome standard query operators with user-friendly `AND`, `OR`, and `NOT` logic.
* **Retrieval Models:** Implemented advanced Boolean and Vector Space (BM25) models for superior search relevance.
* **Smart Matching:** Supports phrase matching and "More-Like-This" document similarity.

 ### Data Integrity & Analytics
* **MD5 Deduplication:** Implemented unique identifier generation using MD5 hashing (Content + Date) to prevent duplicate entries during data re-imports.
* **Real-time Dashboard:** Live statistics powered by Elasticsearch Aggregations, visualizing total reactions, post types, and data averages in real-time.

---

 ## 🛠️ Tech Stack

**Backend:** Python (Flask), Elasticsearch 7.17.x  
**Frontend:** React.js, Vite, CSS3  
**Data Engineering:** CSV Processing, MD5 Hashing, Elasticsearch Aggregations  

---

 ## ⚙️ Installation & Setup

Please open **three different terminals** to run the application components simultaneously.

 ### 1. Elasticsearch Engine
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

## 📉 Execution
Open three terminals and execute the commands mentioned above. Ensure you allow a few moments for Elasticsearch to fully initialize and establish a connection.

Note on First Execution:
On the first run, the database will be empty.

Click the Settings icon in the top right corner.

Press the Import from CSV button.

Statistics will be updated automatically, and you can then proceed with the search operations and exercises.

## 📄 License & Legal Restrictions
Proprietary / Source-Available

Copyright © 2026 Panagiotis Papatheodoropoulos. All rights reserved.

This repository is NOT open-source. The code is provided for viewing and educational purposes only. By accessing this repository, you agree to the following restrictions:

Commercial Use: You are strictly prohibited from using this code, or any portion of it, for commercial purposes or business activities.

* Redistribution: You may not redistribute, sell, sublicense, or host public versions of this software.

* Modifications: You may not modify the software for any purpose other than personal, private study.

* Recruiters/Employers: A limited exception is granted to potential employers and recruiters to run this project locally for the sole purpose of technical evaluation.

Unauthorized copying, modification, or distribution of this code via any medium is strictly prohibited and protected under copyright law.