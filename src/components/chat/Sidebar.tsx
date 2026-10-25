'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/Avatar';
import { RenkeiLogo } from '@/components/ui/RenkeiLogo';
import { DiscordVoicePanel } from './DiscordVoicePanel';
import { formatRelativeDate } from '@/lib/utils';
import {
  Search,
  MessageSquarePlus,
  Users,
  Settings,
  Sparkles,
  Check,
  CheckCheck,
  Pin,
} from 'lucide-react';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenNewChat, onOpenNewGroup, onOpenSettings }: SidebarProps) {
  const { user, isDemoMode, switchDemoUser } = useAuth();
  const { conversations, activeConversation, setActiveConversationId, onlineUserIds } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'direct' | 'group'>('all');

  const filteredConversations = conversations.filter((c) => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    const title = c.type === 'direct' ? c.other_user?.display_name || '' : c.name || '';
    const username = c.type === 'direct' ? c.other_user?.username || '' : '';
    const q = searchQuery.toLowerCase().replace(/^@+/, '').trim();
    if (!q) return true;
    return title.toLowerCase().includes(q) || username.toLowerCase().includes(q);
  });

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 select-none">
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <RenkeiLogo size={36} showText textSize="md" />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenNewGroup}
            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="New Group"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info Bar & Search */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
            title="Edit Profile & Avatar"
          >
            <Avatar
              src={user?.avatar_url}
              name={user?.display_name}
              size="sm"
              isOnline={true}
            />
            <div className="leading-tight">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 block">
                {user?.display_name}
              </span>
              <span className="text-[10px] text-slate-400">@{user?.username}</span>
            </div>
          </div>
          {isDemoMode && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800">
              Demo Active
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700/50 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 pt-0.5">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              filterType === 'all'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('direct')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              filterType === 'direct'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              filterType === 'group'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <p>No conversations found.</p>
            <button
              onClick={onOpenNewChat}
              className="text-brand-600 dark:text-brand-400 font-semibold hover:underline"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isDirect = conv.type === 'direct';
            const title = isDirect ? conv.other_user?.display_name : conv.name;
            const avatar = isDirect ? conv.other_user?.avatar_url : conv.avatar_url;
            const isOnline = isDirect
              ? (conv.other_user?.id ? onlineUserIds.has(conv.other_user.id) : false) || Boolean(conv.other_user?.is_online)
              : undefined;
            const isSelected = activeConversation?.id === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors relative ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span
                    style={{ background: 'var(--brand-gradient, #4f46e5)' }}
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r-md shadow-sm"
                  />
                )}

                <Avatar src={avatar} name={title} size="md" isOnline={isOnline} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {title}
                      </h4>
                      {(isDirect && (conv.other_user?.is_demo || isDemoMode)) && (
                        <span className="px-1 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded text-[9px] font-extrabold uppercase shrink-0">
                          DEMO
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                      {formatRelativeDate(conv.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {conv.last_message ? conv.last_message.content : 'No messages yet'}
                    </p>
                    {conv.unread_count && conv.unread_count > 0 ? (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white shrink-0">
                        {conv.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Discord-Style Bottom Voice & User Control Panel */}
      <DiscordVoicePanel onOpenSettings={onOpenSettings} />

      {/* Demo Switcher Footer (Only shown when running in demo mode) */}
      {isDemoMode && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-semibold text-[11px] mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-500" /> Switch Demo Account:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              onClick={() => switchDemoUser('10000000-0000-4000-8000-000000000001')}
              className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-200 text-left truncate cursor-pointer font-medium"
            >
              👨‍💻 Kenji
            </button>
            <button
              onClick={() => switchDemoUser('20000000-0000-4000-8000-000000000002')}
              className="py-1 px-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-200 text-left truncate cursor-pointer font-medium"
            >
              🎨 Aoi
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
