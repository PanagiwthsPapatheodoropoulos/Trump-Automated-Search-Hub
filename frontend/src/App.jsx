import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Upload, Trash2, Settings, FileText, AlertCircle, CheckCircle, Loader, X, Calendar, BarChart3 } from 'lucide-react';
import './App.css';

const API_BASE = '/api';

function App() {
  // State for posts and search results
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [topK, setTopK] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState(null);
  
  // Filter state variables
  const [filterType, setFilterType] = useState('');
  const [minReactions, setMinReactions] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load statistics on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Fetch statistics from backend
    try {
      const response = await axios.get(`${API_BASE}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const showNotification = (message, type = 'info') => {
    // Display temporary notification that auto-dismisses after 4 seconds
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleImport = async () => {
    // Import CSV data into Elasticsearch
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/import`, {
        filename: 'Facebook posts by DonaldTrump.csv'
      });
      
      if (response.data.success) {
        showNotification(`Successfully imported ${response.data.count} posts!`, 'success');
        loadStats();  // Refresh stats after import
      } else {
        showNotification(`Error: ${response.data.error}`, 'error');
      }
    } catch (error) {
      showNotification('Import error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    // Perform search with query, type, and filters
    setLoading(true);
    try {
      // Build filters object from form inputs
      const filters = {};
      if (filterType) filters.status_type = filterType;
      if (minReactions) filters.min_reactions = parseInt(minReactions);
      if (dateFrom) filters.date_from = dateFrom;
      if (dateTo) filters.date_to = dateTo;

      const response = await axios.post(`${API_BASE}/search`, {
        query: searchQuery,
        search_type: searchType,
        size: topK,
        filters
      });

      // Remove duplicate posts based on message and date
      const uniquePosts = response.data.filter((post, index, self) =>
        index === self.findIndex((t) => (
          t.status_message === post.status_message && 
          t.status_published === post.status_published
        ))
      );

      setPosts(uniquePosts);
      showNotification(`Found ${response.data.length} results`, 'success');
    } catch (error) {
      showNotification('Search error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    // Delete post from Elasticsearch
    try {
      const response = await axios.delete(`${API_BASE}/post/${postId}`);
      if (response.data.success) {
        setPosts(posts.filter(p => p.id !== postId));  // Remove from UI
        showNotification('Post deleted', 'success');
        loadStats();  // Refresh stats after deletion
      }
    } catch (error) {
      showNotification('Delete error', 'error');
    }
  };

  const handleViewPost = async (postId) => {
    // Fetch and display full post details in modal
    try {
      const response = await axios.get(`${API_BASE}/post/${postId}`);
      setSelectedPost(response.data);
    } catch (error) {
      showNotification('Error loading post', 'error');
    }
  };

  const handleFindSimilar = async (postId) => {
    // Find and display posts similar to given post
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/similar/${postId}?size=${topK}`);
      setPosts(response.data);
      showNotification(`Found ${response.data.length} similar posts`, 'success');
    } catch (error) {
      showNotification('Error finding similar posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    // Clear all search inputs and filters
    setSearchQuery('');
    setFilterType('');
    setMinReactions('');
    setDateFrom('');
    setDateTo('');
    setPosts([]);
    showNotification('Filters reset', 'info');
  };

  return (
    <div className="app">
      {/* Show notification banner at top */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {notification.message}
        </div>
      )}

      <div className="container">
        {/* Header*/}
        <div className="header">
          <div>
            <h1>TrASH</h1>
            <p>Trump Automated Search Hub</p>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className="btn-icon">
            <Settings size={28} />
          </button>
        </div>

        {/* Settings panel*/}
        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h3>Settings</h3>
              <button onClick={() => setShowSettings(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="settings-content">
              <div className="form-group">
                <label>Top-K Results</label>
                <input
                  type="text"
                  inputMode='numeric'
                  value={topK}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setTopK('');
                    } else {
                      const parsed = parseInt(val);
                      if (!isNaN(parsed)) {
                        setTopK(parsed);
                      }
                    }
                  }}
                  min="1"
                  max="100"
                />
              </div>
              <button onClick={handleImport} disabled={loading} className="btn-primary full-width">
                <Upload size={20} />
                Import from CSV
              </button>
            </div>
          </div>
        )}

        {/* Statistics cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <FileText className="stat-icon blue" size={32} />
              <div>
                <p className="stat-label">Total Posts</p>
                <p className="stat-value">{stats.total}</p>
              </div>
            </div>
            <div className="stat-card">
              <BarChart3 className="stat-icon green" size={32} />
              <div>
                <p className="stat-label">Total Reactions</p>
                <p className="stat-value">{stats.total_reactions.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <BarChart3 className="stat-icon orange" size={32} />
              <div>
                <p className="stat-label">Average</p>
                <p className="stat-value">{stats.avg_reactions.toLocaleString()}</p>
              </div>
            </div>
            <div className="stat-card">
              <div>
                <p className="stat-label">Post Types</p>
                {/* Show count for each post type */}
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} className="stat-row">
                    <span className="capitalize">{type}:</span>
                    <span className="bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main search panel */}
        <div className="search-panel">
          <div className="search-grid">
            {/* Search input */}
            <div className="search-input-group">
              <label>Search</label>
              <div style={{ position: 'relative' }}>
                <Search 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    pointerEvents: 'none',
                    zIndex: 1
                  }} 
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Enter search terms..."
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>
            {/* Search type select form text/phrase/boolean */}
            <div className="form-group">
              <label>Search Type</label>
              <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                <option value="text">Text (Vector Space)</option>
                <option value="phrase">Phrase</option>
                <option value="boolean">Boolean (AND/OR/NOT)</option>
              </select>
            </div>
          </div>

          {/* Filter inputs for type, reactions, and dates */}
          <div className="filters-grid">
            <div className="form-group">
              <label>Post Type</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="form-group">
              <label>Min Reactions</label>
              <input
                type="number"
                value={minReactions}
                onChange={(e) => setMinReactions(e.target.value)}
                placeholder="e.g. 1000"
              />
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Search and reset buttons */}
          <div className="button-group">
            <button onClick={handleSearch} disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader className="spin" size={20} /> : <Search size={20} />}
              Search
            </button>
            <button onClick={resetFilters} className="btn-secondary">
              <X size={20} />
              Clear
            </button>
          </div>
        </div>

        {/* Results section */}
        <div className="results">
          {/* empty state when no results */}
          {posts.length === 0 && !loading && (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>No results found</p>
            </div>
          )}

          {/* else map through posts and display cards */}
          {posts.map((post, index) => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                {/* Show their rank, type, and date badges */}
                <div className="post-badges">
                  <span className="badge rank">#{index + 1}</span>
                  <span className="badge type">{post.status_type || 'N/A'}</span>
                  <span className="badge date">
                    <Calendar size={16} />
                    {post.status_published}
                  </span>
                </div>
                {/* Action buttons for similar, view, and delete */}
                <div className="post-actions">
                  <button onClick={() => handleFindSimilar(post.id)} className="btn-link">
                    Similar
                  </button>
                  <button onClick={() => handleViewPost(post.id)} className="btn-link success">
                    View
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="btn-link danger">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* content of post, with highlight if available, otherwise first 300 characters */}
              <p className="post-content">
                {post.highlight 
                  ? <span dangerouslySetInnerHTML={{ __html: post.highlight }} />
                  : (post.status_message 
                      ? (post.status_message.length > 300 
                          ? post.status_message.substring(0, 300) + '...' 
                          : post.status_message)
                      : 'No content')
                }
              </p>

              {/* Reaction statistics */}
              <div className="post-stats">
                <div className="stat">
                  <span>👍 Reactions:</span>
                  <span className="value blue">{(post.num_reactions || 0).toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span>💬 Comments:</span>
                  <span className="value green">{(post.num_comments || 0).toLocaleString()}</span>
                </div>
                <div className="stat">
                  <span>🔄 Shares:</span>
                  <span className="value purple">{(post.num_shares || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for viewing full post details */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Full Post</h2>
                <p>ID: {selectedPost.id}</p>
              </div>
              <button onClick={() => setSelectedPost(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-content">
              {/* Full post text */}
              <div className="modal-section">
                <h3>Content</h3>
                <p className="post-text">{selectedPost.status_message || 'No content'}</p>
              </div>

              {/* Type and published date */}
              <div className="modal-grid">
                <div>
                  <h4>Type</h4>
                  <p className="capitalize">{selectedPost.status_type || 'N/A'}</p>
                </div>
                <div>
                  <h4>Date</h4>
                  <p>{selectedPost.status_published}</p>
                </div>
              </div>

              {/* Link to original post if available */}
              {selectedPost.status_link && (
                <div className="modal-section">
                  <h4>Link</h4>
                  <a href={selectedPost.status_link} target="_blank" rel="noopener noreferrer">
                    {selectedPost.status_link}
                  </a>
                </div>
              )}

              {/*reaction statistics */}
              <div className="modal-section">
                <h3>Reaction Statistics</h3>
                {/* Summary cards */}
                <div className="reactions-grid">
                  <div className="reaction-card primary">
                    <p className="label">Total</p>
                    <p className="value">{(selectedPost.num_reactions || 0).toLocaleString()}</p>
                  </div>
                  <div className="reaction-card success">
                    <p className="label">Comments</p>
                    <p className="value">{(selectedPost.num_comments || 0).toLocaleString()}</p>
                  </div>
                  <div className="reaction-card purple">
                    <p className="label">Shares</p>
                    <p className="value">{(selectedPost.num_shares || 0).toLocaleString()}</p>
                  </div>
                </div>

                {/*reaction breakdown */}
                <div className="reactions-detail">
                  <div className="reaction-item">
                    <span>👍 Likes</span>
                    <span>{(selectedPost.num_likes || 0).toLocaleString()}</span>
                  </div>
                  <div className="reaction-item">
                    <span>❤️ Loves</span>
                    <span>{(selectedPost.num_loves || 0).toLocaleString()}</span>
                  </div>
                  <div className="reaction-item">
                    <span>😮 Wows</span>
                    <span>{(selectedPost.num_wows || 0).toLocaleString()}</span>
                  </div>
                  <div className="reaction-item">
                    <span>😂 Hahas</span>
                    <span>{(selectedPost.num_hahas || 0).toLocaleString()}</span>
                  </div>
                  <div className="reaction-item">
                    <span>😢 Sads</span>
                    <span>{(selectedPost.num_sads || 0).toLocaleString()}</span>
                  </div>
                  <div className="reaction-item">
                    <span>😡 Angrys</span>
                    <span>{(selectedPost.num_angrys || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;