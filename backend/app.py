"""
TrASH - Trump Automated Search Hub - Flask Backend
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from elasticsearch import Elasticsearch, helpers
import csv
import os
from datetime import datetime
import hashlib
import re
import urllib.parse

app = Flask(__name__)
CORS(app)  # Enable cross-origin requests from frontend

class TrASHSearchEngine:
    def __init__(self, host='localhost', port=9200):
        # Connect to Elasticsearch instance
        try:
            self.es = Elasticsearch([{'host': host, 'port': port, 'scheme': 'http'}])
            if not self.es.ping():
                raise Exception("Cannot connect to Elasticsearch")
            print("Connected to Elasticsearch")
        except Exception as e:
            print(f"Connection error: {e}")
            raise
        
        # Delete old index for fresh start
        # print("DELETING OLD INDEX")
        self.es.indices.delete(index='trump_posts', ignore=[400, 404])

        self.index_name = 'trump_posts'
        self.create_index()

    def create_index(self):
        # Define Elasticsearch mapping for document structure and field types
        mapping = {
            "mappings": {
                "properties": {
                    "status_message": {
                        "type": "text",
                        "analyzer": "english",
                        "fields": {"raw": {"type": "keyword"}}
                    },
                    "link_name": {"type": "text", "analyzer": "standard"},
                    "status_type": {"type": "keyword"},
                    "status_link": {"type": "keyword"},
                    "status_published": {
                        "type": "date",
                        "format": "M/d/yyyy H:mm:ss||M/d/yyyy HH:mm:ss||M/d/yyyy||yyyy-MM-dd"  # Support multiple date formats including ISO
                    },
                    "num_reactions": {"type": "integer"},
                    "num_comments": {"type": "integer"},
                    "num_shares": {"type": "integer"},
                    "num_likes": {"type": "integer"},
                    "num_loves": {"type": "integer"},
                    "num_wows": {"type": "integer"},
                    "num_hahas": {"type": "integer"},
                    "num_sads": {"type": "integer"},
                    "num_angrys": {"type": "integer"}
                }
            }
        }
        
        # Create index with mapping if it doesn't exist
        if not self.es.indices.exists(index=self.index_name):
            self.es.indices.create(index=self.index_name, body=mapping)
            print(f"Created index '{self.index_name}'")

    def import_csv(self, csv_file):
        # Check if CSV file exists before importing
        if not os.path.exists(csv_file):
            return {"success": False, "error": f"File '{csv_file}' not found"}
        
        try:
            count = 0
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                actions = []
                
                for row in reader:
                    for field in ['num_reactions', 'num_comments', 'num_shares', 
                                  'num_likes', 'num_loves', 'num_wows', 
                                  'num_hahas', 'num_sads', 'num_angrys']:
                        try:
                            row[field] = int(row[field]) if row[field] else 0
                        except (ValueError, KeyError):
                            row[field] = 0
                    
                    # if i find empty strings then i replace them with None
                    for key in row:
                        if row[key] == '':
                            row[key] = None
                    
                    # Generate unique ID - use hash instead of URL to avoid routing issues
                    if row.get('status_link'):
                        # Use MD5 hash of the URL as ID to avoid routing problems with slashes
                        unique_id = hashlib.md5(row['status_link'].encode('utf-8')).hexdigest()
                    else:
                        unique_string = str(row.get('status_message', '')) + str(row.get('status_published', ''))
                        unique_id = hashlib.md5(unique_string.encode('utf-8')).hexdigest()

                    action = {
                        "_index": self.index_name,
                        "_id": unique_id, 
                        "_source": row
                    }

                    actions.append(action)
                    count += 1
                    
                    if len(actions) >= 500:
                        helpers.bulk(self.es, actions, raise_on_error=False)
                        actions = []
                
                if actions:
                    helpers.bulk(self.es, actions, raise_on_error=False)

            # Refresh index to make documents searchable
            self.es.indices.refresh(index=self.index_name)
            return {"success": True, "count": count}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search(self, query, search_type='text', size=10, filters=None):
        # Build query based on search type and filters
        es_query = self._build_query(query, search_type, filters)
        
        try:
            result = self.es.search(
                index=self.index_name,
                body={
                    "query": es_query,
                    "highlight": {"fields": {"status_message": {}}},  # Highlight matching terms
                    "sort": [{"num_reactions": {"order": "desc"}}]  # Sort by popularity
                },
                size=size
            )
            return [self._format_hit(hit) for hit in result['hits']['hits']]
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def _build_query(self, query, search_type, filters):
        must = []  # All conditions that must match
        
        if query:
            if search_type == 'phrase':
                # Search for exact phrase
                must.append({"match_phrase": {"status_message": query}})
            elif search_type == 'boolean':
                # Convert AND/OR/NOT to Elasticsearch operators +/|/-
                cleaned_query = query
                cleaned_query = re.sub(r'\s+AND\s+', ' +', cleaned_query, flags=re.IGNORECASE)
                cleaned_query = re.sub(r'\s+OR\s+', ' | ', cleaned_query, flags=re.IGNORECASE)
                cleaned_query = re.sub(r'\s+NOT\s+', ' -', cleaned_query, flags=re.IGNORECASE)
                
                must.append({
                    "simple_query_string": {
                        "query": cleaned_query,
                        "fields": ["status_message"],
                        "default_operator": "AND"  # Default to AND when no operator specified
                    }
                })
            else:
                # Standard text search with relevance scoring
                must.append({"match": {"status_message": query}})
        
        # Apply rest of the filters if given
        if filters:
            if filters.get('status_type'):
                must.append({"term": {"status_type": filters['status_type']}})
            if filters.get('min_reactions'):
                must.append({"range": {"num_reactions": {"gte": filters['min_reactions']}}})
            if filters.get('date_from'):
                # Convert date to start of day
                must.append({"range": {"status_published": {"gte": filters['date_from'] + "||/d"}}})
            if filters.get('date_to'):
                # Convert date to end of day
                must.append({"range": {"status_published": {"lte": filters['date_to'] + "||/d"}}})
        
        # Return match_all query if no conditions specified
        if not must:
            return {"match_all": {}}
        
        return {"bool": {"must": must}}

    def _format_hit(self, hit):
        # Format Elasticsearch result for frontend consumption
        post = hit['_source']
        post['id'] = hit['_id']
        post['score'] = hit['_score']  # Include relevance score
        # Add highlighted snippet if available
        if 'highlight' in hit and 'status_message' in hit['highlight']:
            post['highlight'] = ' '.join(hit['highlight']['status_message'])
        return post

    def get_post(self, post_id):
        # Retrieve single post by ID
        try:
            result = self.es.get(index=self.index_name, id=post_id)
            post = result['_source']
            post['id'] = result['_id']
            return post
        except Exception as e:
            print(f"Error getting post {post_id}: {e}")
            return None

    def delete_post(self, post_id):
        # Delete post from index
        try:
            self.es.delete(index=self.index_name, id=post_id)
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def find_similar(self, post_id, size=10):
        # Find posts similar to given post
        try:
            # Get the source text first
            post = self.es.get(index=self.index_name, id=post_id)
            text = post['_source'].get('status_message', '')
            
            query = {
                "bool": {
                    "must": [
                        {
                            "more_like_this": {
                                "fields": ["status_message"],
                                "like": text,  # Find documents similar to this text
                                "min_term_freq": 1,
                                "max_query_terms": 20,
                                "min_doc_freq": 1
                            }
                        }
                    ],
                    # Exclude the original post from results
                    "must_not": [
                        {"ids": {"values": [post_id]}}
                    ]
                }
            }
            
            result = self.es.search(
                index=self.index_name,
                body={"query": query},
                size=size
            )
            return [self._format_hit(hit) for hit in result['hits']['hits']]
        except Exception as e:
            print(f"Error in find_similar: {e}")
            return []

    def get_stats(self):
        # Get statistics not the posts themselves
        try:
            result = self.es.search(
                index=self.index_name,
                body={
                    "size": 0, # not posts just statistics
                    "aggs": {
                        "total_reactions": {"sum": {"field": "num_reactions"}},
                        "avg_reactions": {"avg": {"field": "num_reactions"}},
                        "post_types": {"terms": {"field": "status_type"}}  # Count posts by type
                    }
                }
            )
            
            # Get total document count
            count_result = self.es.count(index=self.index_name)
            
            return {
                "total": count_result['count'],
                "total_reactions": int(result['aggregations']['total_reactions']['value']),
                "avg_reactions": int(result['aggregations']['avg_reactions']['value']),
                "types": {
                    bucket['key']: bucket['doc_count'] 
                    for bucket in result['aggregations']['post_types']['buckets']
                }
            }
        except:
            return {"total": 0, "total_reactions": 0, "avg_reactions": 0, "types": {}}


# Initialize search engine on startup
engine = TrASHSearchEngine()

# API Routes
@app.route('/api/import', methods=['POST'])
def import_posts():
    # Import posts from CSV file
    csv_file = request.json.get('filename', 'Facebook posts by DonaldTrump.csv')
    result = engine.import_csv(csv_file)
    return jsonify(result)

@app.route('/api/search', methods=['POST'])
def search_posts():
    # Search posts with query, type, and filters
    data = request.json
    query = data.get('query', '')
    search_type = data.get('search_type', 'text')
    size = data.get('size', 10)
    filters = data.get('filters', {})
    
    results = engine.search(query, search_type, size, filters)
    return jsonify(results)

@app.route('/api/post/<post_id>', methods=['GET'])
def get_post(post_id):
    # Get single post by ID
    post = engine.get_post(post_id)
    if post:
        return jsonify(post)
    return jsonify({"error": "Post not found"}), 404

@app.route('/api/post/<post_id>', methods=['DELETE'])
def delete_post(post_id):
    # Delete post by ID
    result = engine.delete_post(post_id)
    return jsonify(result)

@app.route('/api/similar/<post_id>', methods=['GET'])
def find_similar(post_id):
    # Find posts similar to given post
    size = request.args.get('size', 10, type=int)
    results = engine.find_similar(post_id, size)
    return jsonify(results)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Get aggregated statistics
    stats = engine.get_stats()
    return jsonify(stats)

@app.route('/api/health', methods=['GET'])
def health():
    # Health check endpoint
    return jsonify({"status": "ok", "elasticsearch": engine.es.ping()})

if __name__ == '__main__':
    app.run(debug=True, port=5000)