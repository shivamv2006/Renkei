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
import { SoundboardModal } from './SoundboardModal';
import { NicknameModal } from './NicknameModal';
import { NotificationCenterModal } from './NotificationCenterModal';
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
  Tag,
  Bell,
  AtSign,
  Sparkles,
  UserPlus,
  Users,
  Volume2,
  Lock,
  Shield,
  MessageSquare,
} from 'lucide-react';

interface ChatPaneProps {
  onBackMobile?: () => void;
  onOpenNewChat?: () => void;
  onOpenNewGroup?: () => void;
  onOpenSettings?: () => void;
}

export function ChatPane({
  onBackMobile,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
}: ChatPaneProps) {
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
    allUsers,
    nicknames,
    setFriendNickname,
    removeFriendNickname,
    notifications,
    dismissNotification,
    clearAllNotifications,
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
  const [isSoundboardModalOpen, setIsSoundboardModalOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showMentionMenu, setShowMentionMenu] = useState(false);

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

  // Handle typing indicator
  const handleTyping = () => {
    setTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  };

  // Handle text input with @mention trigger
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    handleTyping();

    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const textAfterAt = val.slice(lastAt + 1);
      if (!textAfterAt.includes(' ') && textAfterAt.length < 25) {
        setMentionQuery(textAfterAt.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  const insertMention = (targetUsername: string) => {
    const lastAt = inputText.lastIndexOf('@');
    if (lastAt === -1) return;
    const before = inputText.slice(0, lastAt);
    setInputText(`${before}@${targetUsername} `);
    setShowMentionMenu(false);
    setMentionQuery(null);
  };

  // Candidate users for @mention list
  const mentionCandidates = React.useMemo(() => {
    const q = mentionQuery?.toLowerCase() || '';
    let pool: { id: string; username: string; display_name: string; avatar_url?: string | null }[] = [];

    if (activeConversation?.type === 'group' && activeConversation.members) {
      pool = activeConversation.members
        .map((m) => m.profile)
        .filter(Boolean) as any[];
    } else if (activeConversation?.type === 'direct' && activeConversation.other_user) {
      pool = [activeConversation.other_user];
    } else {
      pool = allUsers;
    }

    if (!q) return pool.slice(0, 8);
    return pool
      .filter(
        (p) =>
          p.username?.toLowerCase().includes(q) ||
          p.display_name?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [mentionQuery, activeConversation, allUsers]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && attachments.length === 0) return;

    if (editingMessageState) {
      await editMessage(editingMessageState.id, inputText.trim());
      setEditingMessageState(null);
      setInputText('');
      return;
    }

    const contentToSend = inputText;
    const currentReply = replyingTo;
    const currentAttachments = [...attachments];

    // Clear input optimistically
    setInputText('');
    setReplyingTo(null);
    setAttachments([]);
    setTyping(false);
    setShowMentionMenu(false);

    let detectedType: any = 'text';
    if (currentAttachments.length > 0) {
      const mime = currentAttachments[0].mime_type || '';
      if (mime.startsWith('image/')) detectedType = 'image';
      else if (mime.startsWith('video/')) detectedType = 'video';
      else if (mime.startsWith('audio/')) detectedType = 'audio';
      else detectedType = 'document';
    }

    await sendMessage(
      contentToSend,
      detectedType,
      currentReply?.id || null,
      currentAttachments,
      currentReply
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 25MB.`);
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
      console.warn('[Renkei] Mic access denied:', err);
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
      cancelVoiceRecording();
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

  // REDESIGNED CYBERPUNK DASHBOARD WHEN NO CONVERSATION IS SELECTED
  if (!activeConversation) {
    return (
      <main className="flex-1 hidden md:flex flex-col items-center justify-center p-6 bg-[#08090d] text-center select-none overflow-y-auto relative">
        {/* Modals mountable from Dashboard */}
        <ThemeWallpaperModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          currentWallpaper={chatWallpaper}
          onSelectWallpaper={handleSelectWallpaper}
        />

        <SoundboardModal
          isOpen={isSoundboardModalOpen}
          onClose={() => setIsSoundboardModalOpen(false)}
        />

        <NotificationCenterModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
          notifications={notifications}
          onDismiss={dismissNotification}
          onClearAll={clearAllNotifications}
        />

        {/* Ambient cyberpunk glow spots in background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl w-full flex flex-col items-center">
          {/* Futuristic Logo & Status Badge */}
          <div className="mb-4">
            <RenkeiLogo size={64} variant="cyber" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>NEO-CYBER PROTOCOL ACTIVE</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-fuchsia-400">Renkei 2.0</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-8">
            {BRANDING.tagline} — High-fidelity P2P Voice Lounge, private @username link, custom friend nicknames, and 12-SFX soundboard.
          </p>

          {/* Quick Launch Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-6">
            <button
              type="button"
              onClick={onOpenNewChat}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-cyan-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-cyan-950/40"
            >
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <UserPlus className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-cyan-300">Private Chat</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Search @username</p>
            </button>

            <button
              type="button"
              onClick={onOpenNewGroup}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-purple-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-purple-950/40"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-purple-300">Clan & Group</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Admin roles & anime icon</p>
            </button>

            <button
              type="button"
              onClick={() => joinVoiceRoom()}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-emerald-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-emerald-950/40"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Radio className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-emerald-300">Voice Lounge</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">P2P Audio & Screen</p>
            </button>

            <button
              type="button"
              onClick={() => setIsSoundboardModalOpen(true)}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-amber-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-amber-950/40"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Volume2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-amber-300">Soundboard</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">12 SFX with volume slider</p>
            </button>

            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-pink-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-pink-950/40"
            >
              <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Palette className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-pink-300">Theme Studio</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Custom colors & wallpaper</p>
            </button>

            <button
              type="button"
              onClick={() => setIsNotifModalOpen(true)}
              className="p-4 rounded-2xl bg-[#11131a] hover:bg-[#181b24] border border-white/10 hover:border-indigo-500/40 text-left transition-all group cursor-pointer shadow-lg hover:shadow-indigo-950/40 relative"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                <Bell className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-slate-200 group-hover:text-indigo-300">Notifications</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">{notifications.length} alerts</p>
              {notifications.length > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Security and privacy pill */}
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" /> AES-256 Transport
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Private Username Shield
            </span>
          </div>
        </div>
      </main>
    );
  }

  const isDirect = activeConversation.type === 'direct';
  const customFriendNickname =
    isDirect && activeConversation.other_user ? nicknames[activeConversation.other_user.id] : undefined;

  const rawTitle = isDirect ? activeConversation.other_user?.display_name : activeConversation.name;
  const avatar = isDirect ? activeConversation.other_user?.avatar_url : activeConversation.avatar_url;
  const isOnline = isDirect
    ? (activeConversation.other_user?.id ? onlineUserIds.has(activeConversation.other_user.id) : false) || Boolean(activeConversation.other_user?.is_online)
    : undefined;

  const activeTyping = typingUsers[activeConversation.id] || [];

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0a0b0e] overflow-hidden relative">
      {/* DIY Theme & Wallpaper Modal */}
      <ThemeWallpaperModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentWallpaper={chatWallpaper}
        onSelectWallpaper={handleSelectWallpaper}
      />

      {/* Soundboard Modal */}
      <SoundboardModal
        isOpen={isSoundboardModalOpen}
        onClose={() => setIsSoundboardModalOpen(false)}
      />

      {/* Group Info & Member Management Modal */}
      {!isDirect && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={activeConversation}
        />
      )}

      {/* Friend Nickname Modal */}
      {isDirect && activeConversation.other_user && (
        <NicknameModal
          isOpen={isNicknameModalOpen}
          onClose={() => setIsNicknameModalOpen(false)}
          targetUser={activeConversation.other_user}
          currentNickname={customFriendNickname}
          onSave={(nick) => setFriendNickname(activeConversation.other_user!.id, nick)}
          onRemove={() => removeFriendNickname(activeConversation.other_user!.id)}
        />
      )}

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onDismiss={dismissNotification}
        onClearAll={clearAllNotifications}
      />

      {/* Top Header */}
      <header className="h-16 px-3 sm:px-4 flex items-center justify-between bg-[#11131a]/95 backdrop-blur-md border-b border-white/10 shrink-0 select-none z-10">
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
              className="md:hidden p-1.5 -ml-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <Avatar src={avatar} name={customFriendNickname || rawTitle} size="md" isOnline={isOnline} />

          <div className="leading-tight min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="font-bold text-sm text-white truncate max-w-[130px] sm:max-w-xs flex items-center gap-1.5">
                <span>{customFriendNickname || rawTitle}</span>
                {customFriendNickname && rawTitle && (
                  <span className="text-[10px] text-purple-400 font-semibold truncate">
                    ({rawTitle})
                  </span>
                )}
              </h3>
              {isDirect && (activeConversation.other_user?.is_demo || isDemoMode) && (
                <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase shrink-0">
                  DEMO
                </span>
              )}
            </div>
            {isDirect ? (
              <div className="flex items-center gap-1.5 mt-0.5">
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
                    <span className="text-[11px] font-medium text-emerald-400">
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
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors">
                <span>{activeConversation.members?.length || 0} members</span>
                <span className="text-[10px] text-cyan-400 font-semibold">• Tap for Info</span>
              </div>
            )}
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Direct Chat: Friend Nickname Tag Button */}
          {isDirect && activeConversation.other_user && (
            <button
              type="button"
              onClick={() => setIsNicknameModalOpen(true)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                customFriendNickname
                  ? 'text-purple-400 bg-purple-500/15 border border-purple-500/30'
                  : 'text-slate-400 hover:text-purple-400 hover:bg-white/5'
              }`}
              title={customFriendNickname ? `Nickname: ${customFriendNickname}` : 'Set Friend Nickname'}
            >
              <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Direct 1-on-1 Call Buttons (Voice & Video) */}
          {isDirect && activeConversation.other_user && (
            <>
              <button
                type="button"
                onClick={() => initiateCall(activeConversation.other_user!, 'audio')}
                className="p-2 text-slate-400 hover:text-emerald-400 rounded-xl hover:bg-emerald-950/30 transition-colors cursor-pointer"
                title="Start Voice Call"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => initiateCall(activeConversation.other_user!, 'video')}
                className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-cyan-950/30 transition-colors cursor-pointer"
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
              className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
              title="Group Info & Members"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Quick Voice Lounge Button */}
          <button
            type="button"
            onClick={() => (isVoiceConnected ? undefined : joinVoiceRoom(rawTitle ? `Chat / ${rawTitle}` : undefined))}
            className={`px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer ${
              isVoiceConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'
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
            className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Chat Theme & Wallpaper"
          >
            <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Notification Center Bell */}
          <button
            type="button"
            onClick={() => setIsNotifModalOpen(true)}
            className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer relative"
            title="Notification Center"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] animate-pulse" />
            )}
          </button>

          {/* Screen Share Feature Button */}
          <button
            type="button"
            onClick={() => setIsScreenShareOpen(true)}
            className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
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
        partnerName={rawTitle || undefined}
      />

      {/* Voice Room Live Screen Stream Banner */}
      {voiceRemoteScreenSharer && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/90 to-purple-950/90 border-b border-cyan-500/40 flex items-center justify-between text-xs animate-in fade-in select-none z-10 shadow-md">
          <div className="flex items-center gap-2.5 text-white font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>
              <strong>{voiceRemoteScreenSharer.userName}</strong> is sharing their screen in Voice Lounge!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsViewerOpen(true)}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ScreenShare className="w-3.5 h-3.5" />
            <span>Watch Stream</span>
          </button>
        </div>
      )}

      {/* Peer-to-Peer Remote Screen Broadcast Banner */}
      {remoteScreenSharer && (
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white flex items-center justify-between text-xs select-none z-10 shadow-md">
          <div className="flex items-center gap-2">
            <ScreenShare className="w-4 h-4 animate-bounce" />
            <span>
              <strong>{remoteScreenSharer.userName}</strong> is broadcasting their screen live.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsScreenShareOpen(true)}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
          >
            View Stream
          </button>
        </div>
      )}

      {/* Messages Scroll View */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 z-0"
        style={
          chatWallpaper
            ? {
                backgroundImage: `url(${chatWallpaper})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }
            : undefined
        }
      >
        {isLoadingMessages ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Loading encrypted messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-300">
              This is the start of your encrypted-transport conversation with {customFriendNickname || rawTitle}.
            </p>
            <p className="text-[11px] text-slate-500">Say hello to get things started!</p>
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
              onDelete={(id) => deleteMessage(id)}
              onReact={(id, emoji) => addReaction(id, emoji)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {activeTyping.length > 0 && (
        <div className="px-4 py-1.5 text-xs text-cyan-400 flex items-center gap-2 bg-[#0c0e14]/90 backdrop-blur-xs border-t border-white/5 select-none shrink-0">
          <span className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
          </span>
          <span className="text-[11px] font-medium">
            {activeTyping.join(', ')} {activeTyping.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-[#12141c] border-t border-white/10 flex items-center justify-between text-xs select-none z-10">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-1 h-8 rounded-full bg-cyan-500 shrink-0" />
            <div className="truncate">
              <span className="font-bold text-cyan-400 block text-[11px]">
                Replying to {replyingTo.sender?.display_name || 'Member'}
              </span>
              <span className="text-slate-400 text-[11px] truncate block">
                {replyingTo.content || 'Attachment'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-[#12141c] border-t border-white/10 flex gap-2 overflow-x-auto z-10">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="relative p-1.5 bg-[#181a24] rounded-xl border border-white/10 flex items-center gap-2 text-xs"
            >
              <span className="truncate max-w-[120px] font-medium text-slate-200">{att.file_name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-red-400 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input Bar */}
      <footer className="relative p-3 sm:p-4 bg-[#11131a] border-t border-white/10 shrink-0 z-20">
        {/* Floating WhatsApp-Style Emoji, GIF & Sticker Drawer */}
        <EmojiGifPicker
          isOpen={isEmojiPickerOpen}
          onClose={() => setIsEmojiPickerOpen(false)}
          onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
          onSelectGif={handleSendGif}
        />

        {/* Floating @Mention Auto-complete Popup */}
        {showMentionMenu && (
          <div className="absolute bottom-full left-4 mb-2 w-64 max-h-52 bg-[#141620] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-y-auto p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center gap-1.5">
              <AtSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mention Member</span>
            </div>
            {mentionCandidates.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-slate-500">No matching members</div>
            ) : (
              mentionCandidates.map((cand) => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => insertMention(cand.username)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-cyan-500/20 text-left transition-colors cursor-pointer group"
                >
                  <Avatar src={cand.avatar_url} name={cand.display_name} size="xs" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-cyan-300">
                      {cand.display_name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-semibold">@{cand.username}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Live Voice Recording Overlay */}
        {isRecordingVoice ? (
          <div className="flex items-center justify-between gap-3 px-3 py-1 bg-red-950/40 border border-red-500/40 rounded-2xl animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-xs font-bold text-red-400">
                Recording {formatRecordingTime(recordingDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={cancelVoiceRecording}
                className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-900/40 cursor-pointer"
                title="Cancel Recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={sendVoiceRecording}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Note</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* File Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-cyan-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
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

            {/* Emoji, GIF & Sticker Toggle */}
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isEmojiPickerOpen
                  ? 'text-cyan-400 bg-cyan-500/15'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
              }`}
              title="Emoji, GIF & Stickers"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Text Input with @mention support */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={
                  editingMessageState
                    ? 'Edit your message...'
                    : activeConversation.type === 'group'
                    ? 'Type a message or @ to mention members...'
                    : 'Type a message...'
                }
                value={inputText}
                onChange={handleInputChange}
                className="w-full bg-[#181a24] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
              />
            </div>

            {/* Mic / Send Button */}
            {!inputText.trim() && attachments.length === 0 ? (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md transition-all cursor-pointer active:scale-95"
                title="Hold or click to record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="p-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md transition-all cursor-pointer active:scale-95"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        )}
      </footer>
    </main>
  );
}
