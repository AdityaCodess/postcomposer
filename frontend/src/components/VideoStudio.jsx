import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const VideoStudio = ({ file, onCancel, onComplete }) => {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [statusText, setStatusText] = useState('Booting Engine...');
  
  // Editor States
  const [duration, setDuration] = useState(0);
  const [trimRange, setTrimRange] = useState([0, 100]);
  const [aspectRatio, setAspectRatio] = useState('original');
  const [videoFilter, setVideoFilter] = useState('none');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  useEffect(() => {
    if (file) setVideoSrc(URL.createObjectURL(file));
    loadFFmpeg();
  }, [file]);

  const loadFFmpeg = async () => {
    setIsLoading(true);
    const ffmpeg = ffmpegRef.current;
    
    ffmpeg.on('log', ({ message }) => console.log('FFmpeg:', message));

    try {
      // Switch from UMD to ESM so Vite's modern import() can read it
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      setLoaded(true);
      setStatusText('Engine Ready');
    } catch (error) {
      console.error("FFmpeg load failed:", error);
      setStatusText('Engine failed to load. Check console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && duration === 0) {
      const vidDuration = videoRef.current.duration;
      setDuration(vidDuration);
      setTrimRange([0, vidDuration]);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const processVideo = async () => {
    if (!loaded) return;
    setIsProcessing(true);
    setStatusText('Rendering frames... this may take a moment.');
    
    try {
      const ffmpeg = ffmpegRef.current;
      const startTime = trimRange[0].toString();
      const trimDuration = (trimRange[1] - trimRange[0]).toString();
      
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      
      const cmd = ['-i', 'input.mp4', '-ss', startTime, '-t', trimDuration];
      let vfFilters = [];

      if (aspectRatio === '1:1') vfFilters.push("crop='min(iw,ih)':'min(iw,ih)'");
      if (aspectRatio === '9:16') vfFilters.push("crop='min(iw,ih*9/16)':'min(iw*16/9,ih)'");
      if (videoFilter === 'grayscale') vfFilters.push("format=gray");

      if (vfFilters.length > 0) {
        cmd.push('-vf', vfFilters.join(','));
      } else {
        cmd.push('-c', 'copy');
      }
      
      cmd.push('output.mp4');
      
      await ffmpeg.exec(cmd);
      const data = await ffmpeg.readFile('output.mp4');
      
      const processedBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const processedUrl = URL.createObjectURL(processedBlob);
      
      setVideoSrc(processedUrl);
      
      const newDuration = trimRange[1] - trimRange[0];
      setDuration(newDuration);
      setTrimRange([0, newDuration]);
      setAspectRatio('original');
      setVideoFilter('none');
      
      setStatusText('Processing complete!');
    } catch (error) {
      console.error("Processing failed:", error);
      setStatusText('Error processing video.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl flex flex-col bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        <div className="h-16 px-6 bg-[#151515] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Postifye Video Studio
          </h3>
          <button onClick={onCancel} className="text-zinc-400 hover:text-red-400 font-medium text-sm transition-colors">
            Discard & Close
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[60vh]">
          {/* Main Preview */}
          <div className="flex-1 bg-[#0A0A0A] flex items-center justify-center p-4 relative border-r border-zinc-800">
            {videoSrc ? (
              <video 
                ref={videoRef}
                src={videoSrc} 
                controls 
                onLoadedMetadata={handleLoadedMetadata}
                className={`max-h-full max-w-full rounded shadow-lg border border-zinc-800 transition-all ${videoFilter === 'grayscale' ? 'grayscale' : ''} ${aspectRatio === '1:1' ? 'aspect-square object-cover' : aspectRatio === '9:16' ? 'aspect-[9/16] object-cover' : ''}`}
              />
            ) : (
              <div className="text-zinc-500 animate-pulse">Loading WebAssembly Engine...</div>
            )}
          </div>

          {/* Tools Sidebar */}
          <div className="w-full md:w-72 bg-[#151515] p-6 flex flex-col gap-6 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Format (Crop)</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAspectRatio('original')} className={`py-2 text-xs font-medium rounded border ${aspectRatio === 'original' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>Original</button>
                <button onClick={() => setAspectRatio('1:1')} className={`py-2 text-xs font-medium rounded border ${aspectRatio === '1:1' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>1:1 Square</button>
                <button onClick={() => setAspectRatio('9:16')} className={`py-2 text-xs font-medium rounded border ${aspectRatio === '9:16' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>9:16 Reels</button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 block">Visual Filters</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setVideoFilter('none')} className={`py-2 text-xs font-medium rounded border ${videoFilter === 'none' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>None</button>
                <button onClick={() => setVideoFilter('grayscale')} className={`py-2 text-xs font-medium rounded border ${videoFilter === 'grayscale' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-[#111] text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}>Grayscale</button>
              </div>
            </div>
            
            <div className="mt-auto">
              <button 
                onClick={processVideo} 
                disabled={!loaded || isProcessing}
                className="w-full py-3 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 border border-zinc-700"
              >
                {isProcessing ? <span className="animate-pulse">Rendering...</span> : 'Apply Edits'}
              </button>
              <p className="text-[10px] text-zinc-600 text-center mt-2 leading-tight">Applying crops or filters requires re-encoding. This may take heavy CPU power.</p>
            </div>
          </div>
        </div>

        {/* Timeline Footer */}
        <div className="p-6 bg-[#111] border-t border-zinc-800 flex flex-col gap-4">
          <div className="px-2">
            <div className="flex justify-between text-xs text-zinc-400 font-mono mb-2">
              <span>{formatTime(trimRange[0])}</span>
              <span>{formatTime(trimRange[1])}</span>
            </div>
            <Slider 
              range 
              min={0} 
              max={duration || 100} 
              step={0.1} 
              value={trimRange} 
              onChange={(newRange) => {
                setTrimRange(newRange);
                if (videoRef.current) videoRef.current.currentTime = newRange[0];
              }} 
              disabled={isLoading || duration === 0}
              styles={{
                track: { backgroundColor: '#4f46e5', height: '8px' },
                rail: { backgroundColor: '#27272a', height: '8px' },
                handle: { backgroundColor: '#ffffff', borderColor: '#4f46e5', height: '20px', width: '20px', marginTop: '-6px' }
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3 text-sm text-zinc-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${loaded ? (isProcessing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]') : 'bg-red-500 animate-pulse'}`}></span>
              {statusText}
            </div>
            
            <button 
              onClick={() => onComplete(videoSrc)} 
              disabled={!loaded || isProcessing}
              className="px-8 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              Attach to Post
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoStudio;