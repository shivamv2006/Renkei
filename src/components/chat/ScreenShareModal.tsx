'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScreenShare,
  ScreenShareOff,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  X,
  Radio,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  partnerName?: string;
}

export function ScreenShareModal({
  isOpen,
  onClose,
  conversationId,
  partnerName = 'Contact',
}: ScreenShareModalProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSharing, setIsSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [shareError, setShareError] = useState<string | null>(null);
  const [trackLabel, setTrackLabel] = useState<string>('Entire Screen');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Broadcast screen sharing status to conversation channel
  const broadcastStatus = useCallback((active: boolean) => {
    if (!conversationId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const channel = supabase.channel(`conversation_${conversationId}`);
      channel.send({
        type: 'broadcast',
        event: 'screenshare_status',
        payload: {
          active,
          userId: user?.id,
          userName: user?.display_name || user?.username || 'User',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn('[GENZOKU] Screen share broadcast notice:', err);
    }
  }, [conversationId, user]);

  const stopScreenShare = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSharing(false);
    setElapsedSeconds(0);
    broadcastStatus(false);
  }, [broadcastStatus]);

  const startScreenShare = async () => {
    setShareError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setShareError('Screen sharing is not supported on this browser or mobile device.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as any,
        audio: true,
      });

      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        setTrackLabel(videoTrack.label || 'Screen Stream');
        // Handle user clicking the native browser "Stop Sharing" button
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn('Video play warning:', err));
      }

      setIsSharing(true);
      setElapsedSeconds(0);
      broadcastStatus(true);

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('[GENZOKU] Screen share cancelled or denied:', err);
      if (err.name !== 'NotAllowedError') {
        setShareError(err.message || 'Failed to initialize screen sharing.');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      startScreenShare();
    } else {
      stopScreenShare();
    }

    return () => {
      stopScreenShare();
    };
  }, [isOpen]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const toggleAudio = () => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !track.enabled;
    });
    setIsAudioMuted((prev) => !prev);
  };

  const handleClose = () => {
    stopScreenShare();
    onClose();
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in select-none"
    >
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <ScreenShare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Live Screen Share</h3>
              {isSharing && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  <Radio className="w-3 h-3 animate-spin" /> LIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Sharing with <span className="text-white font-medium">{partnerName}</span> • {trackLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSharing && (
            <span className="font-mono text-xs font-semibold text-white px-2.5 py-1 rounded-lg bg-black/40 border border-white/10">
              {formatTimer(elapsedSeconds)}
            </span>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Screen Stream Display */}
      <div className="w-full max-w-5xl flex-1 my-3 bg-slate-950 rounded-3xl border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center relative">
        {shareError ? (
          <div className="p-6 max-w-md text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-white">Screen Sharing Error</h4>
            <p className="text-xs text-slate-400">{shareError}</p>
            <button
              type="button"
              onClick={startScreenShare}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : isSharing ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <div className="text-center space-y-3 p-6">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
              <ScreenShare className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-white">Ready to Share Your Screen</h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Present documents, slides, videos, code, or apps directly into GENZOKU chat.
            </p>
            <button
              type="button"
              onClick={startScreenShare}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 cursor-pointer"
            >
              Select Window or Screen
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex items-center justify-center gap-3 backdrop-blur-lg">
        {/* Toggle Audio */}
        <button
          type="button"
          onClick={toggleAudio}
          disabled={!isSharing}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            isAudioMuted
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
              : 'bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700'
          } ${!isSharing ? 'opacity-40 pointer-events-none' : ''}`}
          title={isAudioMuted ? 'Unmute System Audio' : 'Mute System Audio'}
        >
          {isAudioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          disabled={!isSharing}
          className={`p-3 rounded-xl border bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 transition-all cursor-pointer ${
            !isSharing ? 'opacity-40 pointer-events-none' : ''
          }`}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Stop Sharing Button */}
        {isSharing ? (
          <button
            type="button"
            onClick={stopScreenShare}
            className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer active:scale-95"
          >
            <ScreenShareOff className="w-4 h-4" />
            <span>Stop Sharing</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={startScreenShare}
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-600/25 transition-all cursor-pointer active:scale-95"
          >
            <ScreenShare className="w-4 h-4" />
            <span>Share Screen</span>
          </button>
        )}
      </div>
    </div>
  );
}
