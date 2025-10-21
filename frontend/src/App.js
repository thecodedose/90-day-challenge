import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth handler component
const AuthHandler = () => {
  const { checkAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch && !processing) {
        setProcessing(true);
        const sessionId = sessionIdMatch[1];
        
        try {
          await axios.post(`${API}/auth/session`, {}, {
            headers: {
              'X-Session-ID': sessionId
            },
            withCredentials: true
          });
          
          // Clean URL and check auth
          window.history.replaceState({}, document.title, location.pathname);
          await checkAuth();
          navigate('/dashboard');
        } catch (error) {
          console.error('Authentication failed:', error);
          navigate('/');
        } finally {
          setProcessing(false);
        }
      }
    };

    processAuth();
  }, [location.hash, navigate, checkAuth, processing]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto mb-4"></div>
          <p className="text-white text-lg">Authenticating...</p>
        </div>
      </div>
    );
  }

  return null;
};

// Landing Page
const LandingPage = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = () => {
    const authUrl = process.env.REACT_APP_AUTH_URL || 'https://auth.emergentagent.com';
    const redirectUrl = encodeURIComponent(`${window.location.origin}/dashboard`);
    window.location.href = `${authUrl}/?redirect=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-6 gradient-text">
            90-Day Lock-In Challenge
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Build 3 real projects in 90 days. Join web developers worldwide in this intensive coding challenge.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="glass-card p-8 text-center hover-lift">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-white mb-3">Month 1</h3>
            <p className="text-gray-300">Real-World Mini App</p>
            <p className="text-sm text-gray-400 mt-2">Build a functional mini application</p>
          </div>
          
          <div className="glass-card p-8 text-center hover-lift">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-3">Month 2</h3>
            <p className="text-gray-300">AI-Integrated Project</p>
            <p className="text-sm text-gray-400 mt-2">Integrate AI/ML into your project</p>
          </div>
          
          <div className="glass-card p-8 text-center hover-lift">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-3">Month 3</h3>
            <p className="text-gray-300">Open Source / Dev Tools</p>
            <p className="text-sm text-gray-400 mt-2">Contribute or build development tools</p>
          </div>
        </div>
        
        <div className="text-center">
          <button
            onClick={handleLogin}
            className="glass-strong text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 hover-lift"
          >
            Start Your Challenge
          </button>
          <p className="text-sm text-gray-300 mt-4">Sign in with Google to begin</p>
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddProject, setShowAddProject] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, {
        withCredentials: true
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white gradient-text">90-Day Challenge</h1>
          <nav className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className="text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
            >
              Explore
            </button>
            <div className="flex items-center space-x-3">
              <img src={user?.picture} alt={user?.name} className="w-8 h-8 rounded-full border border-white/20" />
              <span className="text-white">{user?.name}</span>
              <button 
                onClick={logout}
                className="text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Section */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 hover-lift">
            <h3 className="text-lg font-semibold text-white mb-2">Challenge Progress</h3>
            <div className="text-3xl font-bold text-gray-100 mb-2">
              Day {dashboardData?.days_elapsed || 0}
            </div>
            <p className="text-gray-300 text-sm">{dashboardData?.days_remaining || 90} days remaining</p>
            <div className="mt-4 bg-black/30 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-gray-300 to-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${dashboardData?.challenge_progress || 0}%` }}
              ></div>
            </div>
          </div>
          
          <div className="glass-card p-6 hover-lift">
            <h3 className="text-lg font-semibold text-white mb-2">Total Projects</h3>
            <div className="text-3xl font-bold text-gray-100 mb-2">
              {dashboardData?.total_projects || 0}
            </div>
            <p className="text-gray-300 text-sm">Projects created</p>
          </div>
          
          <div className="glass-card p-6 hover-lift">
            <h3 className="text-lg font-semibold text-white mb-2">Completed</h3>
            <div className="text-3xl font-bold text-gray-100 mb-2">
              {(dashboardData?.month_stats?.month_1?.completed || 0) + 
               (dashboardData?.month_stats?.month_2?.completed || 0) + 
               (dashboardData?.month_stats?.month_3?.completed || 0)}
            </div>
            <p className="text-gray-300 text-sm">Projects finished</p>
          </div>
        </div>

        {/* Projects by Month */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(month => {
            const monthData = dashboardData?.month_stats?.[`month_${month}`] || {};
            const monthProjects = dashboardData?.projects?.filter(p => p.month === month) || [];
            
            return (
              <div key={month} className="glass-card p-6 hover-lift">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Month {month} 
                  {month === 1 && ' - Mini App'}
                  {month === 2 && ' - AI Project'}
                  {month === 3 && ' - Open Source'}
                </h3>
                
                <div className="space-y-3">
                  {monthProjects.length > 0 ? (
                    monthProjects.map(project => (
                      <div key={project.id} className="glass rounded-lg p-3 hover:bg-white/5 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-white text-sm">{project.title}</h4>
                          <button
                            onClick={() => setEditingProject(project)}
                            className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-xs text-gray-300 mt-1">{project.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            project.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            project.status === 'paused' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {project.status === 'completed' ? '✅ Completed' :
                             project.status === 'in-progress' ? '🚧 In Progress' :
                             project.status === 'paused' ? '⏸️ Paused' :
                             '📋 Planning'}
                          </span>
                          {(project.deployed_link || project.github_link) && (
                            <div className="flex space-x-2">
                              {project.deployed_link && (
                                <a 
                                  href={project.deployed_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-300 hover:text-blue-200 text-xs px-2 py-1 rounded hover:bg-blue-500/20"
                                >
                                  Demo
                                </a>
                              )}
                              {project.github_link && (
                                <a 
                                  href={project.github_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-green-300 hover:text-green-200 text-xs px-2 py-1 rounded hover:bg-green-500/20"
                                >
                                  Code
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400 text-sm mb-3">No projects yet</p>
                      <button 
                        onClick={() => setShowAddProject(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Add Project
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-600">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Total: {monthData.total || 0}</span>
                    <span>Completed: {monthData.completed || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Project Button */}
        <div className="text-center">
          <button 
            onClick={() => setShowAddProject(true)}
            className="glass-strong text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 hover-lift"
          >
            Add New Project
          </button>
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <AddProjectModal 
          onClose={() => setShowAddProject(false)} 
          onSuccess={() => {
            setShowAddProject(false);
            fetchDashboardData();
          }} 
        />
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal 
          project={editingProject}
          onClose={() => setEditingProject(null)} 
          onSuccess={() => {
            setEditingProject(null);
            fetchDashboardData();
          }} 
        />
      )}
    </div>
  );
};

// Add Project Modal
const AddProjectModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: '',
    deployed_link: '',
    github_link: '',
    month: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const projectData = {
        ...formData,
        tech_stack: formData.tech_stack.split(',').map(tech => tech.trim()).filter(tech => tech)
      };

      await axios.post(`${API}/projects`, projectData, {
        withCredentials: true
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Add New Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tech Stack (comma separated)</label>
            <input
              type="text"
              required
              value={formData.tech_stack}
              onChange={(e) => setFormData({...formData, tech_stack: e.target.value})}
              placeholder="React, Node.js, MongoDB"
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Month</label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            >
              <option value={1}>Month 1 - Real-World Mini App</option>
              <option value={2}>Month 2 - AI-Integrated Project</option>
              <option value={3}>Month 3 - Open Source / Dev Tools</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deployed Link (optional)</label>
            <input
              type="url"
              value={formData.deployed_link}
              onChange={(e) => setFormData({...formData, deployed_link: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">GitHub Link (optional)</label>
            <input
              type="url"
              value={formData.github_link}
              onChange={(e) => setFormData({...formData, github_link: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-strong disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all duration-300 hover-lift"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Project Modal
const EditProjectModal = ({ project, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: project.title || '',
    description: project.description || '',
    tech_stack: Array.isArray(project.tech_stack) ? project.tech_stack.join(', ') : '',
    deployed_link: project.deployed_link || '',
    github_link: project.github_link || '',
    status: project.status || 'planning'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        ...formData,
        tech_stack: formData.tech_stack.split(',').map(tech => tech.trim()).filter(tech => tech)
      };

      await axios.put(`${API}/projects/${project.id}`, updateData, {
        withCredentials: true
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      setLoading(true);
      try {
        await axios.delete(`${API}/projects/${project.id}`, {
          withCredentials: true
        });
        onSuccess();
      } catch (error) {
        console.error('Failed to delete project:', error);
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">Edit Project</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            >
              <option value="planning">📋 Planning</option>
              <option value="in-progress">🚧 In Progress</option>
              <option value="completed">✅ Completed</option>
              <option value="paused">⏸️ Paused</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tech Stack (comma separated)</label>
            <input
              type="text"
              required
              value={formData.tech_stack}
              onChange={(e) => setFormData({...formData, tech_stack: e.target.value})}
              placeholder="React, Node.js, MongoDB"
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Deployed Link (optional)</label>
            <input
              type="url"
              value={formData.deployed_link}
              onChange={(e) => setFormData({...formData, deployed_link: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">GitHub Link (optional)</label>
            <input
              type="url"
              value={formData.github_link}
              onChange={(e) => setFormData({...formData, github_link: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-500/30 hover:bg-red-500/50 disabled:opacity-50 text-red-200 border border-red-500/40 px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm"
            >
              Delete Project
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="glass-strong disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all duration-300 hover-lift"
              >
                {loading ? 'Updating...' : 'Update Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Profile Page
const ProfilePage = () => {
  const { user: currentUser, logout } = useAuth();
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API}/users/${userId}`);
        setProfileData(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        if (error.response?.status === 404) {
          navigate('/explore');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl text-center">
          <h2 className="text-xl text-white mb-4">User not found</h2>
          <button 
            onClick={() => navigate('/explore')}
            className="glass-strong text-white px-4 py-2 rounded-lg hover-lift"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white gradient-text">90-Day Challenge</h1>
          <nav className="flex items-center space-x-6">
            {currentUser && (
              <>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/explore')}
                  className="text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                >
                  Explore
                </button>
                <div className="flex items-center space-x-3">
                  <img src={currentUser?.picture} alt={currentUser?.name} className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-white">{currentUser?.name}</span>
                  <button 
                    onClick={logout}
                    className="text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
            {!currentUser && (
              <button 
                onClick={() => navigate('/')}
                className="glass-strong text-white px-4 py-2 rounded-lg hover-lift"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="glass-card p-8 mb-8 text-center hover-lift">
          <img 
            src={profileData.user.picture} 
            alt={profileData.user.name}
            className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-white/20"
          />
          <h1 className="text-3xl font-bold text-white mb-2">{profileData.user.name}</h1>
          <p className="text-gray-300 mb-4">90-Day Challenge Participant</p>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{profileData.stats.total_projects}</div>
              <div className="text-sm text-gray-300">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-300">{profileData.stats.completed_projects}</div>
              <div className="text-sm text-gray-300">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-200">Day {profileData.stats.days_elapsed}</div>
              <div className="text-sm text-gray-300">Challenge</div>
            </div>
          </div>
        </div>

        {/* Projects by Month */}
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map(month => {
            const monthProjects = profileData.projects_by_month[month] || [];
            
            return (
              <div key={month} className="glass-card p-6 hover-lift">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Month {month}
                  {month === 1 && ' - Mini App'}
                  {month === 2 && ' - AI Project'}
                  {month === 3 && ' - Open Source'}
                </h3>
                
                <div className="space-y-3">
                  {monthProjects.length > 0 ? (
                    monthProjects.map(project => (
                      <div key={project.id} className="glass rounded-lg p-3 hover:bg-white/5 transition-colors">
                        <h4 className="font-medium text-white text-sm mb-1">{project.title}</h4>
                        <p className="text-xs text-gray-300 mb-2">{project.description}</p>
                        
                        {/* Status */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                            project.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                            project.status === 'paused' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                          }`}>
                            {project.status === 'completed' ? '✅ Completed' :
                             project.status === 'in-progress' ? '🚧 In Progress' :
                             project.status === 'paused' ? '⏸️ Paused' :
                             '📋 Planning'}
                          </span>
                        </div>

                        {/* Tech Stack */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">Tech Stack:</p>
                          <div className="flex flex-wrap gap-1">
                            {project.tech_stack?.map((tech, index) => (
                              <span key={index} className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded border border-white/20">
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Links */}
                        {(project.deployed_link || project.github_link) && (
                          <div className="flex flex-wrap gap-2">
                            {project.deployed_link && (
                              <a 
                                href={project.deployed_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center glass text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 text-xs px-2 py-1 rounded transition-all duration-300"
                              >
                                <span className="mr-1">🚀</span>
                                Demo
                              </a>
                            )}
                            {project.github_link && (
                              <a 
                                href={project.github_link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center glass text-green-300 hover:text-green-200 hover:bg-green-500/20 text-xs px-2 py-1 rounded transition-all duration-300"
                              >
                                <span className="mr-1">💻</span>
                                Code
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-sm">No projects yet</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Total: {monthProjects.length}</span>
                    <span>Completed: {monthProjects.filter(p => p.status === 'completed').length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Explore Page
const ExplorePage = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects/explore`);
        setProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white gradient-text">90-Day Challenge</h1>
          <nav className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate('/explore')}
              className="text-white font-medium bg-white/10 px-3 py-1 rounded-lg"
            >
              Explore
            </button>
            <div className="flex items-center space-x-3">
              <img src={user?.picture} alt={user?.name} className="w-8 h-8 rounded-full border border-white/20" />
              <span className="text-white">{user?.name}</span>
              <button 
                onClick={logout}
                className="text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Project Showcase</h2>
          <p className="text-gray-400">Discover what others are building in their 90-day challenge</p>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No projects shared yet. Be the first to add one!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div 
                key={project.id} 
                className="glass-card p-6 hover-lift cursor-pointer"
                onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/profile/${project.user_id}`);
                    }}
                    className="flex items-center space-x-3 hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
                  >
                    <img 
                      src={project.creator_picture} 
                      alt={project.creator_name} 
                      className="w-10 h-10 rounded-full border border-white/20"
                    />
                    <div>
                      <p className="text-white font-medium hover:text-gray-200">{project.creator_name}</p>
                      <p className="text-gray-400 text-sm">Month {project.month} • View Profile</p>
                    </div>
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
                <p className="text-gray-300 text-sm mb-4">{project.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'completed' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                    project.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                    project.status === 'paused' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {project.status === 'completed' ? '✅ Completed' :
                     project.status === 'in-progress' ? '🚧 In Progress' :
                     project.status === 'paused' ? '⏸️ Paused' :
                     '📋 Planning'}
                  </span>
                  <button className="text-gray-200 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors">
                    {expandedProject === project.id ? 'Less' : 'More'}
                  </button>
                </div>
                
                {expandedProject === project.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-200 mb-2">Tech Stack:</p>
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack?.map((tech, index) => (
                          <span key={index} className="bg-white/10 text-gray-200 text-xs px-2 py-1 rounded border border-white/20">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Links Section */}
                    <div className="space-y-3">
                      {project.deployed_link && (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">🔗</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-300 mb-1">Live Demo:</p>
                            <a 
                              href={project.deployed_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center glass text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 text-sm px-3 py-1 rounded-lg transition-all duration-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="mr-1">🚀</span>
                              View Live Demo
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {project.github_link && (
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">📁</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-300 mb-1">Source Code:</p>
                            <a 
                              href={project.github_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center glass text-green-300 hover:text-green-200 hover:bg-green-500/20 text-sm px-3 py-1 rounded-lg transition-all duration-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="mr-1">💻</span>
                              View Code on GitHub
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {!project.deployed_link && !project.github_link && (
                        <div className="text-center py-2">
                          <p className="text-gray-500 text-sm">No links available yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-300 mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Main App
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthHandler />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/explore" element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
