'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useDiscordVoice } from '@/context/discord-voice-context';
import { Avatar } from '@/components/ui/Avatar';
import { SoundboardModal } from './SoundboardModal';
import {
  Wifi,
  PhoneOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Volume2,
  Mic,
  MicOff,
  Headphones,
  Settings,
  ChevronDown,
  ChevronUp,
  Radio,
  Gamepad2,
  Check,
  Sliders,
  VolumeX,
} from 'lucide-react';

interface DiscordVoicePanelProps {
  onOpenSettings: () => void;
}

export function DiscordVoicePanel({ onOpenSettings }: DiscordVoicePanelProps) {
  const { user } = useAuth();
  const {
    isConnected,
    currentRoomName,
    isMicMuted,
    isDeafened,
    isCameraOn,
    isScreenSharing,
    speakingUserIds,
    connectedPeers,
    joinVoiceRoom,
    leaveVoiceRoom,
    toggleMic,
    toggleDeafen,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    playSoundboardChime,
    remoteScreenSharer,
    setIsViewerOpen,
    inputVolume,
    setInputVolume,
    outputVolume,
    setOutputVolume,
    inputProfile,
    setInputProfile,
    isPushToTalk,
    setIsPushToTalk,
    inputDevices,
    outputDevices,
    selectedInputDeviceId,
    setSelectedInputDeviceId,
    selectedOutputDeviceId,
    setSelectedOutputDeviceId,
    autoplayBlocked,
    unlockAutoplay,
  } = useDiscordVoice();

  const [showActivities, setShowActivities] = useState(false);
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [showMicMenu, setShowMicMenu] = useState(false);
  const [showHeadphonesMenu, setShowHeadphonesMenu] = useState(false);

  const micMenuRef = useRef<HTMLDivElement>(null);
  const headphonesMenuRef = useRef<HTMLDivElement>(null);

  const isSpeaking = user?.id ? speakingUserIds.has(user.id) : false;

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (micMenuRef.current && !micMenuRef.current.contains(event.target as Node)) {
        setShowMicMenu(false);
      }
      if (headphonesMenuRef.current && !headphonesMenuRef.current.contains(event.target as Node)) {
        setShowHeadphonesMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full bg-[#111214] dark:bg-[#111214] border-t border-slate-800/80 text-slate-200 select-none shrink-0 transition-all">
      {/* Soundboard Modal with 12 Synthesized Audio SFX */}
      <SoundboardModal
        isOpen={showSoundboard}
        onClose={() => setShowSoundboard(false)}
      />

      {/* 0. Autoplay Sound Blocked Banner */}
      {autoplayBlocked && (
        <div
          onClick={unlockAutoplay}
          className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors shadow-md animate-pulse"
        >
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4" />
            <span>Voice Audio blocked by browser. Click to unmute sound!</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">Unmute Now</span>
        </div>
      )}

      {/* 1. Remote Screen Share Watch Banner */}
      {remoteScreenSharer && (
        <div className="bg-gradient-to-r from-brand-900/80 to-purple-900/80 px-3 py-2 border-b border-brand-500/30 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold text-white text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
              {remoteScreenSharer.userName} is LIVE
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsViewerOpen(true)}
            className="px-2.5 py-1 bg-brand-500 hover:bg-brand-400 text-white font-bold text-[10px] rounded-lg shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
          >
            <ScreenShare className="w-3 h-3" />
            <span>Watch Stream</span>
          </button>
        </div>
      )}

      {/* 2. Connected Voice Box */}
      {isConnected ? (
        <div className="p-2 space-y-2">
          {/* Top Row: Green Status & Disconnect Button */}
          <div className="bg-[#1e1f22] rounded-xl p-2.5 border border-white/5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-emerald-400">
                    Voice Connected
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="w-1 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="w-1 h-3 rounded-full bg-emerald-400 animate-pulse delay-75" />
                    <span className="w-1 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-150" />
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {currentRoomName} • {connectedPeers.length} online
                </p>
              </div>
            </div>

            {/* Hangup / Disconnect Phone Button */}
            <button
              type="button"
              onClick={leaveVoiceRoom}
              className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
              title="Disconnect"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Discord Action Pills Row: Camera | Screen Share | Activities | Soundboard */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Camera Toggle */}
            <button
              type="button"
              onClick={toggleCamera}
              className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isCameraOn
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#2b2d31] hover:bg-[#35373c] text-slate-300'
              }`}
              title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Screen Share Toggle */}
            <button
              type="button"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className={`py-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-brand-600 text-white ring-2 ring-brand-400/50 shadow-xs'
                  : 'bg-[#2b2d31] hover:bg-[#35373c] text-slate-300'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Your Screen'}
            >
              {isScreenSharing ? <ScreenShareOff className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
            </button>

            {/* Activities Button */}
            <button
              type="button"
              onClick={() => setShowActivities((p) => !p)}
              className="py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Activities & Mini Games"
            >
              <Gamepad2 className="w-4 h-4" />
            </button>

            {/* Soundboard FX Button */}
            <button
              type="button"
              onClick={() => setShowSoundboard(true)}
              className="py-2 rounded-xl bg-[#2b2d31] hover:bg-[#35373c] text-slate-300 hover:text-amber-300 flex items-center justify-center transition-colors cursor-pointer"
              title="Open Soundboard (12 Sounds)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* When not connected to Voice: Sleek One-Tap Join Button */
        <div className="p-2 border-b border-white/5">
          <button
            type="button"
            onClick={() => joinVoiceRoom()}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-between shadow-md shadow-emerald-950/40 cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Join Voice Lounge</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
              Free P2P
            </span>
          </button>
        </div>
      )}

      {/* 3. Bottom User Profile Bar (Discord Layout) */}
      <div className="px-2.5 py-2 bg-[#232428] flex items-center justify-between relative">
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-2 min-w-0 cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors flex-1"
        >
          {/* Avatar with speaking green glowing ring */}
          <div className="relative shrink-0">
            <div
              className={`rounded-full transition-all ${
                isSpeaking
                  ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#232428] scale-105'
                  : ''
              }`}
            >
              <Avatar
                src={user?.avatar_url}
                name={user?.display_name || user?.username}
                size="sm"
                isOnline={true}
              />
            </div>
          </div>

          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-200 truncate">
                {user?.display_name || user?.username || 'User'}
              </span>
              {isSpeaking && (
                <Volume2 className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              @{user?.username || 'user'}
            </p>
          </div>
        </div>

        {/* Action Controls: Mic | Deafen | Settings */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* MIC BUTTON + DROPDOWN ARROW */}
          <div className="relative flex items-center rounded-lg hover:bg-white/10 group">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-1.5 transition-colors cursor-pointer rounded-l-lg ${
                isMicMuted ? 'text-rose-400' : 'text-slate-300'
              }`}
              title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMicMenu((prev) => !prev);
                setShowHeadphonesMenu(false);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-r-lg"
              title="Microphone Settings"
            >
              <ChevronUp className="w-3 h-3" />
            </button>

            {/* EXACT DISCORD MIC POPUP MENU (From user's screenshot media_1792863074889_be51d328.png) */}
            {showMicMenu && (
              <div
                ref={micMenuRef}
                className="absolute bottom-full right-0 mb-2 w-72 bg-[#2b2d31] rounded-2xl shadow-2xl border border-white/10 p-3.5 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* 1. INPUT DEVICE */}
                <div className="mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Input Device
                  </span>
                  <select
                    value={selectedInputDeviceId}
                    onChange={(e) => setSelectedInputDeviceId(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-brand-500 cursor-pointer"
                  >
                    {inputDevices.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. INPUT PROFILE */}
                <div className="mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Input Profile
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#1e1f22] p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setInputProfile('isolation')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        inputProfile === 'isolation'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Voice Isolation
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputProfile('standard')}
                      className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        inputProfile === 'standard'
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Standard
                    </button>
                  </div>
                </div>

                {/* 3. INPUT VOLUME */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    <span>Input Volume</span>
                    <span className="text-brand-400 font-mono font-bold">{inputVolume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={inputVolume}
                      onChange={(e) => setInputVolume(Number(e.target.value))}
                      className="w-full accent-brand-500 cursor-pointer h-1.5 bg-[#1e1f22] rounded-lg"
                    />
                  </div>
                </div>

                {/* 4. PUSH-TO-TALK TOGGLE */}
                <div className="pt-2 border-t border-white/5 mb-3 flex items-center justify-between">
                  <label htmlFor="ptt-checkbox" className="text-xs font-semibold text-slate-300 cursor-pointer">
                    Push-to-talk
                  </label>
                  <input
                    id="ptt-checkbox"
                    type="checkbox"
                    checked={isPushToTalk}
                    onChange={(e) => setIsPushToTalk(e.target.checked)}
                    className="w-4 h-4 rounded-sm accent-brand-500 cursor-pointer"
                  />
                </div>

                {/* 5. VOICE SETTINGS LINK */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMicMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full py-1.5 px-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Voice Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* HEADPHONES BUTTON + DROPDOWN ARROW */}
          <div className="relative flex items-center rounded-lg hover:bg-white/10 group">
            <button
              type="button"
              onClick={toggleDeafen}
              className={`p-1.5 transition-colors cursor-pointer rounded-l-lg ${
                isDeafened ? 'text-rose-400' : 'text-slate-300'
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowHeadphonesMenu((prev) => !prev);
                setShowMicMenu(false);
              }}
              className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-r-lg"
              title="Headphone / Audio Settings"
            >
              <ChevronUp className="w-3 h-3" />
            </button>

            {/* EXACT DISCORD HEADPHONES POPUP MENU (From user's screenshot media_1792863064021_0583d9d5.png) */}
            {showHeadphonesMenu && (
              <div
                ref={headphonesMenuRef}
                className="absolute bottom-full right-0 mb-2 w-72 bg-[#2b2d31] rounded-2xl shadow-2xl border border-white/10 p-3.5 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* 1. OUTPUT DEVICE */}
                <div className="mb-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Output Device
                  </span>
                  <select
                    value={selectedOutputDeviceId}
                    onChange={(e) => setSelectedOutputDeviceId(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-brand-500 cursor-pointer"
                  >
                    {outputDevices.map((dev) => (
                      <option key={dev.deviceId} value={dev.deviceId}>
                        {dev.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. OUTPUT VOLUME */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                    <span>Output Volume</span>
                    <span className="text-brand-400 font-mono font-bold">{outputVolume}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={outputVolume}
                      onChange={(e) => setOutputVolume(Number(e.target.value))}
                      className="w-full accent-brand-500 cursor-pointer h-1.5 bg-[#1e1f22] rounded-lg"
                    />
                  </div>
                </div>

                {/* 3. VOICE SETTINGS LINK */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHeadphonesMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full py-1.5 px-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Voice Settings</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Settings Gear Icon */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-white/10 transition-colors cursor-pointer"
            title="User Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
