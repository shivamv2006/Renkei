'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatPane } from '@/components/chat/ChatPane';
import { NewChatModal } from '@/components/chat/NewChatModal';
import { NewGroupModal } from '@/components/chat/NewGroupModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { BRANDING } from '@/config/branding';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, isDemoMode } = useAuth();
  const { activeConversation, setActiveConversationId } = useChat();
  const router = useRouter();

  // Modal visibility states
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Redirect to login if unauthenticated after loading
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          Loading {BRANDING.appName}...
        </p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950">
      {/* Offline Demo Status Banner */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold">Demo Mode:</span>
            <span className="truncate">Supabase credentials are not configured in .env.local. Chats, auth, and WebRTC calls run as local simulations.</span>
          </div>
          <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 ml-2">
            Offline Sandbox
          </span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - always visible on desktop; on mobile visible when no conversation is selected */}
        <div
          className={`h-full ${
            activeConversation ? 'hidden md:flex' : 'flex w-full md:w-auto'
          }`}
        >
          <Sidebar
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        {/* Main Conversation Pane - on mobile visible when activeConversation is selected */}
        <div
          className={`h-full flex-1 ${
            !activeConversation ? 'hidden md:flex' : 'flex w-full'
          }`}
        >
          <ChatPane
            onBackMobile={() => setActiveConversationId(null)}
            onOpenNewChat={() => setIsNewChatOpen(true)}
            onOpenNewGroup={() => setIsNewGroupOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
