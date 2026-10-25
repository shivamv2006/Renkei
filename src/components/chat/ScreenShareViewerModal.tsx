'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Radio,
  Tv,
} from 'lucide-react';
import { useDiscordVoice } from '@/context/discord-voice-context';

export function ScreenShareViewerModal() {
  const {
    isViewerOpen,
    setIsViewerOpen,
    remoteScreenStream,
    remoteScreenSharer,
    localScreenStream,
    isScreenSharing,
  } = useDiscordVoice();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Active stream to display: remote stream if watching peer, or local screen if presenter
  const activeStream = remoteScreenStream || (isScreenSharing ? localScreenStream : null);
  const presenterName = remoteScreenSharer?.userName || (isScreenSharing ? 'You' : 'Live Screen');

  useEffect(() => {
    if (videoRef.current && activeStream) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.play().catch(() => {});
    }
  }, [activeStream, isViewerOpen]);

  if (!isViewerOpen || !activeStream) return null;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted) {
      handleVolumeChange(volume || 0.8);
    } else {
      handleVolumeChange(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 animate-in fade-in select-none"
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Live Screen Broadcast</h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <Radio className="w-3 h-3 animate-spin" /> LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Streaming by <span className="text-white font-semibold">{presenterName}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsViewerOpen(false)}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Viewer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Live Video Player */}
      <div className="w-full max-w-5xl flex-1 my-3 bg-black rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isScreenSharing || isMuted}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 backdrop-blur-lg">
        {/* Volume & Mute */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 sm:w-24 accent-brand-500 cursor-pointer"
          />
        </div>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>
      </div>
    </div>
  );
}
