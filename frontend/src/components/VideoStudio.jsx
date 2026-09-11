import { useEffect, useRef, useState } from 'react';
import useEditorStore from '../store/useEditorStore';

const VideoStudio = ({ file, onCancel, onComplete }) => {
  const { 
    projectDuration, 
    playheadPosition, 
    isPlaying, 
    zoomLevel, 
    tracks,
    togglePlay, 
    setPlayheadPosition,
    addTrack,
    addClipToTrack,
    resetProject
  } = useEditorStore();

  const timelineRef = useRef(null);
  const trackAreaRef = useRef(null); // The new ref for accurate math
  const canvasRef = useRef(null);
  const hiddenVideoRef = useRef(null);
  const isSeekingRef = useRef(false);
  
  const [videoUrl, setVideoUrl] = useState(null);

  // 1. Initialize and Load Media
  useEffect(() => {
    resetProject(); // Wipe any stuck state from memory
    
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    
    const tempVid = document.createElement('video');
    tempVid.src = url;
    tempVid.preload = 'metadata';

    tempVid.onloadedmetadata = () => {
      if (tempVid.duration === Infinity || isNaN(tempVid.duration)) {
        tempVid.currentTime = 1e101; 
        tempVid.ontimeupdate = () => {
          tempVid.ontimeupdate = null;
          const realDuration = tempVid.currentTime;
          tempVid.currentTime = 0;
          addClipToTrack(tracks[0].id, file, realDuration);
        };
      } else {
        addClipToTrack(tracks[0].id, file, tempVid.duration);
      }
    };

    return () => {
      URL.revokeObjectURL(url);
      resetProject(); // Cleanup on unmount
    };
  }, [file]);

  // 2. High-Performance Canvas Engine
  useEffect(() => {
    const video = hiddenVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || tracks[0].clips.length === 0) return;

    const ctx = canvas.getContext('2d');
    const clip = tracks[0].clips[0];

    const clipStart = clip.timelineStart;
    const clipEnd = clip.timelineStart + (clip.trimEnd - clip.trimStart);

    const drawFrame = () => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (video.videoWidth && video.videoHeight) {
        const hRatio = canvas.width / video.videoWidth;
        const vRatio = canvas.height / video.videoHeight;
        const ratio = Math.min(hRatio, vRatio);
        const cx = (canvas.width - video.videoWidth * ratio) / 2;
        const cy = (canvas.height - video.videoHeight * ratio) / 2;  

        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, cx, cy, video.videoWidth * ratio, video.videoHeight * ratio);
      }
      isSeekingRef.current = false;
    };

    if (playheadPosition >= clipStart && playheadPosition <= clipEnd) {
      const localTime = clip.trimStart + (playheadPosition - clipStart);
      
      if (Math.abs(video.currentTime - localTime) > 0.05 && !isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = localTime;
        video.addEventListener('seeked', drawFrame, { once: true });
      } else if (!isSeekingRef.current) {
         drawFrame();
      }
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [playheadPosition, tracks]);
  // 3. AUTO-SCROLL TIMELINE WHEN PLAYHEAD REACHES EDGE
  useEffect(() => {
    const container = timelineRef.current;
    if (!container) return;

    const playheadPixelX = playheadPosition * zoomLevel;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    // If playhead moves past the right edge of the visible screen (leaving a 100px buffer)
    if (playheadPixelX > scrollLeft + clientWidth - 100) {
      container.scrollLeft = playheadPixelX - 100;
    } 
    // If playhead moves past the left edge
    else if (playheadPixelX < scrollLeft + 200) {
      container.scrollLeft = Math.max(0, playheadPixelX - 200);
    }
  }, [playheadPosition, zoomLevel]);

  // --- PLAYHEAD SCRUBBING LOGIC ---
  const handleTimelineScrub = (e) => {
    if (!trackAreaRef.current) return;
    
    // We get the bounding box of the INNER scrolling grid, not the outer window.
    // As you scroll right, rect.left naturally calculates the hidden pixels!
    const rect = trackAreaRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left; 
    
    if (offsetX >= 0) {
      const newTime = Math.max(0, Math.min(offsetX / zoomLevel, projectDuration));
      setPlayheadPosition(newTime);
    }
  };

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    handleTimelineScrub(e);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) return "00:00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    const ms = Math.floor((seconds % 1) * 100).toString().padStart(2, '0');
    return `${m}:${s}:${ms}`;
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0A0A0A] flex flex-col font-sans select-none animate-in fade-in duration-300">
      
      {/* 1. TOP NAVBAR */}
      <div className="h-14 px-6 bg-[#111] border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-zinc-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h3 className="text-zinc-100 font-semibold flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Postifye Studio
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-5 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            Export Media
          </button>
        </div>
      </div>

      {/* 2. MIDDLE WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black flex items-center justify-center relative shadow-inner shadow-black">
           <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-indigo-400 font-mono text-xs px-2 py-1 rounded border border-indigo-500/30 z-50">
              {formatTime(playheadPosition)}
           </div>
           
           <canvas 
             ref={canvasRef} 
             width={1280} 
             height={720} 
             className="w-full max-w-[800px] h-auto aspect-video bg-[#111] border border-zinc-800 rounded shadow-2xl"
           />
           
           <video 
             ref={hiddenVideoRef} 
             src={videoUrl} 
             className="hidden" 
             muted 
             playsInline 
             preload="auto"
           />
        </div>

        <div className="w-72 bg-[#111] border-l border-zinc-800 p-4 flex flex-col gap-6 overflow-y-auto">
           <div>
             <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Inspector</h4>
             <div className="p-4 border border-zinc-800 rounded border-dashed flex flex-col items-center justify-center text-center text-zinc-600 gap-2">
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
               <span className="text-xs">Select a clip on the timeline to edit properties</span>
             </div>
           </div>
        </div>
      </div>

      {/* 3. BOTTOM WORKSPACE */}
      <div className="h-80 bg-[#151515] border-t border-zinc-800 flex flex-col shrink-0">
        <div className="h-10 border-b border-zinc-800 px-4 flex items-center justify-between bg-[#111]">
          <div className="flex items-center gap-2">
            <button onClick={addTrack} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Add Track">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <div className="w-px h-4 bg-zinc-700 mx-2"></div>
            <button onClick={togglePlay} className="p-1.5 text-zinc-100 hover:bg-zinc-800 rounded transition-colors">
              {isPlaying ? 
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg> : 
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              }
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
            <input type="range" min="10" max="200" value={zoomLevel} readOnly className="w-24 accent-zinc-500" />
          </div>
        </div>

        <div 
          className="flex-1 flex overflow-auto relative bg-[#0A0A0A]" 
          ref={timelineRef}
          onPointerDown={handlePointerDown}
          onPointerMove={(e) => e.buttons === 1 && handleTimelineScrub(e)}
        >
          <div className="w-[200px] bg-[#111] sticky left-0 z-40 border-r border-zinc-800 flex flex-col shrink-0 pt-6 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
            {tracks.map((track) => (
              <div key={track.id} className="h-24 border-b border-zinc-800 px-3 py-2 flex flex-col justify-center bg-[#151515]">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold">
                  {track.type === 'video' ? '🎬' : '🎵'} {track.name}
                </div>
              </div>
            ))}
          </div>

          {/* THE NEW REF IS ATTACHED HERE */}
          <div ref={trackAreaRef} className="relative min-w-full" style={{ width: `${Math.max(projectDuration, 30) * zoomLevel}px` }}>
            <div className="h-6 border-b border-zinc-800 sticky top-0 bg-[#0A0A0A]/90 backdrop-blur z-30 flex items-end">
              {Array.from({ length: Math.ceil(Math.max(projectDuration, 30)) }).map((_, i) => (
                <div key={i} className="absolute border-l border-zinc-700 h-2" style={{ left: `${i * zoomLevel}px` }}>
                  <span className="absolute -top-4 -left-3 text-[10px] text-zinc-500 font-mono select-none">{i}s</span>
                </div>
              ))}
            </div>

            {Array.from({ length: Math.ceil(Math.max(projectDuration, 30)) }).map((_, i) => (
              <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-zinc-800/30 pointer-events-none" style={{ left: `${i * zoomLevel}px` }} />
            ))}

            <div className="flex flex-col relative z-10">
              {tracks.map((track) => (
                <div key={`body-${track.id}`} className="h-24 border-b border-zinc-800/50 relative">
                  {track.clips.map((clip) => (
                    <div 
                      key={clip.id}
                      className="absolute top-2 bottom-2 bg-indigo-600 rounded-md border border-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer overflow-hidden group flex flex-col"
                      style={{ 
                        left: `${clip.timelineStart * zoomLevel}px`, 
                        width: `${(clip.trimEnd - clip.trimStart) * zoomLevel}px` 
                      }}
                    >
                      <div className="h-3 bg-white/20 w-full pointer-events-none"></div>
                      <div className="px-2 py-1 text-[10px] text-white font-semibold truncate pointer-events-none">
                        {clip.file.name}
                      </div>
                      
                      <div className="absolute left-0 top-0 bottom-0 w-2 hover:bg-white/50 cursor-ew-resize transition-colors" />
                      <div className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/50 cursor-ew-resize transition-colors" />
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div 
              className="absolute top-0 bottom-0 z-50 pointer-events-none"
              style={{ transform: `translateX(${playheadPosition * zoomLevel}px)` }}
            >
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500 absolute -top-0 -left-[6px]"></div>
              <div className="w-px h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] absolute left-0 top-0"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStudio;