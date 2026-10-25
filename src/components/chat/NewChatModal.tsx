'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/Avatar';
import { X, Search, UserPlus, Info } from 'lucide-react';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewChatModal({ isOpen, onClose }: NewChatModalProps) {
  const { isDemoMode } = useAuth();
  const { allUsers, searchUsers, createDirectChat, onlineUserIds } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchUsers(q);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectUser = async (targetUser: UserProfile) => {
    await createDirectChat(targetUser);
    onClose();
  };

  const usersToDisplay = searchQuery.trim() ? searchResults : allUsers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[500px]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Start a Conversation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or @username..."
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`px-4 py-2 border-b flex items-center gap-2 text-[11px] ${
          isDemoMode
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
            : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
        }`}>
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            {isDemoMode
              ? 'Offline Demo Mode: Displaying mock sample accounts for evaluation.'
              : 'Live Directory: Showing registered GENZOKU accounts.'}
          </span>
        </div>

        {/* User Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {isSearching ? (
            <div className="p-6 text-center text-xs text-slate-400">Searching directory...</div>
          ) : usersToDisplay.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No users found.</div>
          ) : (
            usersToDisplay.map((u) => (
              <div
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar src={u.avatar_url} name={u.display_name} size="md" isOnline={onlineUserIds.has(u.id) || Boolean(u.is_online)} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {u.display_name}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                  </div>
                </div>

                {(isDemoMode || u.is_demo) && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 ml-2">
                    DEMO
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
