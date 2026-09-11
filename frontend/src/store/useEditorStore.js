import { create } from 'zustand';

const useEditorStore = create((set, get) => ({
  projectDuration: 30, 
  playheadPosition: 0,
  isPlaying: false,
  zoomLevel: 100, 
  
  tracks: [
    {
      id: 'track-1',
      type: 'video',
      name: 'Video Track 1',
      clips: [] 
    }
  ],

  // 1. Playback Controls
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlayheadPosition: (time) => set({ playheadPosition: time }),
  
  // 2. Clear Cache (Fixes the 15-second HMR bug)
  resetProject: () => set({
    projectDuration: 30,
    playheadPosition: 0,
    isPlaying: false,
    tracks: [{ id: 'track-1', type: 'video', name: 'Video Track 1', clips: [] }]
  }),

  // 3. Track Management
  addTrack: (type = 'video') => set((state) => ({
    tracks: [
      ...state.tracks,
      {
        id: `track-${Date.now()}`,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${state.tracks.length + 1}`,
        clips: []
      }
    ]
  })),

  // 4. Clip Management 
  addClipToTrack: (trackId, file, sourceDuration) => set((state) => {
    const newTracks = state.tracks.map(track => {
      if (track.id !== trackId) return track;
      
      const lastClip = track.clips[track.clips.length - 1];
      const timelineStart = lastClip ? lastClip.timelineStart + (lastClip.trimEnd - lastClip.trimStart) : 0;

      const newClip = {
        id: `clip-${Date.now()}`,
        file,
        sourceDuration,
        trimStart: 0,
        trimEnd: sourceDuration, 
        timelineStart,
      };

      return { ...track, clips: [...track.clips, newClip] };
    });

    // Expand project duration dynamically with a 10-second visual padding at the end
    const maxTime = Math.max(state.projectDuration, ...newTracks.flatMap(t => 
      t.clips.map(c => c.timelineStart + (c.trimEnd - c.trimStart))
    ));

    return { tracks: newTracks, projectDuration: Math.max(maxTime + 10, 30) };
  }),

  // 5. Updating a Clip (For trimming later)
  updateClip: (trackId, clipId, updates) => set((state) => ({
    tracks: state.tracks.map(track => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        clips: track.clips.map(clip => clip.id === clipId ? { ...clip, ...updates } : clip)
      };
    })
  })),
}));

export default useEditorStore;