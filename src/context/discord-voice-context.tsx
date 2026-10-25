'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface VoicePeer {
  id: string;
  name: string;
  avatarUrl: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isScreenSharing?: boolean;
}

export interface MediaDeviceChoice {
  deviceId: string;
  label: string;
}

interface DiscordVoiceContextType {
  isConnected: boolean;
  currentRoomName: string;
  isMicMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  inputVolume: number;
  outputVolume: number;
  inputProfile: 'isolation' | 'standard';
  isPushToTalk: boolean;
  inputDevices: MediaDeviceChoice[];
  outputDevices: MediaDeviceChoice[];
  selectedInputDeviceId: string;
  selectedOutputDeviceId: string;
  autoplayBlocked: boolean;
  localStream: MediaStream | null;
  localScreenStream: MediaStream | null;
  remoteScreenStream: MediaStream | null;
  remoteScreenSharer: { userId: string; userName: string } | null;
  connectedPeers: VoicePeer[];
  speakingUserIds: Set<string>;
  joinVoiceRoom: (roomName?: string) => Promise<void>;
  leaveVoiceRoom: () => void;
  toggleMic: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  playSoundboardChime: () => void;
  isViewerOpen: boolean;
  setIsViewerOpen: (open: boolean) => void;
  setInputVolume: (vol: number) => void;
  setOutputVolume: (vol: number) => void;
  setInputProfile: (profile: 'isolation' | 'standard') => void;
  setIsPushToTalk: (ptt: boolean) => void;
  setSelectedInputDeviceId: (id: string) => void;
  setSelectedOutputDeviceId: (id: string) => void;
  unlockAutoplay: () => void;
}

const DiscordVoiceContext = createContext<DiscordVoiceContextType | undefined>(undefined);

function getRtcConfig(): RTCConfiguration {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
    iceCandidatePoolSize: 6,
  };
}

export function DiscordVoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [isConnected, setIsConnected] = useState(false);
  const [currentRoomName, setCurrentRoomName] = useState('Lobby / Voice Lounge');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Audio Device and Settings States (Discord popups)
  const [inputVolume, setInputVolumeState] = useState(100);
  const [outputVolume, setOutputVolumeState] = useState(100);
  const [inputProfile, setInputProfile] = useState<'isolation' | 'standard'>('isolation');
  const [isPushToTalk, setIsPushToTalk] = useState(false);
  const [inputDevices, setInputDevices] = useState<MediaDeviceChoice[]>([]);
  const [outputDevices, setOutputDevices] = useState<MediaDeviceChoice[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState<string>('default');
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState<string>('default');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenSharer, setRemoteScreenSharer] = useState<{ userId: string; userName: string } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [connectedPeers, setConnectedPeers] = useState<VoicePeer[]>([]);
  const [speakingUserIds, setSpeakingUserIds] = useState<Set<string>>(new Set());

  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const voiceChannelRef = useRef<any>(null);
  const peerConnectionsRef = useRef<{ [peerId: string]: RTCPeerConnection }>({});
  const iceCandidateQueuesRef = useRef<{ [peerId: string]: RTCIceCandidateInit[] }>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const audioAnimationRef = useRef<number | null>(null);
  const remoteAudioElementsRef = useRef<{ [peerId: string]: HTMLAudioElement }>({});
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  // Refresh audio input & output devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: MediaDeviceChoice[] = [];
      const outputs: MediaDeviceChoice[] = [];

      devices.forEach((d) => {
        if (d.kind === 'audioinput') {
          inputs.push({
            deviceId: d.deviceId || 'default',
            label: d.label || `Microphone ${inputs.length + 1}`,
          });
        } else if (d.kind === 'audiooutput') {
          outputs.push({
            deviceId: d.deviceId || 'default',
            label: d.label || `Speaker/Headphones ${outputs.length + 1}`,
          });
        }
      });

      if (inputs.length > 0) setInputDevices(inputs);
      else setInputDevices([{ deviceId: 'default', label: 'Windows Default (Microphone)' }]);

      if (outputs.length > 0) setOutputDevices(outputs);
      else setOutputDevices([{ deviceId: 'default', label: 'Windows Default (Speakers)' }]);
    } catch (e) {
      console.warn('[GENZOKU Voice] Device enum error:', e);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  // Unlock audio autoplay policy on user click
  const unlockAutoplay = useCallback(() => {
    setAutoplayBlocked(false);
    Object.values(remoteAudioElementsRef.current).forEach((audio) => {
      audio.play().catch(() => {});
    });
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  // Update output volume across all connected peer audio elements
  const setOutputVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setOutputVolumeState(clamped);
    Object.values(remoteAudioElementsRef.current).forEach((audio) => {
      audio.volume = clamped / 100;
    });
  }, []);

  // Update mic volume via GainNode if available
  const setInputVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, vol));
    setInputVolumeState(clamped);
    if (micGainNodeRef.current && audioContextRef.current) {
      micGainNodeRef.current.gain.setValueAtTime(clamped / 100, audioContextRef.current.currentTime);
    }
  }, []);

  // Play Soundboard Chime (Discord-like ping)
  const playSoundboardChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  // Setup Mic Speech Volume Detection (Discord Green Ring)
  const setupSpeechDetection = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(inputVolume / 100, audioCtx.currentTime);
      micGainNodeRef.current = gainNode;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(gainNode);
      gainNode.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let wasSpeaking = false;

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const isSpeakingNow = avg > 14 && !isMicMuted && !isDeafened;

        if (isSpeakingNow !== wasSpeaking && user?.id) {
          wasSpeaking = isSpeakingNow;
          setSpeakingUserIds((prev) => {
            const next = new Set(prev);
            if (isSpeakingNow) next.add(user.id);
            else next.delete(user.id);
            return next;
          });

          if (voiceChannelRef.current) {
            voiceChannelRef.current.send({
              type: 'broadcast',
              event: 'peer_speaking',
              payload: { userId: user.id, isSpeaking: isSpeakingNow },
            });
          }
        }

        audioAnimationRef.current = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[GENZOKU Voice] Speech detection notice:', e);
    }
  }, [inputVolume, isMicMuted, isDeafened, user?.id]);

  // Helper: Create and configure PeerConnection for audio/video communication with a peer
  const getOrCreatePeerConnection = useCallback((peerId: string, channel: any, myId: string): RTCPeerConnection => {
    if (peerConnectionsRef.current[peerId]) {
      return peerConnectionsRef.current[peerId];
    }

    const pc = new RTCPeerConnection(getRtcConfig());
    peerConnectionsRef.current[peerId] = pc;
    iceCandidateQueuesRef.current[peerId] = [];

    // Add local mic stream audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Add screen stream if sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, screenStreamRef.current!);
      });
    }

    // Handle receiving remote tracks (voice audio & screen share video)
    pc.ontrack = (event) => {
      if (event.track.kind === 'audio') {
        let audioEl = remoteAudioElementsRef.current[peerId];
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          (audioEl as any).playsInline = true;
          audioEl.volume = outputVolume / 100;
          audioEl.muted = isDeafened;

          if (!audioContainerRef.current) {
            const container = document.createElement('div');
            container.id = 'genzoku-voice-audio-container';
            container.style.display = 'none';
            document.body.appendChild(container);
            audioContainerRef.current = container;
          }
          audioContainerRef.current.appendChild(audioEl);
          remoteAudioElementsRef.current[peerId] = audioEl;
        }

        audioEl.srcObject = event.streams[0];
        audioEl.play().catch((err) => {
          console.warn('[GENZOKU Voice] Autoplay blocked, prompt unlock:', err);
          setAutoplayBlocked(true);
        });
      } else if (event.track.kind === 'video') {
        setRemoteScreenStream(event.streams[0]);
      }
    };

    // Forward ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: 'broadcast',
          event: 'webrtc_ice',
          payload: {
            senderId: myId,
            targetId: peerId,
            candidate: event.candidate,
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        const audioEl = remoteAudioElementsRef.current[peerId];
        if (audioEl) {
          audioEl.pause();
          audioEl.srcObject = null;
          audioEl.remove();
          delete remoteAudioElementsRef.current[peerId];
        }
      }
    };

    return pc;
  }, [outputVolume, isDeafened]);

  // Helper: Flush queued ICE candidates after remote description is set
  const flushIceCandidates = useCallback(async (peerId: string) => {
    const pc = peerConnectionsRef.current[peerId];
    const queue = iceCandidateQueuesRef.current[peerId];
    if (pc && pc.remoteDescription && queue && queue.length > 0) {
      while (queue.length > 0) {
        const candidate = queue.shift();
        if (candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {}
        }
      }
    }
  }, []);

  // Join Voice Lounge
  const joinVoiceRoom = async (roomName: string = 'Lobby / Voice Lounge') => {
    setCurrentRoomName(roomName);
    playSoundboardChime();

    let stream: MediaStream | null = null;
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: inputProfile === 'isolation',
          autoGainControl: true,
          deviceId: selectedInputDeviceId !== 'default' ? { exact: selectedInputDeviceId } : undefined,
        },
        video: false,
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setupSpeechDetection(stream);
      refreshDevices();
    } catch (err) {
      console.warn('[GENZOKU Voice] Mic permission notice, entering listen mode:', err);
    }

    setIsConnected(true);

    const supabase = getSupabaseBrowserClient();
    const myId = user?.id || `anon-${Date.now()}`;
    const myName = user?.display_name || user?.username || 'Genzoku User';
    const myAvatar = user?.avatar_url || 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Kenji&backgroundColor=ffdfbf';

    setConnectedPeers([
      {
        id: myId,
        name: myName,
        avatarUrl: myAvatar,
        isSpeaking: false,
        isMuted: isMicMuted,
      },
    ]);

    if (!supabase) return;

    const roomChannelId = `discord_voice_${roomName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const channel = supabase.channel(roomChannelId, {
      config: { presence: { key: myId } },
    });
    voiceChannelRef.current = channel;

    // Presence sync & WebRTC peer negotiation
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const activePeers: VoicePeer[] = [];
        Object.keys(state).forEach((key) => {
          const pres: any = state[key]?.[0];
          if (pres) {
            const peerId = pres.userId || key;
            activePeers.push({
              id: peerId,
              name: pres.userName || 'Peer',
              avatarUrl: pres.avatarUrl || '',
              isSpeaking: false,
              isMuted: Boolean(pres.isMuted),
              isScreenSharing: Boolean(pres.isScreenSharing),
            });

            // If remote peer exists and we have higher ID (deterministic initiator to prevent glare)
            if (peerId !== myId && myId > peerId && !peerConnectionsRef.current[peerId]) {
              const pc = getOrCreatePeerConnection(peerId, channel, myId);
              pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
                .then(async (offer) => {
                  await pc.setLocalDescription(offer);
                  channel.send({
                    type: 'broadcast',
                    event: 'webrtc_offer',
                    payload: {
                      senderId: myId,
                      targetId: peerId,
                      offer,
                    },
                  });
                })
                .catch((e) => console.warn('[GENZOKU Voice] Offer creation error:', e));
            }
          }
        });
        setConnectedPeers(activePeers);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const pres: any = newPresences?.[0];
        const peerId = pres?.userId || key;
        if (peerId && peerId !== myId && myId > peerId && !peerConnectionsRef.current[peerId]) {
          const pc = getOrCreatePeerConnection(peerId, channel, myId);
          pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
            .then(async (offer) => {
              await pc.setLocalDescription(offer);
              channel.send({
                type: 'broadcast',
                event: 'webrtc_offer',
                payload: {
                  senderId: myId,
                  targetId: peerId,
                  offer,
                },
              });
            })
            .catch((e) => console.warn('[GENZOKU Voice] Join offer error:', e));
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const pres: any = leftPresences?.[0];
        const peerId = pres?.userId || key;
        if (peerId) {
          const pc = peerConnectionsRef.current[peerId];
          if (pc) {
            pc.close();
            delete peerConnectionsRef.current[peerId];
          }
          const audioEl = remoteAudioElementsRef.current[peerId];
          if (audioEl) {
            audioEl.pause();
            audioEl.srcObject = null;
            audioEl.remove();
            delete remoteAudioElementsRef.current[peerId];
          }
        }
      })
      .on('broadcast', { event: 'peer_speaking' }, ({ payload }) => {
        if (!payload?.userId) return;
        setSpeakingUserIds((prev) => {
          const next = new Set(prev);
          if (payload.isSpeaking) next.add(payload.userId);
          else next.delete(payload.userId);
          return next;
        });
      })
      .on('broadcast', { event: 'screen_share_started' }, ({ payload }) => {
        if (payload?.userId !== myId) {
          setRemoteScreenSharer({
            userId: payload.userId,
            userName: payload.userName || 'Presenter',
          });
          setIsViewerOpen(true);
        }
      })
      .on('broadcast', { event: 'screen_share_stopped' }, ({ payload }) => {
        if (payload?.userId !== myId) {
          setRemoteScreenStream(null);
          setRemoteScreenSharer(null);
          setIsViewerOpen(false);
        }
      })
      .on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
        if (payload?.targetId === myId && payload?.offer) {
          try {
            const pc = getOrCreatePeerConnection(payload.senderId, channel, myId);
            await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
            await flushIceCandidates(payload.senderId);

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            channel.send({
              type: 'broadcast',
              event: 'webrtc_answer',
              payload: {
                senderId: myId,
                targetId: payload.senderId,
                answer,
              },
            });
          } catch (e) {
            console.warn('[GENZOKU Voice] WebRTC offer handling error:', e);
          }
        }
      })
      .on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
        if (payload?.targetId === myId && payload?.answer) {
          const pc = peerConnectionsRef.current[payload.senderId];
          if (pc && pc.signalingState !== 'closed') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await flushIceCandidates(payload.senderId);
          }
        }
      })
      .on('broadcast', { event: 'webrtc_ice' }, async ({ payload }) => {
        if (payload?.targetId === myId && payload?.candidate) {
          const pc = peerConnectionsRef.current[payload.senderId];
          if (pc && pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
          } else {
            if (!iceCandidateQueuesRef.current[payload.senderId]) {
              iceCandidateQueuesRef.current[payload.senderId] = [];
            }
            iceCandidateQueuesRef.current[payload.senderId].push(payload.candidate);
          }
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: myId,
            userName: myName,
            avatarUrl: myAvatar,
            isMuted: isMicMuted,
            isScreenSharing: false,
            joinedAt: new Date().toISOString(),
          });
        }
      });
  };

  // Leave Voice Lounge
  const leaveVoiceRoom = useCallback(() => {
    playSoundboardChime();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setLocalScreenStream(null);
    setIsScreenSharing(false);

    if (audioAnimationRef.current) {
      cancelAnimationFrame(audioAnimationRef.current);
      audioAnimationRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    Object.keys(peerConnectionsRef.current).forEach((peerId) => {
      try {
        peerConnectionsRef.current[peerId].close();
      } catch {}
    });
    peerConnectionsRef.current = {};
    iceCandidateQueuesRef.current = {};

    Object.keys(remoteAudioElementsRef.current).forEach((peerId) => {
      try {
        const audio = remoteAudioElementsRef.current[peerId];
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch {}
    });
    remoteAudioElementsRef.current = {};

    if (voiceChannelRef.current) {
      voiceChannelRef.current.unsubscribe();
      voiceChannelRef.current = null;
    }

    setIsConnected(false);
    setConnectedPeers([]);
    setSpeakingUserIds(new Set());
    setRemoteScreenStream(null);
    setRemoteScreenSharer(null);
    setIsViewerOpen(false);
    setAutoplayBlocked(false);
  }, [playSoundboardChime]);

  // Toggle Mic Mute
  const toggleMic = () => {
    const nextState = !isMicMuted;
    setIsMicMuted(nextState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !nextState;
      });
    }
    if (voiceChannelRef.current && user?.id) {
      voiceChannelRef.current.track({
        userId: user.id,
        userName: user.display_name,
        avatarUrl: user.avatar_url,
        isMuted: nextState,
        isScreenSharing,
      });
    }
  };

  // Toggle Deafen Headphones
  const toggleDeafen = () => {
    const nextState = !isDeafened;
    setIsDeafened(nextState);

    Object.values(remoteAudioElementsRef.current).forEach((audio) => {
      audio.muted = nextState;
    });

    if (nextState && !isMicMuted) {
      toggleMic();
    }
  };

  // Toggle Video Camera
  const toggleCamera = async () => {
    if (!isConnected) return;
    if (isCameraOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      }
      setIsCameraOn(false);
    } else {
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = camStream.getVideoTracks()[0];
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        }
        setIsCameraOn(true);
      } catch (err) {
        console.warn('Camera permission notice:', err);
      }
    }
  };

  // Start Screen Sharing
  const startScreenShare = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      alert('Screen sharing is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true,
      });

      screenStreamRef.current = stream;
      setLocalScreenStream(stream);
      setIsScreenSharing(true);

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      const myId = user?.id || 'anon';
      const myName = user?.display_name || user?.username || 'Presenter';

      if (voiceChannelRef.current) {
        voiceChannelRef.current.send({
          type: 'broadcast',
          event: 'screen_share_started',
          payload: { userId: myId, userName: myName },
        });

        // Add track to each existing peer connection and renegotiate
        Object.keys(peerConnectionsRef.current).forEach(async (peerId) => {
          const pc = peerConnectionsRef.current[peerId];
          if (pc && pc.signalingState !== 'closed') {
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              voiceChannelRef.current.send({
                type: 'broadcast',
                event: 'webrtc_offer',
                payload: {
                  senderId: myId,
                  targetId: peerId,
                  offer,
                },
              });
            } catch (err) {
              console.warn('[GENZOKU Voice] Screen share renegotiate error:', err);
            }
          }
        });
      }
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        console.warn('Screen share error:', err);
      }
    }
  };

  // Stop Screen Sharing
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    setLocalScreenStream(null);
    setIsScreenSharing(false);

    if (voiceChannelRef.current && user?.id) {
      voiceChannelRef.current.send({
        type: 'broadcast',
        event: 'screen_share_stopped',
        payload: { userId: user.id },
      });
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      leaveVoiceRoom();
    };
  }, [leaveVoiceRoom]);

  return (
    <DiscordVoiceContext.Provider
      value={{
        isConnected,
        currentRoomName,
        isMicMuted,
        isDeafened,
        isCameraOn,
        isScreenSharing,
        inputVolume,
        outputVolume,
        inputProfile,
        isPushToTalk,
        inputDevices,
        outputDevices,
        selectedInputDeviceId,
        selectedOutputDeviceId,
        autoplayBlocked,
        localStream,
        localScreenStream,
        remoteScreenStream,
        remoteScreenSharer,
        connectedPeers,
        speakingUserIds,
        joinVoiceRoom,
        leaveVoiceRoom,
        toggleMic,
        toggleDeafen,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        playSoundboardChime,
        isViewerOpen,
        setIsViewerOpen,
        setInputVolume,
        setOutputVolume,
        setInputProfile,
        setIsPushToTalk,
        setSelectedInputDeviceId,
        setSelectedOutputDeviceId,
        unlockAutoplay,
      }}
    >
      {children}
    </DiscordVoiceContext.Provider>
  );
}

export function useDiscordVoice() {
  const context = useContext(DiscordVoiceContext);
  if (!context) {
    throw new Error('useDiscordVoice must be used within a DiscordVoiceProvider');
  }
  return context;
}
