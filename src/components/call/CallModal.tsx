'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '@/context/call-context';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  AlertCircle,
  Sparkles,
  Volume2,
} from 'lucide-react';

export function CallModal() {
  const { user } = useAuth();
  const {
    activeCall,
    incomingCall,
    isMuted,
    isVideoEnabled,
    localStream,
    remoteStream,
    callDuration,
    callError,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Web Audio Ringtone for incoming & outgoing ringing states
  useEffect(() => {
    const isRinging = Boolean(
      incomingCall ||
      (activeCall && (activeCall.status === 'ringing' || activeCall.status === 'initiating'))
    );

    if (!isRinging) return;

    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      audioCtx = new AudioCtxClass();

      const playRingBurst = () => {
        if (!audioCtx || audioCtx.state === 'closed') return;
        const now = audioCtx.currentTime;

        // Pleasant dual-tone phone ring (440Hz + 480Hz)
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.setValueAtTime(0.08, now + 1.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      };

      playRingBurst();
      intervalId = setInterval(playRingBurst, 3000);
    } catch (e) {
      console.warn('[GENZOKU Call] Web Audio ringtone error:', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx && audioCtx.state !== 'closed') {
        try {
          audioCtx.close();
        } catch (e) {}
      }
    };
  }, [incomingCall, activeCall?.status]);

  // Attach local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach remote stream to real audio element and handle browser autoplay
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      const playPromise = remoteAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('[GENZOKU Call] Audio autoplay blocked by browser policy:', err);
            setAutoplayBlocked(true);
          });
      }
    } else {
      setAutoplayBlocked(false);
    }
  }, [remoteStream]);

  // Format Call Duration into MM:SS or HH:MM:SS
  const formatDuration = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remSecs = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  };

  // User gesture handler to unblock audio playback if browser restricted autoplay
  const handleEnableAudio = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current
        .play()
        .then(() => setAutoplayBlocked(false))
        .catch((e) => console.warn('[GENZOKU Call] Manual audio playback error:', e));
    }
  };

  // 1. Incoming Call Dialog
  if (incomingCall) {
    const caller = incomingCall.caller_profile;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in select-none">
        <div className="w-[calc(100vw-32px)] max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-white shadow-2xl">
          <div className="relative mx-auto mb-4 w-20 h-20 flex items-center justify-center">
            <span className="absolute inset-0 rounded-3xl bg-brand-500/30 animate-ping" />
            <Avatar src={caller?.avatar_url} name={caller?.display_name} size="xl" />
          </div>
          <h3 className="text-lg font-bold">
            {caller?.display_name || 'GENZOKU Member'}
          </h3>
          <p className="text-xs text-brand-400 mt-1 uppercase tracking-wider font-semibold">
            Incoming {incomingCall.call_type} call...
          </p>

          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={rejectCall}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform active:scale-95 cursor-pointer"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={answerCall}
              className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform active:scale-95 animate-pulse cursor-pointer"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Call Screen
  if (!activeCall) return null;

  // Identify remote participant correctly regardless of whether user is caller or callee
  const otherParty =
    activeCall.caller_id === user?.id
      ? activeCall.receiver_profile
      : activeCall.caller_profile;

  const isSimulation = Boolean(activeCall.is_simulation);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white select-none">
      {/* Hidden Real Remote Audio Element (Always present to deliver sound for both voice and video calls) */}
      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        muted={isSimulation} // prevent mic loopback howling in local simulation
      />

      {/* Simulation Banner Notice */}
      {isSimulation && (
        <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-semibold text-amber-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>[DEMO SIMULATION] Offline Preview Mode — Testing local media controls</span>
        </div>
      )}

      {/* Autoplay Blocked Banner */}
      {autoplayBlocked && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 shrink-0" />
            <span>Browser paused audio playback. Click to hear remote participant.</span>
          </div>
          <button
            onClick={handleEnableAudio}
            className="px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="p-4 flex items-center justify-between bg-slate-900/60 backdrop-blur-md border-b border-slate-800/60 z-10">
        <div className="flex items-center gap-3">
          <Avatar src={otherParty?.avatar_url} name={otherParty?.display_name} size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-sm">{otherParty?.display_name || 'GENZOKU Contact'}</h4>
              {isSimulation && (
                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[10px] font-bold uppercase">
                  Simulated
                </span>
              )}
            </div>
            <span className="text-xs text-brand-400 font-mono">
              {activeCall.status === 'connected'
                ? formatDuration(callDuration)
                : activeCall.status === 'ringing'
                ? isSimulation
                  ? 'Simulating call handshake...'
                  : 'Ringing remote peer...'
                : 'Connecting signaling...'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Notice Bar if connection fails during active call */}
      {callError && activeCall.status === 'connected' && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2 flex items-center justify-center gap-2 text-xs font-medium text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{callError}</span>
        </div>
      )}

      {/* Main Video / Audio Canvas */}
      <div className="flex-1 relative flex items-center justify-center p-4">
        {activeCall.call_type === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted // audio is played by dedicated <audio> element to prevent echo/duplicate playback
            className="w-full h-full object-cover rounded-3xl"
          />
        ) : (
          <div className="text-center space-y-4">
            <Avatar src={otherParty?.avatar_url} name={otherParty?.display_name} size="xl" />
            <div>
              <h2 className="text-2xl font-bold">{otherParty?.display_name || 'GENZOKU Contact'}</h2>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {activeCall.status === 'connected'
                  ? isSimulation
                    ? 'Simulated Audio Loopback Connected'
                    : 'Peer-to-Peer Connected via WebRTC'
                  : activeCall.status === 'ringing'
                  ? 'Awaiting Answer...'
                  : 'Connecting WebRTC Session...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Picture-in-Picture Video Preview */}
        {activeCall.call_type === 'video' && localStream && (
          <div className="absolute bottom-6 right-6 w-36 h-48 bg-slate-900 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-2xl">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Floating Call Controls Bar */}
      <div className="p-4 pb-8 sm:p-6 bg-slate-900/90 backdrop-blur-md flex justify-center items-center gap-3 sm:gap-4 border-t border-slate-800">
        <button
          onClick={toggleMute}
          className={`p-3.5 rounded-2xl transition-colors cursor-pointer ${
            isMuted ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-slate-800 text-white hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {activeCall.call_type === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3.5 rounded-2xl transition-colors cursor-pointer ${
              !isVideoEnabled ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
            title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2 px-5 font-semibold text-xs"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
}
