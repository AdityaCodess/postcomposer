import { useState } from 'react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { PLATFORM_LIMITS } from '../../utils/constants';

// Dynamic SVG Progress Ring Helper
const ProgressRing = ({ radius, stroke, progress, isOverLimit }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  // Color pulses red if over limit, yellow if close (80%+), else a sleek cyan
  const color = isOverLimit 
    ? 'text-red-500' 
    : progress >= 80 
      ? 'text-amber-400' 
      : 'text-cyan-400';

  return (
    <div className="relative flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          className="text-slate-700"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          className={`${color} transition-all duration-300 ease-in-out`}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
    </div>
  );
};

const PostEditor = () => {
  const [platform, setPlatform] = useState('twitter');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentLimit = PLATFORM_LIMITS[platform];
  const charCount = content.length;
  const isOverLimit = charCount > currentLimit;
  
  // Calculate percentage for the progress ring (capped at 100% for the visual)
  const progressPercentage = Math.min((charCount / currentLimit) * 100, 100);

  const handlePlatformChange = (e) => {
    setPlatform(e.target.value);
    setStatus({ type: '', message: '' }); 
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setStatus({ type: '', message: '' }); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOverLimit || charCount === 0) return;

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    const sanitizedContent = DOMPurify.sanitize(content);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/posts`, {
        platform,
        content: sanitizedContent
      }, config);

      if (response.data.success) {
        setStatus({ type: 'success', message: 'Post deployed successfully!' });
        setContent(''); 
      }
    } catch (error) {
      console.error('Submission error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to deploy post.';
      setStatus({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPreviewStyles = () => {
    switch (platform) {
      case 'twitter': return { bg: 'bg-black', text: 'text-white', border: 'border-slate-800' };
      case 'linkedin': return { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200' };
      case 'facebook': return { bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-300' };
      case 'instagram': return { bg: 'bg-zinc-900', text: 'text-zinc-100', border: 'border-zinc-800' };
      default: return { bg: 'bg-slate-800', text: 'text-slate-100', border: 'border-slate-700' };
    }
  };

  const previewTheme = getPreviewStyles();

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-8 mt-6">
      
      {status.message && (
        <div className={`mb-6 p-4 rounded-md border shadow-lg font-mono ${
          status.type === 'success' 
            ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' 
            : 'bg-red-900/50 border-red-500 text-red-300'
        }`}>
          {/* FIXED PARSE ERROR HERE */}
          {'>'} {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Console // Compose</h2>
            
            <select 
              value={platform} 
              onChange={handlePlatformChange}
              className="bg-slate-800 text-slate-200 border border-slate-700 p-2 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all cursor-pointer font-medium uppercase text-sm tracking-wider"
            >
              <option value="twitter">X / Twitter</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
            <div className="relative flex-grow mb-6">
              <textarea
                value={content}
                onChange={handleContentChange}
                placeholder="Initialize broadcast sequence..."
                className={`w-full h-64 p-5 bg-slate-950 text-slate-200 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed ${
                  isOverLimit 
                    ? 'border-red-500/50 focus:ring-red-500/50 text-red-100' 
                    : 'border-slate-800 focus:ring-cyan-500/50'
                }`}
              />
            </div>

            <div className="flex justify-between items-center mt-auto">
              <div className="flex items-center gap-4">
                <ProgressRing radius={20} stroke={3} progress={progressPercentage} isOverLimit={isOverLimit} />
                <span className={`font-mono text-sm font-semibold tracking-wide ${isOverLimit ? 'text-red-500' : 'text-slate-400'}`}>
                  {charCount} <span className="text-slate-600">/</span> {currentLimit}
                </span>
              </div>

              <button
                type="submit"
                disabled={isOverLimit || charCount === 0 || isSubmitting}
                className="bg-cyan-600 text-slate-50 font-bold py-3 px-8 rounded-lg disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center uppercase tracking-widest text-sm"
              >
                {isSubmitting ? 'Transmitting...' : 'Deploy'}
              </button>
            </div>
          </form>
        </div>

        <div className="flex flex-col h-full">
          <h2 className="text-xl font-bold text-slate-300 tracking-tight mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Live Output Render
          </h2>
          
          <div className={`flex-grow rounded-xl border ${previewTheme.border} ${previewTheme.bg} overflow-hidden shadow-2xl transition-colors duration-500 flex flex-col`}>
            
            <div className="p-4 border-b border-opacity-20 border-inherit flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-500/30 overflow-hidden flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400/50" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className={`h-3 w-24 rounded bg-slate-500/20 mb-2`}></div>
                <div className={`h-2 w-16 rounded bg-slate-500/20`}></div>
              </div>
            </div>

            <div className={`p-5 flex-grow ${previewTheme.text} whitespace-pre-wrap break-words font-sans text-[15px] leading-relaxed`}>
              {content ? content : (
                <span className="opacity-40 italic">Input data will be rendered here in real-time...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PostEditor;