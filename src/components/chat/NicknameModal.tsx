'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { X, Tag, Check, Trash2, Bell, Sparkles } from 'lucide-react';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: UserProfile;
  currentNickname?: string;
  onSave: (nickname: string) => void;
  onRemove: () => void;
}

export function NicknameModal({
  isOpen,
  onClose,
  targetUser,
  currentNickname = '',
  onSave,
  onRemove,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname);

  useEffect(() => {
    setNickname(currentNickname);
  }, [currentNickname, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onSave(nickname.trim());
      onClose();
    } else {
      onRemove();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Set Friend Nickname
              </h3>
              <p className="text-[10px] text-slate-400">Custom name for your friend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Avatar src={targetUser.avatar_url} name={targetUser.display_name} size="md" />
          <div className="min-w-0">
            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
              {targetUser.display_name}
            </h4>
            <span className="text-[10px] font-mono text-slate-400">@{targetUser.username}</span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Custom Nickname
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter nickname (e.g. Bestie, Shadow, Bro)"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={30}
                autoFocus
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-medium"
              />
              {nickname && (
                <button
                  type="button"
                  onClick={() => setNickname('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Privacy & Notification Badge */}
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 text-[11px] text-purple-700 dark:text-purple-300">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>Nickname Rules</span>
            </div>
            <ul className="list-disc list-inside text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
              <li>This nickname is displayed across chats, bubbles, and headers for you.</li>
              <li>Your friend will receive a real-time notification about the nickname you gave them.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {currentNickname && (
              <button
                type="button"
                onClick={() => {
                  onRemove();
                  onClose();
                }}
                className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Remove Nickname"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            <button
              type="submit"
              disabled={!nickname.trim() && !currentNickname}
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Save Nickname</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
