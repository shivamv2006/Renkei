'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageReaction } from '@/types';
import { useAuth } from '@/context/auth-context';
import { formatTime } from '@/lib/utils';
import {
  Check,
  CheckCheck,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  Smile,
  Copy,
  AlertCircle,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  allMessages?: Message[];
  isGroup?: boolean;
  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  allMessages,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const { user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMediaPreviewOpen, setIsMediaPreviewOpen] = useState(false);

  // Audio / Voice note playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState('0:00');
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isSelf = message.sender_id === user?.id;
  const isMentioned = Boolean(
    user?.username &&
    !isSelf &&
    message.content &&
    new RegExp(`@${user.username}\\b`, 'i').test(message.content)
  );

  // Resolve reply target message
  const replyTarget =
    message.reply_to_message ||
    (message.reply_to_id && allMessages ? allMessages.find((m) => m.id === message.reply_to_id) : undefined);

  const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];

  // Calculate read receipt status
  const isRead = message.receipts?.some((r) => r.status === 'read' && r.user_id !== user?.id);
  const isDelivered = message.receipts?.some((r) => r.status === 'delivered');

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setShowMenu(false);
  };

  // Group reactions: e.g. { '👍': { count: 2, userReacted: true } }
  const groupedReactions = (message.reactions || []).reduce<
    Record<string, { count: number; userReacted: boolean }>
  >((acc, rx) => {
    if (!acc[rx.emoji]) {
      acc[rx.emoji] = { count: 0, userReacted: false };
    }
    acc[rx.emoji].count += 1;
    if (rx.user_id === user?.id) {
      acc[rx.emoji].userReacted = true;
    }
    return acc;
  }, {});

  // Find voice / audio attachment or direct audio url
  const audioAttachment =
    message.attachments?.find((att) => att.mime_type.startsWith('audio/')) ||
    (message.message_type === 'audio' && message.attachments?.[0]) ||
    null;

  const isDirectAudio =
    message.message_type === 'audio' ||
    message.content?.startsWith('data:audio/') ||
    /^https?:\/\/.*\.(mp3|wav|ogg|webm|m4a)($|\?)/i.test(message.content?.trim() || '');

  const audioSource =
    audioAttachment?.file_url ||
    (isDirectAudio && message.content ? message.content.trim() : null);

  // Find video attachment or direct video url
  const videoAttachment =
    message.attachments?.find((att) => att.mime_type.startsWith('video/')) ||
    (message.message_type === 'video' && message.attachments?.[0]) ||
    null;

  const isDirectVideoUrl =
    message.message_type === 'video' ||
    message.content?.startsWith('data:video/') ||
    /^https?:\/\/.*\.(mp4|webm|mov|m4v)($|\?)/i.test(message.content?.trim() || '');

  const videoSource = videoAttachment?.file_url || (isDirectVideoUrl ? message.content.trim() : null);

  const isDirectImage =
    !isDirectAudio &&
    !isDirectVideoUrl &&
    (message.message_type === 'image' ||
      message.content?.startsWith('data:image/') ||
      /^https?:\/\/.*\.(gif|webp|png|jpe?g)($|\?)/i.test(message.content?.trim() || '') ||
      message.content?.includes('giphy.com') ||
      message.content?.includes('tenor.com'));

  // Audio Playback Controls
  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current
        .play()
        .then(() => setIsPlayingAudio(true))
        .catch((e) => console.warn('Audio play failed:', e));
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 1;
    setAudioProgress((cur / dur) * 100);

    const mins = Math.floor(cur / 60);
    const secs = Math.floor(cur % 60);
    setAudioDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  const toggleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex flex-col mb-2.5 transition-colors ${
        isSelf ? 'items-end' : 'items-start'
      }`}
    >
      {/* Senders name for group chat */}
      {!isSelf && isGroup && message.sender && (
        <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mb-1 ml-3">
          {message.sender.display_name}
        </span>
      )}

      <div className="relative max-w-[88%] sm:max-w-[70%]">
        <div
          onClick={() => {
            // Mobile-friendly tap to toggle options
            if (window.innerWidth < 768) {
              setShowEmojiPicker((prev) => !prev);
            }
          }}
          style={
            !message.send_failed && isSelf
              ? { background: 'var(--brand-gradient, linear-gradient(to top right, #4f46e5, #6366f1))' }
              : undefined
          }
          className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm shadow-xs transition-all select-text ${
            isMentioned ? 'ring-2 ring-amber-400 dark:ring-amber-400 shadow-md shadow-amber-500/20' : ''
          } ${
            message.send_failed
              ? 'bg-rose-600 text-white rounded-br-xs ring-2 ring-rose-300 dark:ring-rose-400'
              : isSelf
                ? 'text-white rounded-br-xs'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700/60 rounded-bl-xs'
          }`}
        >
          {/* Reply Quote Banner */}
          {replyTarget && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                const el = document.getElementById(`msg-${replyTarget.id}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className={`mb-2 px-2.5 py-1.5 rounded-lg border-l-2 text-xs select-none cursor-pointer transition-opacity hover:opacity-90 ${
                isSelf
                  ? 'bg-white/15 border-white text-white/90'
                  : 'bg-slate-100 dark:bg-slate-700/60 border-brand-500 text-slate-700 dark:text-slate-300'
              }`}
              title="Click to jump to quoted message"
            >
              <span className="font-bold text-[10px] block opacity-80">
                {replyTarget.sender_id === user?.id ? 'You' : replyTarget.sender?.display_name || 'Reply'}
              </span>
              <p className="truncate italic text-[11px]">{replyTarget.content}</p>
            </div>
          )}

          {/* 1. Voice Message Note Player */}
          {audioSource && (
            <div className="mb-2 min-w-[220px] sm:min-w-[260px] select-none">
              <audio
                ref={audioRef}
                src={audioSource}
                onTimeUpdate={handleAudioTimeUpdate}
                onEnded={handleAudioEnded}
                preload="metadata"
              />
              <div
                className={`p-2.5 rounded-xl flex items-center gap-3 ${
                  isSelf ? 'bg-black/15 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-900 dark:text-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayAudio();
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95 ${
                    isSelf ? 'bg-white text-brand-600' : 'bg-brand-600 text-white'
                  }`}
                  title={isPlayingAudio ? 'Pause Voice Message' : 'Play Voice Message'}
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  {/* Dynamic waveform visualizer lines */}
                  <div className="flex items-center gap-0.5 h-6">
                    {[40, 65, 30, 85, 45, 95, 35, 75, 55, 90, 45, 60, 30, 70, 85, 40].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}%` }}
                        className={`w-1 rounded-full transition-all ${
                          (i / 16) * 100 <= audioProgress
                            ? isSelf
                              ? 'bg-white'
                              : 'bg-brand-500'
                            : isSelf
                              ? 'bg-white/40'
                              : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-80 font-mono">
                    <span>{audioDuration}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSpeed();
                      }}
                      className="px-1.5 py-0.5 rounded bg-black/15 hover:bg-black/25 text-[10px] font-bold cursor-pointer"
                    >
                      {playbackRate}x
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Video Player */}
          {videoSource && (
            <div className="mb-2 rounded-xl overflow-hidden max-w-xs sm:max-w-sm bg-black/30">
              <video
                src={videoSource}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-72 object-contain rounded-xl"
              />
            </div>
          )}

          {/* 3. Non-Audio, Non-Video Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {message.attachments
                .filter(
                  (att) =>
                    !att.mime_type.startsWith('audio/') &&
                    !att.mime_type.startsWith('video/')
                )
                .map((att, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden border border-black/10">
                    {att.mime_type.startsWith('image/') ? (
                      <img
                        src={att.file_url}
                        alt={att.file_name}
                        className="max-h-60 w-full object-cover rounded-xl"
                      />
                    ) : (
                      <a
                        href={att.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-black/10 hover:bg-black/20 rounded-lg text-xs font-medium underline"
                      >
                        📎 {att.file_name}
                      </a>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* 4. Direct Animated GIF or Image */}
          {isDirectImage && !audioSource && !videoSource && (
            <div className="mb-1 rounded-xl overflow-hidden max-w-xs sm:max-w-sm">
              <img
                src={message.content.trim()}
                alt="Media"
                loading="lazy"
                className="w-full max-h-72 object-cover rounded-xl shadow-xs"
              />
            </div>
          )}

          {/* Text Content (if not redundant with standalone media) */}
          {message.content &&
            !isDirectImage &&
            !videoSource &&
            !audioSource &&
            !message.content.startsWith('data:') && (
              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {message.content.includes('@')
                  ? message.content.split(/(@[\w.-]+)/g).map((part, index) => {
                      if (part.startsWith('@')) {
                        const uname = part.slice(1).toLowerCase();
                        const isMentionMe = user?.username && uname === user.username.toLowerCase();
                        return (
                          <span
                            key={index}
                            className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md font-bold text-xs transition-colors ${
                              isMentionMe
                                ? 'bg-amber-400/30 text-amber-200 border border-amber-400/60 shadow-xs'
                                : 'bg-brand-500/25 text-brand-200 border border-brand-400/30'
                            }`}
                          >
                            {part}
                            {isMentionMe && (
                              <span className="text-[9px] ml-1 uppercase tracking-wider font-extrabold opacity-90">
                                you
                              </span>
                            )}
                          </span>
                        );
                      }
                      return part;
                    })
                  : message.content}
              </p>
            )}

          {/* Meta Bar: Time + Edited + Receipts */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
              isSelf ? 'text-brand-100' : 'text-slate-400'
            }`}
          >
            {message.is_edited && <span className="italic mr-0.5">edited</span>}
            <span>{formatTime(message.created_at)}</span>

            {isSelf && (
              <span className="ml-0.5 inline-flex items-center">
                {message.send_failed ? (
                  <span
                    className="flex items-center gap-1 text-rose-200 font-bold"
                    title="Failed to save message to server"
                  >
                    <AlertCircle className="w-3 h-3 text-rose-200" />
                    <span>Failed</span>
                  </span>
                ) : isRead ? (
                  <CheckCheck className="w-3.5 h-3.5 text-accent-300 stroke-[2.5]" />
                ) : isDelivered ? (
                  <CheckCheck className="w-3.5 h-3.5 opacity-80" />
                ) : (
                  <Check className="w-3.5 h-3.5 opacity-80" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Floating Bar (Desktop hover + Mobile touch) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 transition-opacity ${
            showMenu || showEmojiPicker ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${isSelf ? '-left-24' : '-right-24'}`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onReply?.(message);
            }}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmojiPicker(!showEmojiPicker);
            }}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
            title="React with Emoji"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95"
            title="More Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Emoji Reaction Bar Picker */}
        {showEmojiPicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute -top-10 left-0 z-30 flex items-center gap-1.5 p-1.5 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95"
          >
            {QUICK_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onReact?.(message.id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-135 transition-transform text-base px-1.5 py-0.5 cursor-pointer active:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Dropdown Action Menu */}
        {showMenu && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute top-full z-30 mt-1 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs text-slate-700 dark:text-slate-200"
          >
            <button
              type="button"
              onClick={() => {
                onReply?.(message);
                setShowMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <Reply className="w-3.5 h-3.5" /> Reply
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            {isSelf && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onEdit?.(message);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete?.(message.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Aggregated Reaction Badges (Click to toggle/react) */}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 px-1 select-none">
          {Object.entries(groupedReactions).map(([emoji, data]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact?.(message.id, emoji)}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border shadow-2xs transition-all active:scale-95 cursor-pointer ${
                data.userReacted
                  ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 border-brand-500/40 ring-1 ring-brand-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={`${data.count} reaction${data.count > 1 ? 's' : ''} (Click to toggle)`}
            >
              <span>{emoji}</span>
              <span className="font-semibold text-[10px]">{data.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
