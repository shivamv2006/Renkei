'use client';

import React from 'react';
import { InAppNotification } from '@/types';
import { X, Bell, Check, Tag, AtSign, Shield, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: InAppNotification[];
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  onDismiss,
  onClearAll,
}: NotificationCenterModalProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'nickname':
        return <Tag className="w-4 h-4 text-purple-400" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-amber-400" />;
      case 'username_request':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                    {notifications.length}
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400">Nicknames, mentions & claims</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
          {notifications.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p className="text-xs font-semibold">No notifications right now.</p>
              <p className="text-[10px] text-slate-500">
                You will be notified when someone gives you a nickname or mentions you!
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl transition-colors relative group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeDate(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    {notif.message}
                  </p>
                </div>
                <button
                  onClick={() => onDismiss(notif.id)}
                  className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition-opacity"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
