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

// Navigation Header Component
const NavigationHeader = ({ currentPage = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="glass border-b border-white/10">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-white gradient-text hover:opacity-80 transition-opacity"
        >
          90-Day Challenge
        </button>
        
        <nav className="flex items-center space-x-6">
          {user ? (
            <>
              <button 
                onClick={() => navigate('/dashboard')}
                className={`text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10 ${
                  currentPage === 'dashboard' ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate('/explore')}
                className={`text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10 ${
                  currentPage === 'explore' ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                Explore
              </button>
              <button 
                onClick={() => navigate('/study')}
                className={`text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10 flex items-center space-x-1 ${
                  currentPage === 'study' ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                <span className="text-lg">🍕</span>
                <span>Work</span>
              </button>
              <a
                href="https://discord.gg/NpRgDqYPH5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-pink-300 transition-colors px-3 py-1 rounded-lg hover:bg-pink-500/10 flex items-center space-x-2"
              >
                <span className="text-lg">💬</span>
                <span>Discord</span>
              </a>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="flex items-center space-x-2 hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
                >
                  <img src={user?.picture} alt={user?.name} className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-white">{user?.name}</span>
                </button>
                <button 
                  onClick={logout}
                  className="text-gray-300 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/explore')}
                className={`text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10 ${
                  currentPage === 'explore' ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                Explore
              </button>
              <button 
                onClick={() => navigate('/study')}
                className={`text-gray-200 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10 flex items-center space-x-1 ${
                  currentPage === 'study' ? 'bg-white/10 text-white font-medium' : ''
                }`}
              >
                <span className="text-lg">🍕</span>
                <span>Work</span>
              </button>
              <a
                href="https://discord.gg/NpRgDqYPH5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-200 hover:text-pink-300 transition-colors px-3 py-1 rounded-lg hover:bg-pink-500/10 flex items-center space-x-2"
              >
                <span className="text-lg">💬</span>
                <span>Discord</span>
              </a>
              <button 
                onClick={() => navigate('/')}
                className="glass-strong text-white px-4 py-2 rounded-lg hover-lift"
              >
                Sign In
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
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
      <NavigationHeader currentPage="home" />
      
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
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-pink-500/50"
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
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedJournalDay, setSelectedJournalDay] = useState(null);
  const [todayJournal, setTodayJournal] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard`, {
        withCredentials: true
      });
      setDashboardData(response.data);
      
      // Check if there's a journal entry for today
      const journalResponse = await axios.get(`${API}/journal/today`, {
        withCredentials: true
      });
      setTodayJournal(journalResponse.data);
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
      <NavigationHeader currentPage="dashboard" />

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
                className="bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full transition-all duration-300"
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
                        className="bg-pink-500 hover:bg-pink-600 text-white text-xs px-3 py-1 rounded transition-colors shadow-md shadow-pink-500/30"
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

        {/* Daily Journal Section */}
        <div className="glass-card p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Daily Journal - Day {dashboardData?.days_elapsed || 0}</h3>
            <div className="flex space-x-2">
              {!todayJournal && (
                <button 
                  onClick={() => {
                    setSelectedJournalDay(null);
                    setShowJournalModal(true);
                  }}
                  className="glass text-white text-sm px-4 py-2 rounded-lg hover-lift"
                >
                  Write Today's Entry
                </button>
              )}
              <button 
                onClick={() => {
                  setSelectedJournalDay(null);
                  setShowJournalModal(true);
                }}
                className="glass text-white text-sm px-3 py-2 rounded-lg hover-lift"
              >
                + Add Entry
              </button>
            </div>
          </div>
          
          {todayJournal ? (
            <div className="glass p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{todayJournal.title}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    todayJournal.mood === 'happy' ? 'bg-yellow-500/20 text-yellow-300' :
                    todayJournal.mood === 'excited' ? 'bg-orange-500/20 text-orange-300' :
                    todayJournal.mood === 'focused' ? 'bg-blue-500/20 text-blue-300' :
                    todayJournal.mood === 'tired' ? 'bg-gray-500/20 text-gray-300' :
                    todayJournal.mood === 'frustrated' ? 'bg-red-500/20 text-red-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {todayJournal.mood === 'happy' ? '😊 Happy' :
                     todayJournal.mood === 'excited' ? '🚀 Excited' :
                     todayJournal.mood === 'focused' ? '🎯 Focused' :
                     todayJournal.mood === 'tired' ? '😴 Tired' :
                     todayJournal.mood === 'frustrated' ? '😤 Frustrated' :
                     '😌 Neutral'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedJournalDay(null);
                      setShowJournalModal(true);
                    }}
                    className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <p className="text-gray-300 text-sm">{todayJournal.content}</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No journal entry for today yet</p>
              <p className="text-gray-500 text-sm">Document your challenge journey, thoughts, and progress</p>
            </div>
          )}
        </div>

        {/* Journal Heatmap */}
        <div className="mb-8">
          <JournalHeatmap 
            userId={user?.id} 
            onDayClick={(day) => {
              setSelectedJournalDay(day);
              setShowJournalModal(true);
            }}
          />
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

      {/* Journal Modal */}
      {showJournalModal && (
        <JournalModal 
          existingEntry={selectedJournalDay ? null : todayJournal}
          selectedDay={selectedJournalDay}
          onClose={() => {
            setShowJournalModal(false);
            setSelectedJournalDay(null);
          }} 
          onSuccess={() => {
            setShowJournalModal(false);
            setSelectedJournalDay(null);
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
              className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-md shadow-pink-500/30"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Journal Heatmap Component
const JournalHeatmap = ({ userId, isPublic = false, onDayClick = null }) => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const endpoint = isPublic 
          ? `${API}/users/${userId}/journal/heatmap`
          : `${API}/journal/heatmap`;
        
        const config = isPublic ? {} : { withCredentials: true };
        const response = await axios.get(endpoint, config);
        setHeatmapData(response.data);
      } catch (error) {
        console.error('Failed to fetch heatmap data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [userId, isPublic]);

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  const getCellColor = (dayData) => {
    if (dayData.is_future) {
      return 'bg-gray-800/30 border-gray-700/50';
    }
    
    if (!dayData.has_entry) {
      return 'bg-gray-700/40 border-gray-600/50 hover:bg-gray-600/50';
    }

    // Color based on mood
    const moodColors = {
      'happy': 'bg-yellow-500/60 border-yellow-400/50',
      'excited': 'bg-orange-500/60 border-orange-400/50', 
      'focused': 'bg-blue-500/60 border-blue-400/50',
      'tired': 'bg-gray-500/60 border-gray-400/50',
      'frustrated': 'bg-red-500/60 border-red-400/50',
      'neutral': 'bg-green-500/60 border-green-400/50'
    };

    return moodColors[dayData.mood] || 'bg-green-500/60 border-green-400/50';
  };

  const getTooltipText = (dayData) => {
    const baseText = `Day ${dayData.day} (${dayData.date})`;
    
    if (dayData.is_future) {
      return `${baseText} - Future`;
    }
    
    if (!dayData.has_entry) {
      return `${baseText} - No entry${!isPublic ? ' (click to add)' : ''}`;
    }

    const moodEmoji = {
      'happy': '😊',
      'excited': '🚀', 
      'focused': '🎯',
      'tired': '😴',
      'frustrated': '😤',
      'neutral': '😌'
    };

    return `${baseText} - ${moodEmoji[dayData.mood] || '😌'} ${dayData.content_length} characters${!isPublic ? ' (click to edit)' : ''}`;
  };

  // Group data into 3 months of 30 days each
  const months = [
    { 
      title: "Month 1 - Mini App", 
      days: heatmapData.slice(0, 30), 
      icon: "📱",
      description: "Real-World Mini Application"
    },
    { 
      title: "Month 2 - AI Project", 
      days: heatmapData.slice(30, 60), 
      icon: "🤖",
      description: "AI-Integrated Project"
    },
    { 
      title: "Month 3 - Open Source", 
      days: heatmapData.slice(60, 90), 
      icon: "🚀",
      description: "Open Source / Dev Tools"
    }
  ];

  // Helper function to group days into weeks
  const groupIntoWeeks = (days) => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  };

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold text-white mb-6">
        90-Day Journal Activity
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {months.map((month, monthIndex) => {
          const weeks = groupIntoWeeks(month.days);
          const completedDays = month.days.filter(day => day.has_entry && !day.is_future).length;
          const totalPastDays = month.days.filter(day => !day.is_future).length;
          
          return (
            <div key={monthIndex} className="space-y-3">
              <div className="month-header flex flex-col items-center text-center">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{month.icon}</span>
                  <div>
                    <h4 className="text-sm font-medium text-white">{month.title}</h4>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-2">{month.description}</p>
                <div className="text-center">
                  <div className="text-sm text-white">{completedDays}/{totalPastDays}</div>
                  <div className="text-xs text-gray-400">entries</div>
                </div>
              </div>
              
              <div className="heatmap-container flex justify-center">
                <div className="space-y-1">
                  {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex space-x-1 justify-center">
                      {week.map((day) => (
                        <div
                          key={day.day}
                          className={`heatmap-cell w-4 h-4 rounded border cursor-pointer ${getCellColor(day)}`}
                          title={getTooltipText(day)}
                          onClick={() => {
                            if (!day.is_future && onDayClick) {
                              onDayClick(day.day);
                            }
                          }}
                        />
                      ))}
                      {/* Fill empty cells if the week is incomplete */}
                      {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, emptyIndex) => (
                        <div key={`empty-${weekIndex}-${emptyIndex}`} className="w-4 h-4" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legends */}
      <div className="mt-6 space-y-4">
        {/* Activity Legend */}
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-700/40 border border-gray-600/50"></div>
            <div className="w-3 h-3 rounded bg-green-500/30 border border-green-400/50"></div>
            <div className="w-3 h-3 rounded bg-green-500/60 border border-green-400/50"></div>
            <div className="w-3 h-3 rounded bg-green-500/90 border border-green-400/50"></div>
          </div>
          <span>More</span>
        </div>

        {/* Mood Legend */}
        <div className="heatmap-legend flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-yellow-500/60 border border-yellow-400/50"></div>
            <span className="text-gray-400">😊 Happy</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-orange-500/60 border border-orange-400/50"></div>
            <span className="text-gray-400">🚀 Excited</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-500/60 border border-blue-400/50"></div>
            <span className="text-gray-400">🎯 Focused</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-green-500/60 border border-green-400/50"></div>
            <span className="text-gray-400">😌 Neutral</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-500/60 border border-gray-400/50"></div>
            <span className="text-gray-400">😴 Tired</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-red-500/60 border border-red-400/50"></div>
            <span className="text-gray-400">😤 Frustrated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Journal Modal
const JournalModal = ({ existingEntry, onClose, onSuccess, selectedDay = null }) => {
  const [formData, setFormData] = useState({
    title: existingEntry?.title || '',
    content: existingEntry?.content || '',
    mood: existingEntry?.mood || 'neutral',
    entry_date: selectedDay ? getChallengeDate(selectedDay) : getTodayDate()
  });
  const [loading, setLoading] = useState(false);

  // Helper function to get today's date in YYYY-MM-DD format
  function getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  // Helper function to convert challenge day to date
  function getChallengeDate(challengeDay) {
    const challengeStart = new Date('2025-10-09');
    const entryDate = new Date(challengeStart);
    entryDate.setDate(challengeStart.getDate() + challengeDay - 1);
    return entryDate.toISOString().split('T')[0];
  }

  // Helper function to convert date to challenge day
  function getChallengeDayFromDate(dateStr) {
    const challengeStart = new Date('2025-10-09');
    const entryDate = new Date(dateStr);
    const diffTime = entryDate - challengeStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (existingEntry) {
        // Update existing entry
        await axios.put(`${API}/journal/${existingEntry.id}`, formData, {
          withCredentials: true
        });
      } else {
        // Create new entry
        await axios.post(`${API}/journal`, formData, {
          withCredentials: true
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      if (error.response?.status === 400) {
        alert('You already have a journal entry for today!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold text-white mb-4">
          {existingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          {selectedDay && ` - Day ${selectedDay}`}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input
              type="date"
              required
              value={formData.entry_date}
              min="2025-10-09"
              max="2026-01-06"
              onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Day {getChallengeDayFromDate(formData.entry_date)} of 90
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="What's on your mind?"
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">How are you feeling?</label>
            <select
              value={formData.mood}
              onChange={(e) => setFormData({...formData, mood: e.target.value})}
              className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
            >
              <option value="neutral">😌 Neutral</option>
              <option value="happy">😊 Happy</option>
              <option value="excited">🚀 Excited</option>
              <option value="focused">🎯 Focused</option>
              <option value="tired">😴 Tired</option>
              <option value="frustrated">😤 Frustrated</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              rows={6}
              placeholder="Write about your day, progress, challenges, learnings..."
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
              {loading ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
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

// Study Timer Page
const StudyTimerPage = () => {
  // Timer settings
  const [settings, setSettings] = useState({
    focusDuration: 25, // minutes
    shortBreakDuration: 5, // minutes
    longBreakDuration: 15, // minutes
    sessionsUntilLongBreak: 4
  });
  
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleMusic = () => {
    setIsMusicPlaying(prev => !prev);
    // Music functionality to be added later
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pizza slice component using CSS clipping on real pizza image
  const PizzaSlice = ({ isUnlocked, startAngle, endAngle, index, totalSlices }) => {
    // Create a clipping path for this specific sector
    const createClipPath = () => {
      const centerX = 50;
      const centerY = 50;
      const radius = 45; // Slightly smaller to fit within border
      
      // Convert angles to radians and adjust for CSS coordinate system
      const startAngleRad = (startAngle - 90) * Math.PI / 180;
      const endAngleRad = (endAngle - 90) * Math.PI / 180;
      
      // Calculate multiple points along the arc for smoother curves
      const points = [`${centerX}% ${centerY}%`]; // Center point
      
      // Add start edge
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      points.push(`${x1}% ${y1}%`);
      
      // Add intermediate points along the arc for smoother clipping
      const steps = Math.max(3, Math.floor((endAngle - startAngle) / 15)); // More points for larger slices
      for (let i = 1; i < steps; i++) {
        const intermediateAngle = startAngle + (endAngle - startAngle) * (i / steps);
        const intermediateAngleRad = (intermediateAngle - 90) * Math.PI / 180;
        const x = centerX + radius * Math.cos(intermediateAngleRad);
        const y = centerY + radius * Math.sin(intermediateAngleRad);
        points.push(`${x}% ${y}%`);
      }
      
      // Add end edge
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      points.push(`${x2}% ${y2}%`);
      
      return `polygon(${points.join(', ')})`;
    };

    return (
      <div
        className={`absolute inset-0 transition-all duration-1000 ease-out ${
          isUnlocked ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          clipPath: createClipPath(),
          backgroundImage: 'url(/assets/pizza.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: isUnlocked ? 'brightness(1.05) saturate(1.2) contrast(1.05)' : 'brightness(0.3) saturate(0.5)',
          transform: isUnlocked ? 'scale(1) rotate(0deg)' : 'scale(0.9) rotate(-5deg)',
        }}
      />
    );
  };

  // Complete pizza visualization
  const PizzaVisual = () => {
    const totalSlices = settings.sessionsUntilLongBreak;
    const anglePerSlice = 360 / totalSlices;
    
    return (
      <div className={`pizza-container relative w-40 h-40 mx-auto ${
        completedPomodoros >= totalSlices ? 'pizza-complete' : ''
      }`}>
        {/* Base pizza image (greyed out) */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-800 shadow-2xl">
          {/* Background pizza (always visible but dimmed) */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{
              backgroundImage: 'url(/assets/pizza.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              filter: 'brightness(0.25) saturate(0.4) grayscale(0.6)',
            }}
          />
          
          {/* Revealed pizza slices */}
          {Array.from({ length: totalSlices }).map((_, index) => {
            const startAngle = index * anglePerSlice;
            const endAngle = (index + 1) * anglePerSlice;
            const isUnlocked = completedPomodoros > index;
            
            return (
              <PizzaSlice
                key={index}
                isUnlocked={isUnlocked}
                startAngle={startAngle}
                endAngle={endAngle}
                index={index}
                totalSlices={totalSlices}
              />
            );
          })}
          
          {/* Slice divider lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 160 160">
            {Array.from({ length: totalSlices }).map((_, index) => {
              const angle = index * anglePerSlice;
              const angleRad = (angle - 90) * Math.PI / 180;
              const x = 80 + 70 * Math.cos(angleRad);
              const y = 80 + 70 * Math.sin(angleRad);
              
              return (
                <line
                  key={index}
                  x1="80"
                  y1="80"
                  x2={x}
                  y2={y}
                  stroke="#8B4513"
                  strokeWidth="2"
                  opacity="0.8"
                  className="drop-shadow-sm"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Complete pizza celebration */}
        {completedPomodoros >= totalSlices && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-4xl animate-bounce bg-white/20 backdrop-blur-sm rounded-full p-2">🎉</div>
          </div>
        )}
      </div>
    );
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsRunning(false);
      
      if (!isBreak) {
        // Completed a pomodoro
        setCompletedPomodoros(prev => prev + 1);
        setTotalSessions(prev => prev + 1);
        
        // Check if it's time for a long break
        if ((completedPomodoros + 1) % settings.sessionsUntilLongBreak === 0) {
          setTimeLeft(settings.longBreakDuration * 60);
        } else {
          setTimeLeft(settings.shortBreakDuration * 60);
        }
        setIsBreak(true);
        setCurrentSession(prev => prev + 1);
      } else {
        // Break finished, start new pomodoro
        setTimeLeft(settings.focusDuration * 60);
        setIsBreak(false);
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, isBreak, completedPomodoros]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(settings.focusDuration * 60);
    setIsBreak(false);
  };

  const resetSession = () => {
    setIsRunning(false);
    setTimeLeft(settings.focusDuration * 60);
    setIsBreak(false);
    setCompletedPomodoros(0);
    setCurrentSession(1);
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    // If timer is not running, update current timer with new focus duration
    if (!isRunning && !isBreak) {
      setTimeLeft(newSettings.focusDuration * 60);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Anime Pizzeria Background */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/assets/work-bg.png)',
        }}
      />
      
      {/* Overlay for better text readability */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40" />
      
      {/* Content */}
      <div className="relative z-10">
        <NavigationHeader currentPage="study" />
        
        <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🍕 Pizza Pomodoro Timer</h1>
          <p className="text-gray-300">Focus for 25 minutes, earn a pizza slice! Complete 4 slices for a full pizza!</p>
        </div>

        {/* Compact Unified Card */}
        <div className="max-w-2xl mx-auto glass-card p-8">
          <div className="grid md:grid-cols-2 gap-8 items-center mb-6">
            {/* Pizza Progress - Left Side */}
            <div className="text-center">
              <h3 className="text-base font-semibold text-white mb-4">Your Progress</h3>
              <div className={`pizza-container relative w-32 h-32 mx-auto ${
                completedPomodoros >= settings.sessionsUntilLongBreak ? 'pizza-complete' : ''
              }`}>
                {/* Base pizza image (greyed out) */}
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-amber-800 shadow-2xl">
                  {/* Background pizza (always visible but dimmed) */}
                  <div 
                    className="absolute inset-0 w-full h-full"
                    style={{
                      backgroundImage: 'url(/assets/pizza.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      filter: 'brightness(0.25) saturate(0.4) grayscale(0.6)',
                    }}
                  />
                  
                  {/* Revealed pizza slices */}
                  {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, index) => {
                    const totalSlices = settings.sessionsUntilLongBreak;
                    const anglePerSlice = 360 / totalSlices;
                    const startAngle = index * anglePerSlice;
                    const endAngle = (index + 1) * anglePerSlice;
                    const isUnlocked = completedPomodoros > index;
                    
                    return (
                      <PizzaSlice
                        key={index}
                        isUnlocked={isUnlocked}
                        startAngle={startAngle}
                        endAngle={endAngle}
                        index={index}
                        totalSlices={totalSlices}
                      />
                    );
                  })}
                  
                  {/* Slice divider lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 128 128">
                    {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, index) => {
                      const anglePerSlice = 360 / settings.sessionsUntilLongBreak;
                      const angle = index * anglePerSlice;
                      const angleRad = (angle - 90) * Math.PI / 180;
                      const x = 64 + 56 * Math.cos(angleRad);
                      const y = 64 + 56 * Math.sin(angleRad);
                      
                      return (
                        <line
                          key={index}
                          x1="64"
                          y1="64"
                          x2={x}
                          y2={y}
                          stroke="#8B4513"
                          strokeWidth="2"
                          opacity="0.8"
                          className="drop-shadow-sm"
                        />
                      );
                    })}
                  </svg>
                </div>
                
                {/* Complete pizza celebration */}
                {completedPomodoros >= settings.sessionsUntilLongBreak && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-3xl animate-bounce bg-white/20 backdrop-blur-sm rounded-full p-2">🎉</div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Slices:</span>
                  <span className="text-white font-medium">{completedPomodoros}/{settings.sessionsUntilLongBreak}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sessions:</span>
                  <span className="text-white font-medium">{totalSessions}</span>
                </div>
              </div>

              {completedPomodoros >= settings.sessionsUntilLongBreak && (
                <div className="mt-3 p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-300 text-xs font-medium">🎉 Complete!</p>
                </div>
              )}
            </div>

            {/* Timer - Right Side */}
            <div className="text-center">
              <div className="mb-3">
                <h3 className="text-base font-medium text-white mb-1">
                  {isBreak ? '☕ Break Time' : '🎯 Focus Time'}
                </h3>
                <p className="text-xs text-gray-400">
                  Session {currentSession} • {isBreak ? 'Relax' : 'Focus!'}
                </p>
              </div>

              {/* Timer Display */}
              <div className="text-5xl font-bold text-white mb-6 font-mono">
                {formatTime(timeLeft)}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700/40 rounded-full h-2 mb-6">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${
                    isBreak ? 'bg-green-400' : 'bg-pink-400'
                  }`}
                  style={{
                    width: `${((isBreak ? settings.shortBreakDuration : settings.focusDuration) * 60 - timeLeft) / ((isBreak ? settings.shortBreakDuration : settings.focusDuration) * 60) * 100}%`
                  }}
                />
              </div>

              {/* Controls */}
              <div className="flex justify-center space-x-3 mb-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="glass text-gray-300 hover:text-pink-300 px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 text-sm"
                  disabled={isRunning}
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </button>
                {!isRunning ? (
                  <button
                    onClick={startTimer}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-pink-500/50 transition-all flex items-center space-x-2 text-sm"
                  >
                    <span>▶️</span>
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-pink-500/50 transition-all flex items-center space-x-2 text-sm"
                  >
                    <span>⏸️</span>
                    <span>Pause</span>
                  </button>
                )}
                
                <button
                  onClick={resetTimer}
                  className="glass text-gray-300 hover:text-pink-300 px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={resetSession}
                className="text-gray-400 hover:text-pink-400 text-xs transition-colors"
              >
                Reset Session
              </button>
            </div>
          </div>

          {/* Instructions Toggle */}
          <div className="border-t border-white/10 pt-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between text-white hover:text-pink-300 transition-colors"
            >
              <span className="text-sm font-medium">🍕 How it works</span>
              <span className="text-xl">{showInstructions ? '▼' : '▶'}</span>
            </button>
            
            {showInstructions && (
              <ul className="mt-3 text-xs text-gray-300 space-y-1.5 pl-4">
                <li>• Focus for {settings.focusDuration} minutes = earn 1 pizza slice 🍕</li>
                <li>• Take a {settings.shortBreakDuration}-minute break after each session</li>
                <li>• Every {settings.sessionsUntilLongBreak}th break is {settings.longBreakDuration} minutes long</li>
                <li>• Complete {settings.sessionsUntilLongBreak} slices = full pizza reward! 🎉</li>
                <li>• Use ⚙️ Settings to customize your session durations</li>
              </ul>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <SettingsModal 
            settings={settings}
            onSave={updateSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Music Toggle Button */}
        <button
          onClick={toggleMusic}
          className="fixed bottom-8 right-8 bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-full shadow-2xl shadow-pink-500/50 z-20 flex items-center space-x-2 group transition-all"
          title={isMusicPlaying ? "Pause Music" : "Play Music"}
        >
          <span className="text-2xl">
            {isMusicPlaying ? '⏸️' : '🎵'}
          </span>
          <span className="text-sm font-medium overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs group-hover:ml-2">
            {isMusicPlaying ? 'Pause' : 'Play'} Music
          </span>
        </button>
      </div>
      </div>
    </div>
  );
};

// Settings Modal Component
const SettingsModal = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState(settings);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(1, Math.min(120, parseInt(value) || 1)) // Min 1, Max 120 minutes
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
          <span>⚙️</span>
          <span>Timer Settings</span>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🎯 Focus Session Duration
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="120"
                value={formData.focusDuration}
                onChange={(e) => handleChange('focusDuration', e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
              />
              <span className="text-gray-400 text-sm">minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ☕ Short Break Duration
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="60"
                value={formData.shortBreakDuration}
                onChange={(e) => handleChange('shortBreakDuration', e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
              />
              <span className="text-gray-400 text-sm">minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🛋️ Long Break Duration
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max="60"
                value={formData.longBreakDuration}
                onChange={(e) => handleChange('longBreakDuration', e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
              />
              <span className="text-gray-400 text-sm">minutes</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🍕 Sessions Until Long Break
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="2"
                max="10"
                value={formData.sessionsUntilLongBreak}
                onChange={(e) => handleChange('sessionsUntilLongBreak', e.target.value)}
                className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 backdrop-blur-sm"
              />
              <span className="text-gray-400 text-sm">sessions</span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-3">Quick Presets:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({
                  focusDuration: 25,
                  shortBreakDuration: 5,
                  longBreakDuration: 15,
                  sessionsUntilLongBreak: 4
                })}
                className="glass text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🍅 Classic
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  focusDuration: 50,
                  shortBreakDuration: 10,
                  longBreakDuration: 30,
                  sessionsUntilLongBreak: 4
                })}
                className="glass text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ⚡ Extended
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  focusDuration: 15,
                  shortBreakDuration: 3,
                  longBreakDuration: 10,
                  sessionsUntilLongBreak: 6
                })}
                className="glass text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ⚡ Quick
              </button>
              <button
                type="button"
                onClick={() => setFormData({
                  focusDuration: 90,
                  shortBreakDuration: 15,
                  longBreakDuration: 30,
                  sessionsUntilLongBreak: 3
                })}
                className="glass text-white text-sm px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                🎯 Deep Work
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="glass-strong text-white px-4 py-2 rounded-lg transition-all duration-300 hover-lift"
            >
              Save Settings
            </button>
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
  
  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser && currentUser.id === userId;

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
      <NavigationHeader currentPage="profile" />

      <div className="container mx-auto px-6 py-8">
        {/* Public Profile Notice - Only visible to profile owner */}
        {isOwnProfile && (
          <div className="profile-notice glass-card p-4 mb-6 transition-all duration-300">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">👁️</span>
              <div>
                <h4 className="text-sm font-medium text-blue-300">Public Profile View</h4>
                <p className="text-xs text-gray-300">
                  This is how your profile appears to other users. Your journal entries, projects, and activity are publicly visible.
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-300 hover:text-blue-200 text-xs px-2 py-1 rounded border border-blue-400/30 hover:border-blue-400/50 transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
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
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-300">{profileData.stats.journal_entries || 0}</div>
              <div className="text-sm text-gray-300">Journal</div>
            </div>
          </div>
        </div>

        {/* Journal Heatmap */}
        <div className="mb-8">
          <JournalHeatmap userId={userId} isPublic={true} />
        </div>

        {/* Recent Journal Entries */}
        {profileData.journal_entries && profileData.journal_entries.length > 0 && (
          <div className="glass-card p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Journal Entries</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {profileData.journal_entries.map(entry => (
                <div key={entry.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-white text-sm">{entry.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.mood === 'happy' ? 'bg-yellow-500/20 text-yellow-300' :
                        entry.mood === 'excited' ? 'bg-orange-500/20 text-orange-300' :
                        entry.mood === 'focused' ? 'bg-blue-500/20 text-blue-300' :
                        entry.mood === 'tired' ? 'bg-gray-500/20 text-gray-300' :
                        entry.mood === 'frustrated' ? 'bg-red-500/20 text-red-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {entry.mood === 'happy' ? '😊' :
                         entry.mood === 'excited' ? '🚀' :
                         entry.mood === 'focused' ? '🎯' :
                         entry.mood === 'tired' ? '😴' :
                         entry.mood === 'frustrated' ? '😤' :
                         '😌'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Day {entry.challenge_day}
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">{entry.content}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState(null);
  const [selectedTechStack, setSelectedTechStack] = useState('all');
  const [availableTechStacks, setAvailableTechStacks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects/explore`);
        setProjects(response.data);
        
        // Extract unique tech stacks for filtering
        const allTechStacks = response.data.reduce((acc, project) => {
          if (project.tech_stack) {
            project.tech_stack.forEach(tech => {
              if (!acc.includes(tech)) {
                acc.push(tech);
              }
            });
          }
          return acc;
        }, []);
        
        // Sort tech stacks alphabetically
        setAvailableTechStacks(allTechStacks.sort());
        setFilteredProjects(response.data);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter projects based on selected tech stack
  useEffect(() => {
    if (selectedTechStack === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => 
        project.tech_stack && project.tech_stack.includes(selectedTechStack)
      ));
    }
  }, [selectedTechStack, projects]);

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
      <NavigationHeader currentPage="explore" />

      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Project Showcase</h2>
          <p className="text-gray-400">Discover what others are building in their 90-day challenge</p>
        </div>

        {/* Sticky Filter Section */}
        <div className="sticky-filter rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Project Count */}
            <div className="flex items-center space-x-4">
              <div className="text-white">
                <span className="text-2xl font-bold">{filteredProjects.length}</span>
                <span className="text-gray-300 ml-2">
                  {filteredProjects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
              {selectedTechStack !== 'all' && (
                <div className="text-sm text-gray-400">
                  filtered by <span className="text-white font-medium">{selectedTechStack}</span>
                </div>
              )}
            </div>

            {/* Tech Stack Filter */}
            <div className="flex items-center space-x-3">
              <label htmlFor="tech-filter" className="text-sm font-medium text-gray-300 whitespace-nowrap">
                Filter by Tech:
              </label>
              <select
                id="tech-filter"
                value={selectedTechStack}
                onChange={(e) => setSelectedTechStack(e.target.value)}
                className="filter-select border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 min-w-[150px]"
              >
                <option value="all">All Technologies ({projects.length})</option>
                {availableTechStacks.map(tech => {
                  const count = projects.filter(p => p.tech_stack && p.tech_stack.includes(tech)).length;
                  return (
                    <option key={tech} value={tech}>
                      {tech} ({count})
                    </option>
                  );
                })}
              </select>
              
              {selectedTechStack !== 'all' && (
                <button
                  onClick={() => setSelectedTechStack('all')}
                  className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {selectedTechStack === 'all' ? (
              <p className="text-gray-400 text-lg">No projects shared yet. Be the first to add one!</p>
            ) : (
              <div>
                <p className="text-gray-400 text-lg mb-2">
                  No projects found using <span className="text-white font-medium">{selectedTechStack}</span>
                </p>
                <button
                  onClick={() => setSelectedTechStack('all')}
                  className="text-purple-400 hover:text-purple-300 text-sm underline"
                >
                  Show all projects
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
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
                
                <div className="flex items-center justify-between mb-3">
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

                {/* Project Links */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {project.deployed_link && (
                    <a 
                      href={project.deployed_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center glass text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 text-sm px-3 py-1 rounded-lg transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="mr-1">🚀</span>
                      Live Demo
                    </a>
                  )}
                  {project.github_link && (
                    <a 
                      href={project.github_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center glass text-green-300 hover:text-green-200 hover:bg-green-500/20 text-sm px-3 py-1 rounded-lg transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="mr-1">💻</span>
                      Source Code
                    </a>
                  )}
                  {!project.deployed_link && !project.github_link && (
                    <span className="text-gray-500 text-sm italic">No links available</span>
                  )}
                </div>
                
                {expandedProject === project.id && (
                  <div className="mt-4 pt-4 border-t border-white/10">
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
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/study" element={<StudyTimerPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
