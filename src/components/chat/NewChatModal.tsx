'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/Avatar';
import { X, Search, UserPlus, Shield, MessageSquare, AtSign, Sparkles } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { user } = useAuth();
  const { allUsers, searchUsers, createDirectChat, nicknames } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    const cleanQuery = q.trim().replace(/^@+/, '').toLowerCase();
    if (!cleanQuery) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // 1. Search locally in loaded users
    const localMatches = allUsers.filter(
      (u) =>
        u.id !== user?.id &&
        (u.username?.toLowerCase().includes(cleanQuery) ||
          u.display_name?.toLowerCase().includes(cleanQuery))
    );

    // 2. Also query server for exact username match
    try {
      const serverMatches = await searchUsers(cleanQuery);
      const combined = [...localMatches];
      serverMatches.forEach((s) => {
        if (s.id !== user?.id && !combined.some((m) => m.id === s.id)) {
          combined.push(s);
        }
      });
      setSearchResults(combined);
    } catch {
      setSearchResults(localMatches);
    }
    setIsSearching(false);
  };

  const handleSelectUser = async (targetUser: UserProfile) => {
    await createDirectChat(targetUser);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[520px]"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-500 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Private Username Search
              </h3>
              <p className="text-[10px] text-slate-400">Search exact @username to connect</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Type exact @username or friend's name..."
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* User Results List OR Privacy Screen */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {!searchQuery.trim() ? (
            /* Privacy Screen: Do NOT dump all usernames publicly */
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Shield className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Protected Username Privacy
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  To protect member privacy, users are not publicly browsable. Type a friend&apos;s
                  exact <span className="font-mono text-brand-500 font-bold">@username</span> above to find them!
                </p>
              </div>
            </div>
          ) : isSearching ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching directory...</div>
          ) : searchResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No user found matching &quot;{searchQuery}&quot;. Please check the spelling of the @username.
            </div>
          ) : (
            searchResults.map((u) => {
              const customNickname = nicknames[u.id];
              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-2xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.avatar_url} name={u.display_name} size="md" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {customNickname || u.display_name}
                        </h4>
                        {customNickname && (
                          <span className="text-[10px] text-purple-400 font-semibold">
                            ({u.display_name})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-brand-500 font-semibold block">
                        @{u.username}
                      </span>
                      {u.bio && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{u.bio}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
