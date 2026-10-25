'use client';

import React, { useState, useEffect } from 'react';
import { useDiscordVoice } from '@/context/discord-voice-context';
import {
  Volume2,
  Volume1,
  VolumeX,
  X,
  Sparkles,
  Zap,
  Bell,
  Play,
  Flame,
  Music,
  Radio,
  Upload,
  Trash2,
  Plus,
} from 'lucide-react';

interface CustomSound {
  id: string;
  name: string;
  audioDataUrl: string;
  created_at: string;
}

function playCustomSound(audioDataUrl: string, volumePercent: number = 80) {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(audioDataUrl);
    audio.volume = Math.max(0, Math.min(1, volumePercent / 100));
    audio.play().catch((err) => console.warn('[Soundboard] Audio play error:', err));
  } catch (e) {
    console.warn('[Soundboard] Custom audio error:', e);
  }
}

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Built-in Web Audio API Sound Synthesizer with Master Volume Adjustment
function playSynthesizedSound(soundId: string, volumePercent: number = 80) {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  const ctx = new AudioContextClass();
  const now = ctx.currentTime;

  // Master Volume Node (controlled by the user's slider)
  const masterGain = ctx.createGain();
  const volFactor = Math.max(0, Math.min(1, volumePercent / 100));
  masterGain.gain.setValueAtTime(volFactor, now);
  masterGain.connect(ctx.destination);

  switch (soundId) {
    case 'airhorn': {
      // Classic DJ Airhorn Triad (3 harmonic detuned sawtooth waves)
      const freqs = [466.16, 554.37, 622.25]; // Bb4 triad
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.setValueAtTime(freq * 1.02, now + 0.1);
        osc.frequency.setValueAtTime(freq, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.7);
      });
      break;
    }

    case 'badumtss': {
      // Kick -> Snare -> Cymbal Crash
      // 1. Kick
      const kickOsc = ctx.createOscillator();
      const kickGain = ctx.createGain();
      kickOsc.frequency.setValueAtTime(150, now);
      kickOsc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      kickGain.gain.setValueAtTime(0.7, now);
      kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.15);

      // 2. Snare
      const snareOsc = ctx.createOscillator();
      const snareGain = ctx.createGain();
      snareOsc.frequency.setValueAtTime(200, now + 0.2);
      snareOsc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
      snareGain.gain.setValueAtTime(0.6, now + 0.2);
      snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      snareOsc.connect(snareGain);
      snareGain.connect(masterGain);
      snareOsc.start(now + 0.2);
      snareOsc.stop(now + 0.35);

      // 3. Cymbal crash
      const bufferSize = ctx.sampleRate * 0.8;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(5000, now + 0.4);
      const cymbalGain = ctx.createGain();
      cymbalGain.gain.setValueAtTime(0.5, now + 0.4);
      cymbalGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      noise.connect(filter);
      filter.connect(cymbalGain);
      cymbalGain.connect(masterGain);
      noise.start(now + 0.4);
      noise.stop(now + 1.2);
      break;
    }

    case 'discord': {
      // Classic Discord Bell Chime
      const notes = [
        { f: 880, t: now },
        { f: 1174.66, t: now + 0.12 },
      ];
      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, n.t);
        gain.gain.setValueAtTime(0.3, n.t);
        gain.gain.exponentialRampToValueAtTime(0.001, n.t + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(n.t);
        osc.stop(n.t + 0.45);
      });
      break;
    }

    case 'coin': {
      // 8-bit Coin Chime (B5 -> E6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }

    case 'fanfare': {
      // Level Up Fanfare: C5 -> E5 -> G5 -> C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.1;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + (idx === 3 ? 0.6 : 0.2));
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + (idx === 3 ? 0.65 : 0.25));
      });
      break;
    }

    case 'laser': {
      // Pew Pew Laser Sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.28);
      break;
    }

    case 'bruh': {
      // Deep Bass Drop
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.65);
      break;
    }

    case 'quack': {
      // Modulated Duck Quack
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.25);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.value = 5;

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.32);
      break;
    }

    case 'nani': {
      // Anime Warning Nani Siren (Rapid high alternating tone)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(1000, now + i * 0.1);
        osc.frequency.setValueAtTime(1400, now + i * 0.1 + 0.05);
      }
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
      break;
    }

    case 'applause': {
      // Crowd Cheering Shimmer
      const bufferSize = ctx.sampleRate * 1.0;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(i / 100);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2000, now);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.95);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      noise.start(now);
      noise.stop(now + 1.0);
      break;
    }

    case 'oneup': {
      // 1-Up 6-Note Ascending Sequence (E5, G5, E6, C6, D6, G6)
      const notes = [659.25, 783.99, 1318.51, 1046.5, 1174.66, 1567.98];
      notes.forEach((freq, idx) => {
        const t = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + (idx === 3 ? 0.6 : 0.18));
      });
      break;
    }

    case 'gg': {
      // Victory GG Chords
      const chords = [
        { freqs: [440, 554.37, 659.25], t: now },
        { freqs: [523.25, 659.25, 783.99], t: now + 0.2 },
        { freqs: [587.33, 739.99, 880], t: now + 0.4 },
      ];
      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, chord.t);
          gain.gain.setValueAtTime(0.18, chord.t);
          gain.gain.exponentialRampToValueAtTime(0.01, chord.t + 0.35);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(chord.t);
          osc.stop(chord.t + 0.4);
        });
      });
      break;
    }

    default:
      break;
  }
}

const SOUNDS = [
  { id: 'airhorn', name: 'Airhorn MLG', icon: '📯', color: 'from-amber-500 to-red-500', desc: 'Classic DJ blast' },
  { id: 'badumtss', name: 'Ba-Dum-Tss!', icon: '🥁', color: 'from-blue-500 to-indigo-600', desc: 'Punchline drum' },
  { id: 'discord', name: 'Discord Ping', icon: '🔔', color: 'from-indigo-500 to-purple-600', desc: 'Notification bell' },
  { id: 'coin', name: 'Retro Coin', icon: '🪙', color: 'from-yellow-400 to-amber-500', desc: '8-bit arcade coin' },
  { id: 'fanfare', name: 'Level Up!', icon: '✨', color: 'from-emerald-400 to-teal-600', desc: 'Victory fanfare' },
  { id: 'laser', name: 'Laser Pew', icon: '🚀', color: 'from-cyan-400 to-blue-600', desc: 'Sci-fi blaster' },
  { id: 'bruh', name: 'Bass Drop', icon: '💥', color: 'from-rose-500 to-pink-600', desc: 'Heavy sub-bass' },
  { id: 'quack', name: 'Duck Quack', icon: '🦆', color: 'from-amber-400 to-yellow-500', desc: 'Funny quack' },
  { id: 'nani', name: 'Nani?! Alert', icon: '🚨', color: 'from-red-500 to-rose-600', desc: 'Anime shock alarm' },
  { id: 'applause', name: 'Applause', icon: '👏', color: 'from-purple-500 to-pink-500', desc: 'Crowd cheer' },
  { id: 'oneup', name: '1-Up Life', icon: '🍄', color: 'from-green-500 to-emerald-600', desc: 'Extra life bonus' },
  { id: 'gg', name: 'Victory GG', icon: '⚡', color: 'from-sky-400 to-blue-600', desc: 'Good game chords' },
];

export function SoundboardModal({ isOpen, onClose }: SoundboardModalProps) {
  const { isConnected } = useDiscordVoice();
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(80);
  const [customSounds, setCustomSounds] = useState<CustomSound[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load soundboard volume and custom uploaded sounds from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedVol = localStorage.getItem('genzoku_soundboard_volume');
      if (savedVol !== null) {
        setVolume(Number(savedVol));
      }
      try {
        const savedCustom = localStorage.getItem('renkei_custom_soundboard');
        if (savedCustom) {
          setCustomSounds(JSON.parse(savedCustom));
        }
      } catch (e) {
        console.warn(e);
      }
    }
  }, [isOpen]);

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (typeof window !== 'undefined') {
      localStorage.setItem('genzoku_soundboard_volume', String(newVol));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac|webm)$/i)) {
      alert('Please upload a valid audio file (.mp3, .wav, .ogg, .webm, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const newSound: CustomSound = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 24),
          audioDataUrl: event.target.result,
          created_at: new Date().toISOString(),
        };
        const updated = [newSound, ...customSounds];
        setCustomSounds(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('renkei_custom_soundboard', JSON.stringify(updated));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteCustomSound = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customSounds.filter((s) => s.id !== id);
    setCustomSounds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('renkei_custom_soundboard', JSON.stringify(updated));
    }
  };

  if (!isOpen) return null;

  const handlePlaySound = (soundId: string, name: string) => {
    playSynthesizedSound(soundId, volume);
    setLastPlayed(name);
    setTimeout(() => setLastPlayed(null), 1500);
  };

  const handlePlayCustomSound = (sound: CustomSound) => {
    playCustomSound(sound.audioDataUrl, volume);
    setLastPlayed(sound.name);
    setTimeout(() => setLastPlayed(null), 1500);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Soundboard Effects</span>
                {lastPlayed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 animate-in fade-in">
                    ▶ {lastPlayed}
                  </span>
                )}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thin, Sleek Sound Volume Adjust Slider Bar */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold shrink-0">
            <button
              type="button"
              onClick={() => handleVolumeChange(volume > 0 ? 0 : 80)}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-purple-600 dark:text-purple-400 cursor-pointer"
              title={volume === 0 ? 'Unmute Soundboard' : 'Mute Soundboard'}
            >
              {volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <span className="text-[11px] font-bold">Sound Volume</span>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-xs">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
              title={`Sound Volume: ${volume}%`}
            />
            <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300 w-9 text-right shrink-0">
              {volume}%
            </span>
          </div>
        </div>

        {/* Status Hint */}
        <div className="px-5 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 shrink-0">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px]">
            {isConnected
              ? 'Voice Lounge connected: Tap any sound to play at chosen volume!'
              : 'Tap any sound effect to play live audio with adjustable volume!'}
          </span>
        </div>

        {/* Soundboard Grid & Custom Audio Uploads */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Custom Media Upload Audio Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                <span>My Custom Sounds ({customSounds.length})</span>
              </span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Audio</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {customSounds.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {customSounds.map((cs) => (
                  <div
                    key={cs.id}
                    onClick={() => handlePlayCustomSound(cs)}
                    className="group relative p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between h-20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">🎵</span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCustomSound(cs.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        title="Delete custom sound"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="truncate">
                      <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{cs.name}</h5>
                      <span className="text-[9px] text-purple-400 font-mono">Custom Media</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-center cursor-pointer hover:border-purple-400/50 transition-colors"
              >
                <p className="text-[11px] text-slate-400">
                  Upload your own meme audio, sounds, or tracks (.mp3, .wav, .webm)
                </p>
              </div>
            )}
          </div>

          {/* Official Curated SFX Grid */}
          <div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Official SFX Collection (12)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handlePlaySound(sound.id, sound.name)}
                  className="group relative p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-left transition-all active:scale-95 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between h-24 overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {sound.icon}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center transition-colors">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {sound.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{sound.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px] font-medium">12 Real-Time Sound Effects</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
