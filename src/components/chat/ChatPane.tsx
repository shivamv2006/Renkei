'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/chat-context';
import { useAuth } from '@/context/auth-context';
import { useCall } from '@/context/call-context';
import { useDiscordVoice } from '@/context/discord-voice-context';
import { Avatar } from '@/components/ui/Avatar';
import { MessageBubble } from './MessageBubble';
import { EmojiGifPicker } from './EmojiGifPicker';
import { ThemeWallpaperModal } from './ThemeWallpaperModal';
import { ScreenShareModal } from './ScreenShareModal';
import { GroupInfoModal } from './GroupInfoModal';
import { RenkeiLogo } from '@/components/ui/RenkeiLogo';
import { BRANDING } from '@/config/branding';
import { Message, Attachment } from '@/types';
import { formatLastSeen } from '@/lib/utils';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  Send,
  Paperclip,
  Smile,
  ScreenShare,
  X,
  ChevronLeft,
  CheckCircle,
  Mic,
  Trash2,
  Square,
  Palette,
  Radio,
  Phone,
  Video,
  Info,
} from 'lucide-react';

interface ChatPaneProps {
  onBackMobile?: () => void;
}

export function ChatPane({ onBackMobile }: ChatPaneProps) {
  const { user, isDemoMode } = useAuth();
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    typingUsers,
    onlineUserIds,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    setTyping,
  } = useChat();
  const { initiateCall } = useCall();
  const {
    isConnected: isVoiceConnected,
    joinVoiceRoom,
    remoteScreenSharer: voiceRemoteScreenSharer,
    setIsViewerOpen,
  } = useDiscordVoice();

  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessageState, setEditingMessageState] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isScreenShareOpen, setIsScreenShareOpen] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [remoteScreenSharer, setRemoteScreenSharer] = useState<{ userName: string } | null>(null);
  const [chatWallpaper, setChatWallpaper] = useState<string>('');

  // Voice message recording states
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved DIY wallpaper
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWp = localStorage.getItem('genzoku_chat_wallpaper') || '';
      setChatWallpaper(savedWp);
    }
  }, []);

  const handleSelectWallpaper = (wp: string) => {
    setChatWallpaper(wp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('genzoku_chat_wallpaper', wp);
    }
  };

  const handleSendGif = async (gifUrl: string) => {
    setIsEmojiPickerOpen(false);
    await sendMessage(gifUrl, 'image');
  };

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for peer screen share announcements
  useEffect(() => {
    if (!activeConversation) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel(`conversation_${activeConversation.id}`);
    channel.on('broadcast', { event: 'screenshare_status' }, ({ payload }) => {
      if (payload?.userId !== user?.id) {
        if (payload?.active) {
          setRemoteScreenSharer({ userName: payload.userName || 'Contact' });
        } else {
          setRemoteScreenSharer(null);
        }
      }
    });
  }, [activeConversation?.id, user?.id]);

  // Clean typing status on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      setTyping(false);
      cancelVoiceRecording();
    };
  }, [activeConversation?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    setTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    if (editingMessageState) {
      await editMessage(editingMessageState.id, inputText.trim());
      setEditingMessageState(null);
      setInputText('');
      return;
    }

    const content = inputText.trim();
    const replyId = replyingTo?.id || null;
    const pendingAttachments = [...attachments];

    setInputText('');
    setReplyingTo(null);
    setAttachments([]);
    setTyping(false);

    let msgType: 'text' | 'image' | 'video' | 'audio' | 'document' = 'text';
    if (pendingAttachments.length > 0) {
      const mime = pendingAttachments[0].mime_type;
      if (mime.startsWith('image/')) msgType = 'image';
      else if (mime.startsWith('video/')) msgType = 'video';
      else if (mime.startsWith('audio/')) msgType = 'audio';
      else msgType = 'document';
    }

    const effectiveContent = content || (pendingAttachments[0]?.file_url ?? '');
    await sendMessage(effectiveContent, msgType, replyId, pendingAttachments, replyingTo);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        // Client-side image compression: max 1200px width/height and JPEG 0.78 compression
        // Ensures broadcast payload (<256KB) and Supabase DB insert complete in <30ms
        try {
          const compressedDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (typeof ev.target?.result !== 'string') return resolve('');
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;

                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const compressed = canvas.toDataURL('image/jpeg', 0.78);
                  resolve(compressed);
                } else {
                  resolve(ev.target?.result as string);
                }
              };
              img.onerror = () => resolve(ev.target?.result as string);
              img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
          });

          if (compressedDataUrl) {
            setAttachments((prev) => [
              ...prev,
              {
                id: `att-${Date.now()}-${Math.random()}`,
                file_name: file.name,
                file_size: Math.round((compressedDataUrl.length * 3) / 4),
                mime_type: 'image/jpeg',
                file_url: compressedDataUrl,
              },
            ]);
          }
        } catch (err) {
          console.warn('Image compression fallback:', err);
        }
      } else {
        // Video, Audio, Document attachments
        if (file.size > 25 * 1024 * 1024) {
          alert(`File "${file.name}" exceeds 25MB limit.`);
          continue;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            const newAttachment: Attachment = {
              id: `att-${Date.now()}-${Math.random()}`,
              file_name: file.name,
              file_size: file.size,
              mime_type: file.type || 'application/octet-stream',
              file_url: event.target.result,
            };
            setAttachments((prev) => [...prev, newAttachment]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Voice Note Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('[GENZOKU] Mic access denied:', err);
      alert('Microphone permission is required to record voice notes.');
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  const sendVoiceRecording = () => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (typeof event.target?.result === 'string') {
          const audioDataUrl = event.target.result;
          const voiceAttachment: Attachment = {
            id: `att-voice-${Date.now()}`,
            file_name: `voice-note-${Date.now()}.webm`,
            file_size: audioBlob.size,
            mime_type: 'audio/webm',
            file_url: audioDataUrl,
          };
          await sendMessage(audioDataUrl, 'audio', null, [voiceAttachment]);
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.stream.getTracks().forEach((track) => track.stop());
    recorder.stop();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setRecordingDuration(0);
  };

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!activeConversation) {
    return (
      <main className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center mb-4">
          <RenkeiLogo size={48} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
          Welcome to {BRANDING.appName}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {BRANDING.tagline} — Select a conversation to start chatting, join the Voice Lounge, or share your screen.
        </p>
      </main>
    );
  }

  const isDirect = activeConversation.type === 'direct';
  const title = isDirect ? activeConversation.other_user?.display_name : activeConversation.name;
  const avatar = isDirect ? activeConversation.other_user?.avatar_url : activeConversation.avatar_url;
  const isOnline = isDirect
    ? (activeConversation.other_user?.id ? onlineUserIds.has(activeConversation.other_user.id) : false) || Boolean(activeConversation.other_user?.is_online)
    : undefined;

  const activeTyping = typingUsers[activeConversation.id] || [];

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50/60 dark:bg-slate-950 overflow-hidden relative">
      {/* DIY Theme & Wallpaper Modal */}
      <ThemeWallpaperModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentWallpaper={chatWallpaper}
        onSelectWallpaper={handleSelectWallpaper}
      />

      {/* Group Info & Member Management Modal */}
      {!isDirect && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={activeConversation}
        />
      )}

      {/* Top Header */}
      <header className="h-16 px-3 sm:px-4 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shrink-0 select-none z-10">
        <div
          className={`flex items-center gap-2 sm:gap-3 min-w-0 ${!isDirect ? 'cursor-pointer hover:opacity-90' : ''}`}
          onClick={!isDirect ? () => setIsGroupInfoOpen(true) : undefined}
          title={!isDirect ? 'Tap to view Group Info & Members' : undefined}
        >
          {onBackMobile && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBackMobile();
              }}
              className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <Avatar src={avatar} name={title} size="md" isOnline={isOnline} />

          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[130px] sm:max-w-xs">
                {title}
              </h3>
              {isDirect && (activeConversation.other_user?.is_demo || isDemoMode) && (
                <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase shrink-0">
                  DEMO
                </span>
              )}
            </div>
            {isDirect ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      Online
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    {formatLastSeen(activeConversation.other_user?.last_seen_at)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-brand-500 transition-colors">
                <span>{activeConversation.members?.length || 0} members</span>
                <span className="text-[10px] text-brand-500 font-semibold">• Tap for Info</span>
              </div>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Direct 1-on-1 Call Buttons (Voice & Video) */}
          {isDirect && activeConversation.other_user && (
            <>
              <button
                type="button"
                onClick={() => initiateCall(activeConversation.other_user!, 'audio')}
                className="p-2 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => initiateCall(activeConversation.other_user!, 'video')}
                className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors cursor-pointer"
                title="Start Video Call"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </>
          )}

          {/* Group Info Action Button */}
          {!isDirect && (
            <button
              type="button"
              onClick={() => setIsGroupInfoOpen(true)}
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Group Info & Members"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Quick Voice Lounge Button */}
          <button
            type="button"
            onClick={() => (isVoiceConnected ? undefined : joinVoiceRoom(title ? `Chat / ${title}` : undefined))}
            className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${
              isVoiceConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isVoiceConnected ? 'Connected to Voice Lounge' : 'Join Voice Room'}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="hidden sm:inline">{isVoiceConnected ? 'Connected' : 'Voice'}</span>
          </button>

          {/* DIY Wallpaper & Theme Button */}
          <button
            type="button"
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Chat Theme & Wallpaper"
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Screen Share Feature Button */}
          <button
            type="button"
            onClick={() => setIsScreenShareOpen(true)}
            className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Share Screen"
          >
            <ScreenShare className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Screen Share Modal */}
      <ScreenShareModal
        isOpen={isScreenShareOpen}
        onClose={() => setIsScreenShareOpen(false)}
        conversationId={activeConversation.id}
        partnerName={title || undefined}
      />

      {/* Voice Room Live Screen Stream Banner (allows receiver to watch live stream!) */}
      {voiceRemoteScreenSharer && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-brand-900/90 to-purple-900/90 border-b border-brand-500/40 flex items-center justify-between text-xs animate-in fade-in select-none z-10 shadow-md">
          <div className="flex items-center gap-2.5 text-white font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-bold">{voiceRemoteScreenSharer.userName}</span>
            <span className="text-slate-300">is streaming their screen live</span>
          </div>
          <button
            type="button"
            onClick={() => setIsViewerOpen(true)}
            className="px-3 py-1 bg-brand-500 hover:bg-brand-400 text-white font-bold rounded-lg shadow-sm text-xs cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
          >
            <ScreenShare className="w-3.5 h-3.5" />
            <span>Watch Stream</span>
          </button>
        </div>
      )}

      {/* Remote Peer Screen Sharing Notification Banner */}
      {remoteScreenSharer && !voiceRemoteScreenSharer && (
        <div className="px-4 py-2 bg-brand-500/15 border-b border-brand-500/30 flex items-center justify-between text-xs animate-in fade-in select-none z-10">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium">
            <ScreenShare className="w-4 h-4 animate-pulse" />
            <span>{remoteScreenSharer.userName} is currently sharing their screen</span>
          </div>
          <button
            type="button"
            onClick={() => setRemoteScreenSharer(null)}
            className="px-2 py-0.5 rounded-lg bg-black/20 hover:bg-black/30 text-slate-400 hover:text-white text-[11px] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Message Stream Area with DIY Wallpaper Support */}
      <div
        style={{
          background: chatWallpaper.startsWith('linear-gradient')
            ? chatWallpaper
            : undefined,
          backgroundImage:
            chatWallpaper && !chatWallpaper.startsWith('linear-gradient')
              ? `url(${chatWallpaper})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        className="flex-1 overflow-y-auto p-4 space-y-1 relative"
      >
        {/* Subtle dark backdrop if custom image wallpaper is active */}
        {chatWallpaper && !chatWallpaper.startsWith('linear-gradient') && (
          <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
        )}

        <div className="relative z-1">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-xs">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs text-center p-8 space-y-2 mt-20">
              <div className="p-3 bg-brand-500/10 rounded-2xl">
                <CheckCircle className="w-6 h-6 text-brand-500" />
              </div>
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                This is the start of your encrypted-transport conversation with {title}.
              </p>
              <p className="text-[11px]">Say hello to get things started!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                allMessages={messages}
                isGroup={activeConversation.type === 'group'}
                onReply={(m) => setReplyingTo(m)}
                onEdit={(m) => {
                  setEditingMessageState(m);
                  setInputText(m.content);
                }}
                onDelete={deleteMessage}
                onReact={addReaction}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator Bar */}
      {activeTyping.length > 0 && (
        <div className="px-6 py-1 text-[11px] text-brand-600 dark:text-brand-400 italic bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center gap-1.5 animate-pulse z-10">
          <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
          <span>{activeTyping.join(', ')} is typing...</span>
        </div>
      )}

      {/* Active Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs select-none z-10">
          <div className="border-l-2 border-brand-500 pl-2">
            <span className="font-semibold text-brand-600 dark:text-brand-400 text-[10px] block">
              Replying to {replyingTo.sender_id === user?.id ? 'yourself' : 'message'}
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-sm block text-[11px]">
              {replyingTo.content}
            </span>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Active Edit Banner */}
      {editingMessageState && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-900 flex items-center justify-between text-xs select-none z-10">
          <div className="border-l-2 border-amber-500 pl-2">
            <span className="font-semibold text-amber-700 dark:text-amber-300 text-[10px] block">
              Editing Message
            </span>
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-sm block text-[11px]">
              {editingMessageState.content}
            </span>
          </div>
          <button
            onClick={() => {
              setEditingMessageState(null);
              setInputText('');
            }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto z-10">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative p-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs"
            >
              <span className="truncate max-w-[120px] font-medium">{att.file_name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input Bar */}
      <footer className="relative p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800/80 shrink-0 z-20">
        {/* Floating WhatsApp-Style Emoji & GIF Picker Drawer */}
        <EmojiGifPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
          onSelectGif={handleSendGif}
        />

        {/* Live Voice Recording Overlay */}
        {isRecordingVoice ? (
          <div className="flex items-center justify-between gap-3 px-2 py-1 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                Recording {formatRecordingTime(recordingDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer"
                title="Cancel Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={sendVoiceRecording}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* File Attachment Button (Photos, Videos, Audios, Docs) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Attach photo, video or file"
            >
              <Paperclip className="w-5 h-5" />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,application/pdf,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
            </button>

            {/* Emoji & GIF Picker Toggle Button (WhatsApp Style) */}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isEmojiPickerOpen
                  ? 'text-brand-600 bg-brand-50 dark:bg-brand-950/40 dark:text-brand-400'
                  : 'text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Emoji & GIF"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text input */}
            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/60 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400 transition-all"
            />

            {/* Send or Voice Note Button */}
            {inputText.trim() || attachments.length > 0 ? (
              <button
                type="submit"
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-md transition-transform active:scale-95 cursor-pointer"
                title="Record Voice Note"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </footer>
    </main>
  );
}
