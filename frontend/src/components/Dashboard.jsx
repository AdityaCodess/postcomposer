import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('compose'); 
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  const [linkedAccounts, setLinkedAccounts] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
  });

  const [postHistory, setPostHistory] = useState([]);

  // Fetch initial data on load
  useEffect(() => {
    fetchUserData();
    fetchPosts();
  }, []);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/me`, getAuthConfig());
      if (res.data.success) {
        setLinkedAccounts(res.data.data.linkedAccounts);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, getAuthConfig());
      if (res.data.success) {
        setPostHistory(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  // Convert uploaded image to Base64
  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeploy = async (e) => {
    e.preventDefault();
    if (!linkedAccounts[platform]) {
      return setStatus({ type: 'error', message: `Connect ${platform} before deploying.` });
    }
    if (!content && !mediaPreview) {
      return setStatus({ type: 'error', message: 'Post requires content or media.' });
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        platform,
        content,
        media: mediaPreview
      }, getAuthConfig());

      setStatus({ type: 'success', message: 'Deployment successful.' });
      
      // Refresh history and reset form
      fetchPosts();
      setContent('');
      clearMedia();
      setActiveTab('history');
    } catch (error) {
      setStatus({ type: 'error', message: 'Deployment failed.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const toggleConnection = async (plat) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/posts/connections`, { platform: plat }, getAuthConfig());
      if (res.data.success) {
        setLinkedAccounts(res.data.data);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to update connection.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans flex selection:bg-zinc-800 selection:text-white">
      
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-zinc-800/60 bg-[#0A0A0A] flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/60">
          <div className="w-6 h-6 bg-zinc-100 rounded-md flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <svg className="w-4 h-4 text-zinc-950" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-sm font-bold text-zinc-100 tracking-wide">POST_COMPOSER</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('compose')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'compose' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Composer
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'history' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Deployment History
          </button>
        </nav>

        <div className="p-4 border-t border-zinc-800/60">
          <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-4 px-2">Connections</p>
          <div className="space-y-2">
            {Object.keys(linkedAccounts).map((plat) => (
              <button 
                key={plat}
                onClick={() => toggleConnection(plat)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-zinc-900/50 transition-colors group"
              >
                <span className="capitalize text-sm text-zinc-400 group-hover:text-zinc-300">{plat}</span>
                <div className={`w-2 h-2 rounded-full ${linkedAccounts[plat] ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-800/60">
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden h-16 border-b border-zinc-800/60 flex items-center justify-between px-6">
          <h1 className="text-sm font-bold text-zinc-100 tracking-wide">POST_COMPOSER</h1>
          <button onClick={handleLogout} className="text-xs text-zinc-500 hover:text-red-400">Logout</button>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {status.message && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium border backdrop-blur-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {status.message}
            </div>
          )}

          {activeTab === 'compose' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)]">
              <section className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-zinc-100">Draft Sequence</h2>
                  <select 
                    value={platform} 
                    onChange={(e) => setPlatform(e.target.value)}
                    className="bg-[#111] text-zinc-300 border border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 capitalize cursor-pointer"
                  >
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div className="flex-1 bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/50 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Initialize broadcast payload..."
                    className="flex-1 w-full bg-transparent text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none p-6 text-base leading-relaxed"
                    maxLength={2200}
                  />
                  
                  {mediaPreview && (
                    <div className="px-6 pb-4">
                      <div className="relative inline-block border border-zinc-800 rounded-lg overflow-hidden group">
                        <img src={mediaPreview} alt="Upload preview" className="h-32 w-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        <button 
                          onClick={clearMedia}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1.5 backdrop-blur-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 border-t border-zinc-800/80 bg-[#0A0A0A]/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-zinc-500 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Attach</span>
                      </button>
                      
                      <span className="text-xs font-mono text-zinc-600">
                        <span className={content.length > 2000 ? 'text-red-400' : 'text-zinc-400'}>{content.length}</span> / 2200
                      </span>
                    </div>

                    <button 
                      onClick={handleDeploy}
                      disabled={isLoading}
                      className="bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-sm px-6 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50"
                    >
                      {isLoading ? 'Deploying...' : 'Deploy'}
                    </button>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-5 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-zinc-100">Live Render</h2>
                <div className="flex-1 bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg shadow-black/50 p-6 flex flex-col relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                  <div className="relative z-10 w-full max-w-sm mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden mt-4">
                    <div className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 p-[1px]">
                        <div className="w-full h-full bg-[#111] rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </div>
                      </div>
                      <div>
                        <div className="h-3 w-24 bg-zinc-700/50 rounded mb-1.5"></div>
                        <div className="h-2 w-16 bg-zinc-800/50 rounded"></div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${content ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                        {content || "Payload render preview..."}
                      </p>
                    </div>
                    {mediaPreview && (
                      <div className="border-t border-zinc-800">
                        <img src={mediaPreview} alt="Live preview" className="w-full h-auto object-cover max-h-60" />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">Deployment History</h2>
              </div>
              <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg shadow-black/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-[#151515] text-zinc-500 border-b border-zinc-800">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Platform</th>
                        <th className="px-6 py-4 font-medium">Content Snippet</th>
                        <th className="px-6 py-4 font-medium">Media</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {postHistory.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-600">No deployments found.</td></tr>
                      ) : (
                        postHistory.map((post) => (
                          <tr key={post._id} className="hover:bg-zinc-900/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 capitalize font-medium text-zinc-300">{post.platform}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-zinc-400">{post.content || <span className="italic text-zinc-600">Media only</span>}</td>
                            <td className="px-6 py-4">
                              {post.media ? (
                                <img src={post.media} alt="Thumb" className="h-8 w-8 object-cover rounded border border-zinc-700" />
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                post.status === 'published' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${post.status === 'published' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                {post.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;