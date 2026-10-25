'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CallSession, CallType, UserProfile } from '@/types';
import { useAuth } from './auth-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface CallContextType {
  activeCall: CallSession | null;
  incomingCall: CallSession | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;
  callError: string | null;
  initiateCall: (receiver: UserProfile, callType: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

// WebRTC STUN & TURN Configuration Helper
function getRtcConfiguration(): RTCConfiguration {
  const stunUrls = (
    process.env.NEXT_PUBLIC_STUN_SERVERS ||
    'stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302,stun:stun2.l.google.com:19302,stun:stun.cloudflare.com:3478'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const iceServers: RTCIceServer[] = [{ urls: stunUrls }];

  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrls && turnUsername && turnCredential) {
    const urls = turnUrls.split(',').map((u) => u.trim()).filter(Boolean);
    iceServers.push({
      urls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return {
    iceServers,
    iceCandidatePoolSize: 10,
  };
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, isDemoMode } = useAuth();
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const offerResendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const callRoomChannelRef = useRef<any>(null);
  const userInboxChannelRef = useRef<any>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const currentCallIdRef = useRef<string | null>(null);

  // Keep currentCallIdRef synchronized
  useEffect(() => {
    currentCallIdRef.current = activeCall?.id || incomingCall?.id || null;
  }, [activeCall?.id, incomingCall?.id]);

  // Clean up all media, peer connection and call channels
  const cleanupCallState = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    connectedAtRef.current = null;
    setCallDuration(0);

    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    if (offerResendTimerRef.current) {
      clearInterval(offerResendTimerRef.current);
      offerResendTimerRef.current = null;
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.ontrack = null;
        peerConnectionRef.current.onicecandidate = null;
        peerConnectionRef.current.onconnectionstatechange = null;
        peerConnectionRef.current.oniceconnectionstatechange = null;
        peerConnectionRef.current.close();
      } catch (e) {
        console.warn('[GENZOKU Call] Error closing RTCPeerConnection:', e);
      }
      peerConnectionRef.current = null;
    }

    if (callRoomChannelRef.current) {
      try {
        callRoomChannelRef.current.unsubscribe();
      } catch (e) {
        // non-blocking
      }
      callRoomChannelRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    currentCallIdRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
  };

  // Run cleanup ONLY once on provider unmount
  useEffect(() => {
    return () => {
      cleanupCallState();
    };
  }, []);

  // Duration Timer based strictly on actual connected timestamp
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      if (!connectedAtRef.current) {
        connectedAtRef.current = Date.now();
      }
      durationTimerRef.current = setInterval(() => {
        if (connectedAtRef.current) {
          const elapsedSecs = Math.floor((Date.now() - connectedAtRef.current) / 1000);
          setCallDuration(elapsedSecs);
        }
      }, 1000);
    } else {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      connectedAtRef.current = null;
      setCallDuration(0);
    }
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [activeCall?.status]);

  // Process queued ICE candidates
  const processPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription) return;

    const queued = [...pendingIceCandidatesRef.current];
    pendingIceCandidatesRef.current = [];

    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[GENZOKU Call] Error adding queued ICE candidate:', err);
      }
    }
  };

  // Add ICE candidate or queue it if remote description is not yet set
  const handleIncomingIceCandidate = async (candidate: RTCIceCandidateInit) => {
    const pc = peerConnectionRef.current;
    if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
      pendingIceCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[GENZOKU Call] Error adding ICE candidate:', err);
    }
  };

  // Dual-Layer Incoming Call Watcher: Realtime Broadcast + PostgreSQL Realtime on call_sessions
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user?.id || isDemoMode) return;

    const inboxChannel = supabase.channel(`user_signaling_${user.id}`, {
      config: { broadcast: { self: false } },
    });
    userInboxChannelRef.current = inboxChannel;

    // Layer 1: Realtime Broadcast Delivery (ultra-low latency)
    inboxChannel
      .on('broadcast', { event: 'incoming_call' }, ({ payload }) => {
        if (!payload || payload.receiver_id !== user.id) return;
        if (currentCallIdRef.current && currentCallIdRef.current !== payload.id) {
          return;
        }

        currentCallIdRef.current = payload.id;
        setCallError(null);
        setIncomingCall(payload);
      })
      .on('broadcast', { event: 'call_ended' }, ({ payload }) => {
        if (payload?.callId && currentCallIdRef.current === payload.callId) {
          cleanupCallState();
        }
      })
      .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
        if (payload?.callId && currentCallIdRef.current === payload.callId) {
          setCallError('Call declined by recipient.');
          setTimeout(() => {
            cleanupCallState();
          }, 2000);
        }
      });

    // Layer 2: PostgreSQL Realtime Delivery on call_sessions table (guaranteed persistence)
    inboxChannel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_sessions',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row || (row.status !== 'ringing' && row.status !== 'initiating')) return;
          if (currentCallIdRef.current && currentCallIdRef.current !== row.id) {
            return;
          }

          currentCallIdRef.current = row.id;

          // Fetch caller profile from database
          const { data: callerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', row.caller_id)
            .single();

          const incomingSession: CallSession = {
            id: row.id,
            caller_id: row.caller_id,
            receiver_id: user.id,
            call_type: row.call_type,
            status: 'ringing',
            caller_profile: (callerData as UserProfile) || undefined,
            created_at: row.created_at,
          };

          setCallError(null);
          setIncomingCall((prev) => (prev && prev.id === row.id ? prev : incomingSession));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row && (row.status === 'ended' || row.status === 'rejected')) {
            if (currentCallIdRef.current === row.id) {
              cleanupCallState();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `caller_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            if (row.status === 'rejected') {
              setCallError('Call declined by recipient.');
              setTimeout(() => cleanupCallState(), 2000);
            } else if (row.status === 'ended') {
              cleanupCallState();
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[GENZOKU Call] Signaling inbox ready for user: ${user.id}`);
        }
      });

    return () => {
      inboxChannel.unsubscribe();
      userInboxChannelRef.current = null;
    };
  }, [user?.id, isDemoMode]);

  // Initiate Outgoing Call
  const initiateCall = async (receiver: UserProfile, callType: CallType) => {
    if (!user) return;
    setCallError(null);

    const isSimulationCall = isDemoMode || Boolean(receiver.is_demo);
    const callId = `call-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    currentCallIdRef.current = callId;

    const session: CallSession = {
      id: callId,
      caller_id: user.id,
      receiver_id: receiver.id,
      call_type: callType,
      status: 'ringing',
      caller_profile: user,
      receiver_profile: receiver,
      is_simulation: isSimulationCall,
      created_at: new Date().toISOString(),
    };

    // 1. Immediately render the Call Screen to the user
    setActiveCall(session);

    // 2. Request local media stream
    let stream: MediaStream | null = null;
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === 'video',
          });
        } catch (mediaErr: any) {
          if (callType === 'video' && (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError')) {
            console.warn('[GENZOKU Call] Camera not found, falling back to audio only');
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } else {
            throw mediaErr;
          }
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMuted(false);
        setIsVideoEnabled(stream.getVideoTracks().length > 0);
      }
    } catch (err: any) {
      console.warn('[GENZOKU Call] Local media access error:', err);
      let errMsg = 'Unable to access microphone or camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errMsg = 'Microphone/Camera permission denied. Please allow device access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = 'No microphone or audio device detected on this system.';
      } else {
        errMsg = `Media error: ${err.message || 'Unable to open media device'}`;
      }
      setCallError(errMsg);
      return;
    }

    // 3. Demo simulation mode handling
    if (isSimulationCall) {
      simulationTimerRef.current = setTimeout(() => {
        setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
        connectedAtRef.current = Date.now();
        if (stream) {
          setRemoteStream(stream);
        }
      }, 2000);
      return;
    }

    // 4. Live WebRTC Initiation with Supabase Signaling
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const pc = new RTCPeerConnection(getRtcConfiguration());
      peerConnectionRef.current = pc;
      pendingIceCandidatesRef.current = [];

      // Add local media tracks
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
      }

      // Handle remote media tracks
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Set up dedicated call room channel
      const callRoom = supabase.channel(`call_room_${callId}`, {
        config: { broadcast: { self: false } },
      });
      callRoomChannelRef.current = callRoom;

      // Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && callRoomChannelRef.current) {
          callRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: { callId, candidate: event.candidate.toJSON() },
          });
        }
      };

      // Monitor Peer Connection State
      pc.onconnectionstatechange = () => {
        console.log(`[GENZOKU Call] Peer connection state: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          connectedAtRef.current = Date.now();
          setCallError(null);
          if (offerResendTimerRef.current) {
            clearInterval(offerResendTimerRef.current);
            offerResendTimerRef.current = null;
          }
        } else if (pc.connectionState === 'failed') {
          if (connectedAtRef.current) {
            setCallError('Connection interrupted. Attempting to reconnect...');
            try {
              pc.restartIce();
            } catch (err) {
              console.warn('ICE restart failed', err);
            }
          }
        } else if (pc.connectionState === 'disconnected') {
          if (connectedAtRef.current) {
            setCallError('Connection interrupted. Attempting to reconnect...');
          }
        } else if (pc.connectionState === 'closed') {
          cleanupCallState();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[GENZOKU Call] ICE state: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          if (!connectedAtRef.current) connectedAtRef.current = Date.now();
          setCallError(null);
          if (offerResendTimerRef.current) {
            clearInterval(offerResendTimerRef.current);
            offerResendTimerRef.current = null;
          }
        } else if (pc.iceConnectionState === 'failed' && connectedAtRef.current) {
          try {
            pc.restartIce();
          } catch {}
        }
      };

      // Create Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === 'video',
      });
      await pc.setLocalDescription(offer);

      const offerPayload = { type: offer.type, sdp: offer.sdp };

      // Helper function to broadcast offer in call room
      const broadcastOfferInRoom = () => {
        if (callRoomChannelRef.current) {
          callRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'call_offer',
            payload: { callId, offer: offerPayload },
          });
        }
      };

      // Listen for incoming answer, receiver presence, and ICE candidates
      callRoom
        .on('broadcast', { event: 'receiver_joined' }, () => {
          console.log('[GENZOKU Call] Receiver announced presence in room, dispatching offer');
          broadcastOfferInRoom();
        })
        .on('broadcast', { event: 'call_answered' }, async ({ payload }) => {
          if (payload?.callId !== callId) return;

          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
          }
          if (offerResendTimerRef.current) {
            clearInterval(offerResendTimerRef.current);
            offerResendTimerRef.current = null;
          }

          if (payload?.answer && peerConnectionRef.current) {
            try {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
              await processPendingIceCandidates();
            } catch (e: any) {
              console.warn('[GENZOKU Call] Error setting remote description from answer:', e);
              setCallError('Signaling failed during handshake.');
            }
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
          if (payload?.callId !== callId) return;
          if (payload?.candidate) {
            await handleIncomingIceCandidate(payload.candidate);
          }
        })
        .on('broadcast', { event: 'call_ended' }, ({ payload }) => {
          if (payload?.callId === callId) {
            cleanupCallState();
          }
        })
        .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
          if (payload?.callId === callId) {
            setCallError('Call declined by recipient.');
            setTimeout(() => cleanupCallState(), 2000);
          }
        });

      // Subscribe to call room non-blockingly
      callRoom.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          broadcastOfferInRoom();
        }
      });

      // Periodically re-broadcast offer every 2.5 seconds while ringing (ensures delivery if recipient joins late)
      offerResendTimerRef.current = setInterval(() => {
        broadcastOfferInRoom();
      }, 2500);

      // Persist call session to Supabase call_sessions table (triggers PostgreSQL Realtime on recipient)
      try {
        await supabase.from('call_sessions').insert({
          id: callId,
          caller_id: user.id,
          receiver_id: receiver.id,
          call_type: callType,
          status: 'ringing',
        });
      } catch (dbErr) {
        console.warn('[GENZOKU Call] DB call_sessions insert note:', dbErr);
      }

      // Transmit call offer to recipient's personal inbox channel
      const recipientChannel = supabase.channel(`user_signaling_${receiver.id}`, {
        config: { broadcast: { self: false } },
      });
      recipientChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          recipientChannel.send({
            type: 'broadcast',
            event: 'incoming_call',
            payload: { ...session, offer: offerPayload },
          });
        }
      });

      // 30-second ringing timeout
      ringTimeoutRef.current = setTimeout(() => {
        if (activeCall?.status !== 'connected') {
          setCallError('Call timed out — no answer from recipient.');
          setTimeout(() => endCall(), 3000);
        }
      }, 30000);
    } catch (err: any) {
      console.error('[GENZOKU Call] WebRTC initiation failed:', err);
      setCallError(`WebRTC error: ${err.message || 'Call initiation failed'}`);
    }
  };

  // Answer Incoming Call
  const answerCall = async () => {
    if (!incomingCall || !user) return;
    setCallError(null);

    const targetCall = incomingCall;
    const callId = targetCall.id;
    currentCallIdRef.current = callId;

    // Transition from incoming dialog to active call interface immediately
    setIncomingCall(null);
    setActiveCall({ ...targetCall, status: 'ringing' });

    // 1. Request local media stream
    let stream: MediaStream | null = null;
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: targetCall.call_type === 'video',
          });
        } catch (mediaErr: any) {
          if (targetCall.call_type === 'video' && (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError')) {
            console.warn('[GENZOKU Call] Camera not found on answer, falling back to audio');
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          } else {
            throw mediaErr;
          }
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsMuted(false);
        setIsVideoEnabled(stream.getVideoTracks().length > 0);
      }
    } catch (err: any) {
      console.warn('[GENZOKU Call] Media error during answer:', err);
      setCallError('Microphone/Camera permission denied. Cannot connect call.');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const pc = new RTCPeerConnection(getRtcConfiguration());
      peerConnectionRef.current = pc;
      pendingIceCandidatesRef.current = [];

      // Add local media tracks
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream!));
      }

      // Handle remote media track
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Join dedicated call room
      const callRoom = supabase.channel(`call_room_${callId}`, {
        config: { broadcast: { self: false } },
      });
      callRoomChannelRef.current = callRoom;

      // Handle local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && callRoomChannelRef.current) {
          callRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: { callId, candidate: event.candidate.toJSON() },
          });
        }
      };

      // Monitor Peer Connection State
      pc.onconnectionstatechange = () => {
        console.log(`[GENZOKU Call] Callee peer connection state: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          connectedAtRef.current = Date.now();
          setCallError(null);
        } else if (pc.connectionState === 'failed') {
          if (connectedAtRef.current) {
            setCallError('Connection interrupted. Attempting to reconnect...');
            try {
              pc.restartIce();
            } catch (err) {
              console.warn('ICE restart failed', err);
            }
          }
        } else if (pc.connectionState === 'disconnected') {
          if (connectedAtRef.current) {
            setCallError('Connection interrupted. Attempting to reconnect...');
          }
        } else if (pc.connectionState === 'closed') {
          cleanupCallState();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[GENZOKU Call] Callee ICE state: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));
          if (!connectedAtRef.current) connectedAtRef.current = Date.now();
          setCallError(null);
        } else if (pc.iceConnectionState === 'failed' && connectedAtRef.current) {
          try {
            pc.restartIce();
          } catch {}
        }
      };

      const handleOfferAndAnswer = async (offerData: any) => {
        if (!offerData || pc.remoteDescription) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offerData));
          await processPendingIceCandidates();

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          // Broadcast answer in room
          callRoom.send({
            type: 'broadcast',
            event: 'call_answered',
            payload: { callId, answer: { type: answer.type, sdp: answer.sdp } },
          });

          // Also deliver to caller inbox as backup
          const callerInbox = supabase.channel(`user_signaling_${targetCall.caller_id}`, {
            config: { broadcast: { self: false } },
          });
          callerInbox.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              callerInbox.send({
                type: 'broadcast',
                event: 'call_answered',
                payload: { callId, answer: { type: answer.type, sdp: answer.sdp } },
              });
            }
          });

          // Update database call_sessions status
          supabase
            .from('call_sessions')
            .update({ status: 'connected' })
            .eq('id', callId)
            .then();
        } catch (err: any) {
          console.error('[GENZOKU Call] Error processing offer and creating answer:', err);
        }
      };

      // Listen for call offer, ICE candidates, and remote hang-up in call room
      callRoom
        .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
          if (payload?.callId === callId && payload?.offer) {
            await handleOfferAndAnswer(payload.offer);
          }
        })
        .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
          if (payload?.callId !== callId) return;
          if (payload?.candidate) {
            await handleIncomingIceCandidate(payload.candidate);
          }
        })
        .on('broadcast', { event: 'call_ended' }, ({ payload }) => {
          if (payload?.callId === callId) {
            cleanupCallState();
          }
        });

      // Subscribe to call room and announce readiness
      callRoom.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          callRoom.send({
            type: 'broadcast',
            event: 'receiver_joined',
            payload: { callId },
          });
        }
      });

      // If offer was already present in the incoming call payload, process it immediately!
      if (targetCall.offer) {
        await handleOfferAndAnswer(targetCall.offer);
      }
    } catch (err: any) {
      console.error('[GENZOKU Call] Answer handshake error:', err);
      setCallError(`Handshake error: ${err.message || 'Unable to establish call'}`);
    }
  };

  // Reject Incoming Call
  const rejectCall = () => {
    if (incomingCall) {
      const callId = incomingCall.id;
      const callerId = incomingCall.caller_id;
      const supabase = getSupabaseBrowserClient();

      if (supabase && callerId) {
        const callerChannel = supabase.channel(`user_signaling_${callerId}`, {
          config: { broadcast: { self: false } },
        });
        callerChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            callerChannel.send({
              type: 'broadcast',
              event: 'call_rejected',
              payload: { callId },
            });
          }
        });

        // Update database call_sessions status
        supabase
          .from('call_sessions')
          .update({ status: 'rejected', ended_at: new Date().toISOString() })
          .eq('id', callId)
          .then();
      }
      setIncomingCall(null);
    }
  };

  // End Active Call
  const endCall = () => {
    const call = activeCall || incomingCall;
    if (call) {
      const callId = call.id;
      const targetId = call.caller_id === user?.id ? call.receiver_id : call.caller_id;
      const supabase = getSupabaseBrowserClient();

      if (supabase && !call.is_simulation) {
        // Broadcast to call room
        if (callRoomChannelRef.current) {
          callRoomChannelRef.current.send({
            type: 'broadcast',
            event: 'call_ended',
            payload: { callId },
          });
        }

        // Broadcast to target user's personal channel
        if (targetId) {
          const targetChannel = supabase.channel(`user_signaling_${targetId}`, {
            config: { broadcast: { self: false } },
          });
          targetChannel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              targetChannel.send({
                type: 'broadcast',
                event: 'call_ended',
                payload: { callId },
              });
            }
          });
        }

        // Update database record
        supabase
          .from('call_sessions')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', callId)
          .then();
      }
    }
    cleanupCallState();
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextEnabled = !audioTracks[0].enabled;
        audioTracks.forEach((t) => {
          t.enabled = nextEnabled;
        });
        setIsMuted(!nextEnabled);
      }
    } else {
      setIsMuted(!isMuted);
    }
  };

  // Toggle Camera Video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextEnabled = !videoTracks[0].enabled;
        videoTracks.forEach((t) => {
          t.enabled = nextEnabled;
        });
        setIsVideoEnabled(nextEnabled);
      }
    } else {
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        isMuted,
        isVideoEnabled,
        localStream,
        remoteStream,
        callDuration,
        callError,
        initiateCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
