import { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const VideoStudio = ({ file, onCancel, onComplete }) => {
  const [loaded, setLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoSrc, setVideoSrc] = useState('');
  const [statusText, setStatusText] = useState('Initializing Engine...');
  
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef(null);

  useEffect(() => {
    // 1. Create a local URL for the uploaded video to preview it
    if (file) {
      setVideoSrc(URL.createObjectURL(file));
    }
    loadFFmpeg();
  }, [file]);

  const loadFFmpeg = async () => {
    setIsLoading(true);
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd';
    const ffmpeg = ffmpegRef.current;
    
    // Catch FFmpeg logs to see what's happening under the hood
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg Log:', message);
    });

    try {
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setLoaded(true);
      setStatusText('Ready');
    } catch (error) {
      console.error("FFmpeg load failed:", error);
      setStatusText('Failed to load video engine. Check COOP/COEP headers.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestTrim = async () => {
    if (!loaded) return;
    setIsLoading(true);
    setStatusText('Trimming first 5 seconds...');
    
    try {
      const ffmpeg = ffmpegRef.current;
      
      // 1. Write the user's file into the WebAssembly memory
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));
      
      // 2. Run the FFmpeg command: start at 00:00:00, trim exactly 5 seconds
      await ffmpeg.exec(['-i', 'input.mp4', '-ss', '00:00:00', '-t', '5', '-c', 'copy', 'output.mp4']);
      
      // 3. Read the result back from memory
      const data = await ffmpeg.readFile('output.mp4');
      
      // 4. Convert it to a playable URL
      const trimmedBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const trimmedUrl = URL.createObjectURL(trimmedBlob);
      
      setVideoSrc(trimmedUrl);
      setStatusText('Trim successful! Check the preview.');
    } catch (error) {
      console.error("Trim failed:", error);
      setStatusText('Error processing video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl flex flex-col bg-[#111] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="h-16 px-6 bg-[#151515] border-b border-zinc-800 flex items-center justify-between shrink-0">
          <h3 className="text-zinc-100 font-semibold flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            Video Studio
          </h3>
          <button onClick={onCancel} className="text-zinc-400 hover:text-red-400 font-medium text-sm transition-colors">
            Cancel
          </button>
        </div>

        {/* Video Preview Area */}
        <div className="relative w-full h-[50vh] sm:h-[60vh] bg-[#0A0A0A] flex items-center justify-center p-4">
          {videoSrc ? (
            <video 
              ref={videoRef}
              src={videoSrc} 
              controls 
              className="max-h-full max-w-full rounded shadow-lg border border-zinc-800"
            />
          ) : (
            <div className="text-zinc-500 animate-pulse">Loading preview...</div>
          )}
        </div>

        {/* Toolbar & Controls */}
        <div className="p-6 bg-[#151515] border-t border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-zinc-400 font-mono">
              <span className={`w-2 h-2 rounded-full ${loaded ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`}></span>
              {statusText}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleTestTrim} 
                disabled={!loaded || isLoading}
                className="px-6 py-2.5 text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Test 5s Trim
              </button>
              <button 
                onClick={() => onComplete(videoSrc)} 
                disabled={!loaded || isLoading}
                className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                Apply & Attach
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoStudio;