import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ setIsAuthenticated }) => {
  const [activeTab, setActiveTab] = useState('compose'); 
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('linkedin');
  const [mediaPreview, setMediaPreview] = useState(null);
  
  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isAnnual, setIsAnnual] = useState(false);
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [userProfile, setUserProfile] = useState(null);
  const prevHistoryRef = useRef([]);
  const [linkedAccounts, setLinkedAccounts] = useState({
    twitter: false,
    linkedin: false,
    instagram: false,
  });

  const [postHistory, setPostHistory] = useState([]);
  
  // Dashboard Password Reset States
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState(1);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Scheduling States
  const [scheduledFor, setScheduledFor] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const linked = params.get('linked');
    const authError = params.get('error');

    if (linked) {
      setStatus({ type: 'success', message: `Successfully linked ${linked} account.` });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('settings'); 
    }
    
    if (authError) {
      setStatus({ type: 'error', message: 'Failed to authenticate social account.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      window.history.replaceState({}, document.title, window.location.pathname);
      setActiveTab('settings');
    }

    fetchUserData();
    fetchPosts();
    const pollInterval = setInterval(() => {
      fetchPosts(); 
    }, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const getAuthConfig = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchUserData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts/me`, getAuthConfig());
      if (res.data.success) {
        setLinkedAccounts(res.data.data.linkedAccounts || { twitter: false, linkedin: false, instagram: false });
        setUserProfile(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

 const fetchPosts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/posts`, getAuthConfig());
      if (res.data.success) {
        const newHistory = res.data.data;
        
        // Check if any post transitioned from 'scheduled' to 'published' or 'failed'
        if (prevHistoryRef.current.length > 0) {
          newHistory.forEach(newPost => {
            const oldPost = prevHistoryRef.current.find(p => p._id === newPost._id);
            if (oldPost && oldPost.status === 'scheduled') {
              if (newPost.status === 'published') {
                setStatus({ type: 'success', message: `✅ Your scheduled ${newPost.platform} post just went live!` });
                setTimeout(() => setStatus({ type: '', message: '' }), 5000);
              } else if (newPost.status === 'failed') {
                setStatus({ type: 'error', message: `❌ Scheduled ${newPost.platform} post failed to publish.` });
                setTimeout(() => setStatus({ type: '', message: '' }), 5000);
              }
            }
          });
        }
        
        prevHistoryRef.current = newHistory;
        setPostHistory(newHistory);
      }
    } catch (err) {
      console.error('Failed to fetch history');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  const handleMediaUpload = (e) => {
    if (platform === 'twitter') {
      setStatus({ type: 'error', message: 'Twitter media uploads are temporarily paused due to upstream API limits.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      return;
    }
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
    setPlatform('linkedin');
    clearMedia();
    setIsEditing(false);
    setEditId(null);
    setShowAI(false);
    setAiPrompt('');
    setScheduledFor('');
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
    
    if (!content.trim() && !mediaPreview) {
      return setStatus({ type: 'error', message: 'You must add either some text or an image to publish.' });
    }
    
    // Prevent scheduling in the past
    if (scheduledFor && new Date(scheduledFor) <= new Date()) {
      return setStatus({ type: 'error', message: 'Scheduled time must be in the future.' });
    }

    setIsLoading(true);
    try {
      const payload = { 
        platform, 
        content: content.trim(), 
        media: mediaPreview,
        scheduledFor: scheduledFor || null 
      };
      
      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL}/posts/${editId}`, payload, getAuthConfig());
        setStatus({ type: 'success', message: 'Post updated successfully.' });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/posts`, payload, getAuthConfig());
        setStatus({ type: 'success', message: scheduledFor ? 'Post scheduled successfully!' : 'Post published successfully.' });
      }
      fetchPosts();
      resetComposer();
      setActiveTab('history');
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || `Post ${isEditing ? 'update' : 'creation'} failed.` });
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
        await fetchUserData(); 
      }
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'AI Generation failed. Check your plan quota.' });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const handleConnectionClick = async (plat) => {
    if (plat === 'instagram') {
      setStatus({ type: 'error', message: 'Instagram publishing integration is coming soon.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      return;
    }

    if (plat === 'twitter' && userPlan === 'free') {
      setStatus({ type: 'error', message: 'Twitter integration requires a Creator or Pro plan. Please upgrade.' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      setActiveTab('billing');
      return;
    }

    if (linkedAccounts[plat]) {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/posts/connections/disconnect`, { platform: plat }, getAuthConfig());
        if (res.data.success) setLinkedAccounts(res.data.data);
      } catch (error) {
        setStatus({ type: 'error', message: 'Failed to disconnect account.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
      }
    } else {
      const token = localStorage.getItem('token');
      window.location.href = `${import.meta.env.VITE_API_URL}/posts/connections/${plat}/link?token=${token}`;
    }
  };

  // Dashboard Password Change Handlers
  const handleRequestPasswordChange = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/forgot-password`, { email: userProfile.email });
      setStatus({ type: 'success', message: 'OTP sent to your email.' });
      setPasswordStep(2);
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Failed to send OTP.' });
      setIsChangingPassword(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset-password`, {
        email: userProfile.email,
        otp: resetOtp,
        newPassword
      });
      setStatus({ type: 'success', message: 'Password updated successfully!' });
      
      // Reset the password UI state completely
      setPasswordStep(1);
      setIsChangingPassword(false);
      setResetOtp('');
      setNewPassword('');
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.message || 'Invalid OTP or failed to update.' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }
  };

  const userPlan = userProfile?.subscription?.plan || 'free';

  const getLinkedinLimitText = () => {
    if (userPlan === 'Agentic Pro') return '/ 10,000 posts';
    if (userPlan === 'creator') return '/ 700 posts';
    return '/ 28 posts';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-sans flex selection:bg-zinc-800 selection:text-white">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800/60 bg-[#0A0A0A] flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800/60 gap-3">
          <img src="/postifye.svg" alt="Postifye Logo" className="h-6 w-auto" />
          <h1 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">POSTIFYE</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setActiveTab('compose')}
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
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'billing' ? 'bg-indigo-900/30 text-indigo-400 font-medium border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Billing & Plans
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all ${activeTab === 'settings' ? 'bg-zinc-800/50 text-zinc-100 font-medium border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Account Settings
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <header className="md:hidden h-16 border-b border-zinc-800/60 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <img src="/postifye.svg" alt="Postifye Logo" className="h-6 w-auto" />
            <h1 className="text-sm font-bold text-zinc-100 tracking-wide uppercase">POSTIFYE</h1>
          </div>
          <button onClick={() => setActiveTab('settings')} className="text-xs text-zinc-500 hover:text-zinc-300">Settings</button>
        </header>

        <div className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {status.message && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium border backdrop-blur-sm ${status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
              {status.message}
            </div>
          )}

          {/* TAB 1: Composer */}
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
                    onChange={(e) => {
                      setPlatform(e.target.value);
                      if (e.target.value === 'twitter') clearMedia();
                    }}
                    className="bg-[#111] text-zinc-300 border border-zinc-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="linkedin">LinkedIn (Free: 28/mo)</option>
                    <option value="twitter" disabled={userPlan === 'free'}>
                      Twitter / X {userPlan === 'free' ? '🔒 (Pro Only)' : '(Media Paused)'}
                    </option>
                    <option value="instagram" disabled>Instagram ✦ (Coming Soon)</option>
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

                  {/* Cleaned Up Composer Toolbar */}
                  <div className="px-4 py-3 border-t border-zinc-800/80 bg-[#0A0A0A]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Left Side: Tools */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleMediaUpload} className="hidden" />
                      <button 
                        onClick={() => {
                          if (platform === 'twitter') {
                            setStatus({ type: 'error', message: 'Twitter media uploads are temporarily paused.' });
                            setTimeout(() => setStatus({ type: '', message: '' }), 4000);
                          } else {
                            fileInputRef.current?.click();
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${platform === 'twitter' ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'}`}
                        title={platform === 'twitter' ? "Media currently paused for Twitter" : "Attach Media"}
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

                      <span className="text-xs font-mono text-indigo-400/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded-md ml-1 whitespace-nowrap">
                        ✨ {userProfile?.subscription?.aiCreditsRemaining ?? 10} left
                      </span>

                      {(content || mediaPreview) && (
                        <button 
                          onClick={resetComposer}
                          className="text-xs font-medium text-zinc-500 hover:text-red-400 px-2 py-1 transition-colors ml-1"
                          title="Clear Composer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Right Side: Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                      <span className="text-xs font-mono text-zinc-600 mr-1">
                        <span className={content.length > 2000 ? 'text-red-400' : 'text-zinc-400'}>{content.length}</span> / 2200
                      </span>

                      {isEditing && (
                        <button onClick={resetComposer} className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">
                          Cancel
                        </button>
                      )}

                      {/* Dynamic Schedule Indicator / Button */}
                      {scheduledFor ? (
                        <div className="flex items-center bg-indigo-500/10 border border-indigo-500/20 rounded-lg pl-3 pr-1 py-1.5 gap-2">
                          <span className="text-xs text-indigo-400 font-medium whitespace-nowrap">
                            {new Date(scheduledFor).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}
                          </span>
                          <button onClick={() => setScheduledFor('')} className="p-1 hover:bg-indigo-500/20 rounded-md text-indigo-400 transition-colors" title="Remove Schedule">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowScheduleModal(true)}
                          className="text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="hidden sm:inline">Schedule</span>
                        </button>
                      )}

                      <button 
                        onClick={handlePublish}
                        disabled={isLoading}
                        className={`font-semibold text-sm px-6 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 ${isEditing ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : scheduledFor ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-zinc-100 hover:bg-white text-zinc-950'}`}
                      >
                        {isLoading ? 'Processing...' : isEditing ? 'Update Post' : scheduledFor ? 'Queue Post' : 'Publish'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Scheduling Modal */}
                  {showScheduleModal && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-[#111] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-[#151515]">
                          <h3 className="font-semibold text-zinc-100">Schedule Post</h3>
                          <button onClick={() => setShowScheduleModal(false)} className="text-zinc-500 hover:text-zinc-300">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        <div className="p-6">
                          <label className="block text-sm text-zinc-400 mb-2">Select Date & Time</label>
                          <input 
                            type="datetime-local" 
                            value={scheduledFor}
                            onChange={(e) => setScheduledFor(e.target.value)}
                            className="w-full bg-[#0A0A0A] text-zinc-200 border border-zinc-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors [color-scheme:dark]"
                          />
                          <p className="text-xs text-zinc-500 mt-3">
                            Your post will automatically deploy at this time.
                          </p>
                        </div>
                        <div className="p-4 border-t border-zinc-800 flex gap-3 justify-end bg-[#151515]">
                          <button onClick={() => setShowScheduleModal(false)} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
                            Cancel
                          </button>
                          <button 
                            onClick={() => setShowScheduleModal(false)}
                            disabled={!scheduledFor}
                            className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Set Time
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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

          {/* TAB 2: Post History */}
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              {new Date(post.createdAt).toLocaleDateString()}
                              {post.status === 'scheduled' && <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">Scheduled</span>}
                            </td>
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

          {/* TAB 3: Billing & Plans */}
          {activeTab === 'billing' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="mb-10 text-center">
                <h2 className="text-2xl font-bold text-zinc-100 mb-2">Upgrade your workflow.</h2>
                <p className="text-zinc-400 mb-8">Choose the plan that fits your posting volume.</p>
                
                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4">
                  <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
                  <button 
                    onClick={() => setIsAnnual(!isAnnual)}
                    className="w-14 h-7 bg-[#151515] border border-zinc-700 rounded-full p-1 relative transition-colors focus:outline-none flex items-center"
                  >
                    <div className={`w-5 h-5 bg-indigo-500 rounded-full shadow-md transition-transform duration-300 ease-in-out ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
                  </button>
                  <span className={`text-sm font-semibold flex items-center gap-2 transition-colors ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
                    Annually
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Save ~15%</span>
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {/* Hobby Plan */}
                <div className="bg-[#111] border border-zinc-800/80 rounded-2xl p-6 flex flex-col relative">
                  {userPlan === 'free' && <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-zinc-700 text-xs font-bold px-3 py-1 rounded-full text-zinc-200 shadow-lg">CURRENT PLAN</div>}
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Hobby</h3>
                  <div className="mb-6 flex flex-col">
                    <span className="text-3xl font-bold text-white">Free</span>
                    <span className="text-xs text-zinc-500 mt-1 opacity-0">Spacer</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-400 flex-1">
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 28 LinkedIn Posts / mo</li>
                    <li className="flex items-center gap-2 text-zinc-600"><svg className="w-4 h-4 text-zinc-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> 0 Twitter Posts</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 10 AI Credits / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> LinkedIn Image Uploads</li>
                  </ul>
                  <button disabled className="w-full py-2.5 rounded-lg font-semibold text-sm bg-zinc-800 text-zinc-500 cursor-not-allowed">
                    {userPlan === 'free' ? 'Active' : 'Downgrade'}
                  </button>
                </div>

                {/* Creator Plan */}
                <div className="bg-gradient-to-b from-[#151515] to-[#0A0A0A] border border-indigo-500/50 rounded-2xl p-6 flex flex-col relative shadow-xl shadow-indigo-900/10 scale-105 z-10">
                  <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-indigo-500 text-xs font-bold px-3 py-1 rounded-full text-white shadow-lg">MOST POPULAR</div>
                  <h3 className="text-lg font-semibold text-indigo-400 mb-2">Creator</h3>
                  <div className="mb-6 flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{isAnnual ? '₹649' : '₹749'}</span>
                      <span className="text-sm text-zinc-500 line-through">₹1,299</span>
                      <span className="text-sm text-zinc-500">/mo</span>
                    </div>
                    <span className="text-xs text-zinc-500 mt-1">{isAnnual ? 'Billed ₹7,788 yearly' : 'Billed monthly'}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-300 flex-1">
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Up to 700 LinkedIn Posts / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Unlock Twitter / X Publishing</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 150 Twitter Posts / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 1,000 AI Credits / mo</li>
                  </ul>
                  <button className="w-full py-2.5 rounded-lg font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20">
                    Upgrade to Creator
                  </button>
                </div>

                {/* Agentic Pro Plan */}
                <div className="bg-[#111] border border-zinc-800/80 rounded-2xl p-6 flex flex-col relative">
                  <h3 className="text-lg font-semibold text-zinc-200 mb-2">Agentic Pro</h3>
                  <div className="mb-6 flex flex-col">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{isAnnual ? '₹2,999' : '₹3,499'}</span>
                      <span className="text-sm text-zinc-500 line-through">₹4,999</span>
                      <span className="text-sm text-zinc-500">/mo</span>
                    </div>
                    <span className="text-xs text-zinc-500 mt-1">{isAnnual ? 'Billed ₹35,988 yearly' : 'Billed monthly'}</span>
                  </div>
                  <ul className="space-y-3 mb-8 text-sm text-zinc-400 flex-1">
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Up to 10,000 LinkedIn Posts / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 1,000 Twitter Posts / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> 30,000 AI Credits / mo</li>
                    <li className="flex items-center gap-2"><svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Unlimited Connected Profiles</li>
                  </ul>
                  <button className="w-full py-2.5 rounded-lg font-semibold text-sm bg-zinc-200 hover:bg-white text-zinc-900 transition-colors">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Account Settings */}
          {activeTab === 'settings' && (
            <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Account Settings</h2>
                <p className="text-sm text-zinc-500 mt-1">Manage your active subscription, connected networks, and credentials.</p>
              </div>

            {/* Subscription & Usage Overview */}
            <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg p-6">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">Subscription & Quota</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Your monthly posting and AI credit allowances.</p>
                </div>
                <span className="text-xs uppercase font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {userPlan} PLAN
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#151515] border border-zinc-800 p-4 rounded-lg">
                  <span className="text-xs text-zinc-500">AI Generation Credits</span>
                  <p className="text-lg font-bold text-zinc-200 mt-1">
                    {userProfile?.subscription?.aiCreditsRemaining ?? 10} <span className="text-xs font-normal text-zinc-500">credits left</span>
                  </p>
                </div>
                <div className="bg-[#151515] border border-zinc-800 p-4 rounded-lg">
                  <span className="text-xs text-zinc-500">LinkedIn Usage This Cycle</span>
                  <p className="text-lg font-bold text-zinc-200 mt-1">
                    {userProfile?.subscription?.linkedinPostsThisMonth ?? 0} <span className="text-xs font-normal text-zinc-500">{getLinkedinLimitText()}</span>
                  </p>
                </div>
              </div>
            </div>
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

              {/* Security / Password Section */}
              <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg p-6">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">Security</h3>
                
                {!isChangingPassword ? (
                  <button 
                    onClick={() => { setIsChangingPassword(true); handleRequestPasswordChange(); }}
                    className="bg-[#151515] hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors flex items-center justify-between w-full md:w-auto"
                  >
                    Change Password (via Email OTP)
                  </button>
                ) : (
                  <form onSubmit={handleConfirmPasswordChange} className="space-y-4 animate-in fade-in bg-[#0A0A0A] p-4 rounded-lg border border-zinc-800">
                    {passwordStep === 1 ? (
                      <p className="text-sm text-zinc-400 flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                        Sending OTP to your email...
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-zinc-400 mb-2">We sent a verification code to <strong>{userProfile?.email}</strong>.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">6-Digit OTP</label>
                            <input 
                              type="text" 
                              value={resetOtp}
                              onChange={(e) => setResetOtp(e.target.value)}
                              maxLength={6}
                              placeholder="123456"
                              required
                              className="w-full bg-[#151515] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 tracking-widest font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">New Password</label>
                            <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              className="w-full bg-[#151515] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-300 text-sm focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2">
                          <button 
                            type="submit"
                            disabled={isLoading || resetOtp.length !== 6 || !newPassword}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isLoading ? 'Updating...' : 'Update Password'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => { setIsChangingPassword(false); setPasswordStep(1); }}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </form>
                )}
              </div>

              {/* Linked Social Accounts */}
              <div className="bg-[#111] border border-zinc-800/80 rounded-xl overflow-hidden shadow-lg p-6">
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-2">Connected Networks</h3>
                <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                  Authenticate your target platforms using secure OAuth 2.0 PKCE handshakes.
                </p>
                <div className="space-y-3">
                  
                  {/* LinkedIn Connection Card */}
                  <div className="flex items-center justify-between bg-[#151515] border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${linkedAccounts.linkedin ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                      <div>
                        <span className="text-sm font-medium text-zinc-200">LinkedIn</span>
                        <p className="text-[11px] text-zinc-500">Live feed posting & image uploads enabled</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConnectionClick('linkedin')}
                      className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${linkedAccounts.linkedin ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-[#0077b5] hover:bg-[#006396] text-white shadow-[0_0_10px_rgba(0,119,181,0.3)]'}`}
                    >
                      {linkedAccounts.linkedin ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>

                  {/* Twitter / X Connection Card */}
                  <div className="flex items-center justify-between bg-[#151515] border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${linkedAccounts.twitter ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                      <div>
                        <span className="text-sm font-medium text-zinc-200">Twitter / X</span>
                        <p className="text-[11px] text-zinc-500">
                          {userPlan === 'free' ? 'Requires Creator or Pro subscription' : 'API v2 text posting enabled'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleConnectionClick('twitter')}
                      className={`text-xs font-semibold px-4 py-2 rounded-md transition-all ${
                        linkedAccounts.twitter 
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' 
                          : userPlan === 'free'
                          ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {linkedAccounts.twitter ? 'Disconnect' : userPlan === 'free' ? 'Unlock Plan' : 'Connect'}
                    </button>
                  </div>

                  {/* Instagram Connection Card */}
                  <div className="flex items-center justify-between bg-[#151515] border border-zinc-800 rounded-lg p-4 opacity-60">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                      <div>
                        <span className="text-sm font-medium text-zinc-200">Instagram</span>
                        <p className="text-[11px] text-zinc-500">Meta Graph API integration in active development</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-3 py-1 bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                      COMING SOON
                    </span>
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
          )}

        </div>
      </main>
    </div>
  );
};

export default Dashboard;