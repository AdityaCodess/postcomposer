import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose', 'history', 'settings'
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [mediaPreview, setMediaPreview] = useState(null);
  
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [userProfile, setUserProfile] = useState(null);
  const [linkedAccounts, setLinkedAccounts] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
  });

  const [postHistory, setPostHistory] = useState([]);

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
        setUserProfile(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, getAuthConfig());
      if (res.data.success) setPostHistory(res.data.data);
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result); 
      reader.readAsDataURL(file);
    }
  };

  const clearMedia = () => {
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetComposer = () => {
    setContent('');
    setPlatform('twitter');
    clearMedia();
    setIsEditing(false);
    setEditId(null);
    setShowAI(false);
    setAiPrompt('');
  };

  const initiateEdit = (post) => {
    setContent(post.content || '');
    setPlatform(post.platform);
    setMediaPreview(post.media || null);
    setIsEditing(true);
    setEditId(post._id);
    setActiveTab('compose');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/${id}`, getAuthConfig());
      setStatus({ type: 'success', message: 'Post deleted successfully.' });
      fetchPosts(); 
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to delete post.' });
    } finally {
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently delete your account and wipe all your deployment history from the database. This action cannot be undone. Proceed?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/posts/me`, getAuthConfig());
      handleLogout();
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to delete account.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!linkedAccounts[platform]) return setStatus({ type: 'error', message: `Connect ${platform} before publishing.` });
    if (!content && !mediaPreview) return setStatus({ type: 'error', message: 'Post requires content or media.' });
    
    setIsLoading(true);
    try {
      const payload = { platform, content, media: mediaPreview };
      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/posts/${editId}`, payload, getAuthConfig());
        setStatus({ type: 'success', message: 'Post updated successfully.' });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/posts`, payload, getAuthConfig());
        setStatus({ type: 'success', message: 'Post published successfully.' });
      }
      fetchPosts();
      resetComposer();
      setActiveTab('history');
    } catch (error) {
      setStatus({ type: 'error', message: `Post ${isEditing ? 'update' : 'creation'} failed.` });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt) return setStatus({ type: 'error', message: 'Please enter a topic for the AI.' });
    
    setIsGenerating(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/posts/generate`, { platform, topic: aiPrompt }, getAuthConfig());
      if (res.data.success) {
        setContent(res.data.data);
        setShowAI(false);
        setAiPrompt('');
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'AI Generation failed. Check your API key.' });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const toggleConnection = async (plat) => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/posts/connections`, { platform: plat }, getAuthConfig());
      if (res.data.success) setLinkedAccounts(res.data.data);
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to update connection.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans flex selection:bg-zinc-800 selection:text-white">
      
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
            onClick={() => { setActiveTab('compose'); resetComposer(); }}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'compose' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Composer {isEditing && <span className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>}
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'history' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Post History
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'settings' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Account Settings
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
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden h-16 border-b border-zinc-800/60 flex items-center justify-between px-6">
          <h1 className="text-sm font-bold text-zinc-100 tracking-wide">POST_COMPOSER</h1>
          <button onClick={() => setActiveTab('settings')} className="text-xs text-zinc-500 hover:text-zinc-300">Settings</button>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {status.message && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium border backdrop-blur-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {status.message}
            </div>
          )}

          {activeTab === 'compose' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-12rem)] animate-in fade-in duration-300">
              <section className="lg:col-span-7 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-zinc-100">{isEditing ? 'Edit Post' : 'Create Post'}</h2>
                    {isEditing && (
                      <span className="text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">EDIT MODE</span>
                    )}
                  </div>
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

                <div className="flex-1 bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-black/50 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600 transition-all">
                  
                  {showAI && (
                    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-b border-indigo-500/20 p-4 animate-in slide-in-from-top-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder={`What should we write about for ${platform}?`}
                          className="flex-1 bg-[#0A0A0A]/50 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60"
                        />
                        <button 
                          onClick={handleAIGenerate}
                          disabled={isGenerating || !aiPrompt}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                        >
                          {isGenerating ? <span className="animate-pulse">Generating...</span> : <>✨ Generate</>}
                        </button>
                      </div>
                    </div>
                  )}

                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What do you want to share?"
                    className="flex-1 w-full bg-transparent text-zinc-200 placeholder-zinc-600 resize-none focus:outline-none p-6 text-base leading-relaxed"
                    maxLength={2200}
                  />
                  
                  {mediaPreview && (
                    <div className="px-6 pb-4">
                      <div className="relative inline-block border border-zinc-800 rounded-lg overflow-hidden group shadow-lg">
                        <img src={mediaPreview} alt="Upload preview" className="h-32 w-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        <button 
                          onClick={clearMedia}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1.5 backdrop-blur-md transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-4 py-3 border-t border-zinc-800/80 bg-[#0A0A0A]/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-zinc-500 hover:text-zinc-200 p-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm"
                        title="Attach Media"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </button>

                      <button 
                        onClick={() => setShowAI(!showAI)}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${showAI ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800'}`}
                        title="Auto-Generate with AI"
                      >
                        ✨ <span className="hidden sm:inline font-medium">Auto-Generate</span>
                      </button>
                      
                      <span className="text-xs font-mono text-zinc-600 ml-2">
                        <span className={content.length > 2000 ? 'text-red-400' : 'text-zinc-400'}>{content.length}</span> / 2200
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {isEditing && (
                        <button onClick={resetComposer} className="text-zinc-500 hover:text-zinc-300 text-sm font-medium px-4 py-2 transition-colors">
                          Cancel
                        </button>
                      )}
                      <button 
                        onClick={handlePublish}
                        disabled={isLoading}
                        className={`font-semibold text-sm px-6 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 ${isEditing ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-zinc-100 hover:bg-white text-zinc-950'}`}
                      >
                        {isLoading ? 'Publishing...' : isEditing ? 'Update Post' : 'Publish'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="lg:col-span-5 flex flex-col gap-4">
                <h2 className="text-lg font-semibold text-zinc-100">Live Preview</h2>
                <div className="flex-1 bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg shadow-black/50 p-6 flex flex-col relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
                  <div className="relative z-10 w-full max-w-sm mx-auto bg-[#0A0A0A] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden mt-4 transition-all">
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
                        {content || "Your post preview will appear here..."}
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
          )}

          {activeTab === 'history' && (
            <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-zinc-100">Post History</h2>
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
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {postHistory.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-600">No posts found.</td></tr>
                      ) : (
                        postHistory.map((post) => (
                          <tr key={post._id} className="hover:bg-zinc-900/40 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td className="px-6 py-4 capitalize font-medium text-zinc-300">{post.platform}</td>
                            <td className="px-6 py-4 max-w-xs truncate text-zinc-400">{post.content || <span className="italic text-zinc-600">Media only</span>}</td>
                            <td className="px-6 py-4">
                              {post.media ? <img src={post.media} alt="Thumb" className="h-8 w-8 object-cover rounded border border-zinc-700" /> : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => initiateEdit(post)} className="text-zinc-500 hover:text-indigo-400 transition-colors" title="Edit Post">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(post._id)} className="text-zinc-500 hover:text-red-400 transition-colors" title="Delete Post">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
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

          {activeTab === 'settings' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-zinc-100">Account Settings</h2>
                <p className="text-sm text-zinc-500 mt-1">Manage your profile, linked accounts, and session data.</p>
              </div>

              <div className="space-y-6">
                {/* Profile Information */}
                <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg p-6">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Username</label>
                      <div className="bg-[#151515] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm">
                        {userProfile?.username || 'Loading...'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-500 mb-1">Email Address</label>
                      <div className="bg-[#151515] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm">
                        {userProfile?.email || 'Loading...'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Actions */}
                <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg p-6">
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Session</h3>
                  <button 
                    onClick={handleLogout} 
                    className="w-full bg-[#151515] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors text-left flex items-center justify-between"
                  >
                    Log Out of Current Session
                    <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-950/10 border border-red-900/30 rounded-xl overflow-hidden shadow-lg p-6">
                  <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2">Danger Zone</h3>
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                    Permanently remove your account and all associated post data. This action is irreversible. 
                  </p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-semibold text-sm px-6 py-2.5 rounded-lg transition-all w-full md:w-auto"
                  >
                    Delete Account
                  </button>
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