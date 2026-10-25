'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useChat } from '@/context/chat-context';
import { Avatar } from '@/components/ui/Avatar';
import { changePasswordSchema } from '@/lib/validation';
import {
  X,
  User,
  AtSign,
  Tag,
  Moon,
  Sun,
  Laptop,
  Lock,
  Trash2,
  LogOut,
  Check,
  Eye,
  EyeOff,
  Upload,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Ban,
  FileText,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, logout, updateProfile, updateUserPassword, deleteAccount } = useAuth();
  const {
    allUsers,
    conversations,
    nicknames,
    removeFriendNickname,
    usernameRequests,
    submitUsernameRequest,
    approveUsernameRequest,
    rejectUsernameRequest,
  } = useChat();

  const [activeTab, setActiveTab] = useState<'profile' | 'username' | 'nicknames' | 'appearance' | 'privacy'>('profile');

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [statusText, setStatusText] = useState(user?.status_text || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [isSaved, setIsSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Username Claim States
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{
    type: 'success' | 'warning' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Cartoon style filter state for media uploads
  const [cartoonFilterActive, setCartoonFilterActive] = useState(true);
  const rawUploadedImgRef = useRef<HTMLImageElement | null>(null);

  // Keep state synchronized with current user whenever modal opens
  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.display_name || '');
      setStatusText(user.status_text || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user, isOpen]);

  // Change Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 30 Curated Cartoon, Anime, and Cyber avatars (Official Renkei Collection)
  const RENKEI_ANIME_AVATARS = [
    { name: 'Aiko (Star Girl)', url: '/avatars/renkei_avatar_01.png' },
    { name: 'Shinji (Cyber Runner)', url: '/avatars/renkei_avatar_02.png' },
    { name: 'Lumina (Beats DJ)', url: '/avatars/renkei_avatar_03.png' },
    { name: 'Kael (Warm Sunshine)', url: '/avatars/renkei_avatar_04.png' },
    { name: 'Sora (Silver Frost)', url: '/avatars/renkei_avatar_05.png' },
    { name: 'Hinata (Spark Flare)', url: '/avatars/renkei_avatar_06.png' },
    { name: 'Yuki (Forest Beanie)', url: '/avatars/renkei_avatar_07.png' },
    { name: 'Riku (Cyborg Tech)', url: '/avatars/renkei_avatar_08.png' },
    { name: 'Neko (Cat Ears Gamer)', url: '/avatars/renkei_avatar_09.png' },
    { name: 'Miles (Urban Geek)', url: '/avatars/renkei_avatar_10.png' },
    { name: 'Maya (Peace & Glam)', url: '/avatars/renkei_avatar_11.png' },
    { name: 'Tariq (Smart Denim)', url: '/avatars/renkei_avatar_12.png' },
    { name: 'Kira (Neon Visor)', url: '/avatars/renkei_avatar_13.png' },
    { name: 'Viper (Prism Visor)', url: '/avatars/renkei_avatar_14.png' },
    { name: 'Mei (Violet Blossom)', url: '/avatars/renkei_avatar_15.png' },
    { name: 'Rei (Goth Buns)', url: '/avatars/renkei_avatar_16.png' },
    { name: 'Ren (Emerald Wildfire)', url: '/avatars/renkei_avatar_17.png' },
    { name: 'Hana (Pastel Cheer)', url: '/avatars/renkei_avatar_18.png' },
    { name: 'Leo (Cap Nomad)', url: '/avatars/renkei_avatar_19.png' },
    { name: 'Chloe (Neon Twintails)', url: '/avatars/renkei_avatar_20.png' },
    { name: 'Daiki (Fire Headset)', url: '/avatars/renkei_avatar_21.png' },
    { name: 'Kage (Monochrome Goth)', url: '/avatars/renkei_avatar_22.png' },
    { name: 'Zero (Holo Visor Pro)', url: '/avatars/renkei_avatar_23.png' },
    { name: 'Aoi (Cozy Glasses)', url: '/avatars/renkei_avatar_24.png' },
    { name: 'Jordan (Letterman Varsity)', url: '/avatars/renkei_avatar_25.png' },
    { name: 'Roxie (Bubblegum Peace)', url: '/avatars/renkei_avatar_26.png' },
    { name: 'Kenji (Tech Glasses)', url: '/avatars/renkei_avatar_27.png' },
    { name: 'Cynthia (Cyber Teal)', url: '/avatars/renkei_avatar_28.png' },
    { name: 'Tatsuya (Dread Band)', url: '/avatars/renkei_avatar_29.png' },
    { name: 'Kuro (Neko Hoodie)', url: '/avatars/renkei_avatar_30.png' },
  ];

  // Helper to process image with cel-shaded cartoon posterization
  const renderAvatarCanvas = (img: HTMLImageElement, applyCartoon: boolean) => {
    const canvas = document.createElement('canvas');
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    if (applyCartoon) {
      const imgData = ctx.getImageData(0, 0, size, size);
      const d = imgData.data;
      const stepSize = 48; // cel-shaded posterization steps

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i];
        let g = d[i + 1];
        let b = d[i + 2];

        // Color saturation & vibrancy boost
        const min = Math.min(r, g, b);
        r = Math.min(255, r + (r - min) * 0.35);
        g = Math.min(255, g + (g - min) * 0.35);
        b = Math.min(255, b + (b - min) * 0.35);

        // Discrete color quantization (cartoon cel-shading)
        r = Math.min(255, Math.floor(r / stepSize) * stepSize + stepSize * 0.5);
        g = Math.min(255, Math.floor(g / stepSize) * stepSize + stepSize * 0.5);
        b = Math.min(255, Math.floor(b / stepSize) * stepSize + stepSize * 0.5);

        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const compressed = canvas.toDataURL('image/jpeg', 0.88);
    setAvatarUrl(compressed);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        const img = new Image();
        img.onload = () => {
          rawUploadedImgRef.current = img;
          renderAvatarCanvas(img, cartoonFilterActive);
        };
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleCartoonFilter = (enable: boolean) => {
    setCartoonFilterActive(enable);
    if (rawUploadedImgRef.current) {
      renderAvatarCanvas(rawUploadedImgRef.current, enable);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError(null);
    if (!displayName.trim()) {
      setProfileError('Display name cannot be empty');
      return;
    }

    const res = await updateProfile({
      display_name: displayName.trim(),
      status_text: statusText.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
    });

    if (res?.error) {
      setProfileError(res.error);
    } else {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  // Handle Username Check & Claim or Owner Request
  const handleProcessUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsernameInput.trim()) return;

    setIsCheckingUsername(true);
    setUsernameStatus({ type: null, message: '' });

    const result = await submitUsernameRequest(newUsernameInput);
    setIsCheckingUsername(false);

    if (result.success) {
      if (result.requiresRequest) {
        setUsernameStatus({
          type: 'warning',
          message: result.message,
        });
      } else {
        setUsernameStatus({
          type: 'success',
          message: result.message,
        });
        setNewUsernameInput('');
      }
    } else {
      setUsernameStatus({
        type: 'error',
        message: result.message,
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    const validation = changePasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      setPasswordError(validation.error.errors[0]?.message || 'Invalid password input');
      return;
    }

    setIsChangingPassword(true);
    const res = await updateUserPassword(validation.data.newPassword);
    setIsChangingPassword(false);

    if (res.error) {
      setPasswordError(res.error);
    } else {
      setPasswordSuccess('Password successfully updated!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3500);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toLowerCase() !== 'delete') {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteAccount();
    setIsDeleting(false);

    if (res?.error) {
      setDeleteError(res.error);
    } else {
      onClose();
    }
  };

  const handleToggleTheme = (selectedTheme: 'light' | 'dark' | 'system') => {
    setTheme(selectedTheme);
    const root = document.documentElement;
    if (selectedTheme === 'dark') {
      root.classList.add('dark');
    } else if (selectedTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  // Find friend info for nicknames list
  const getFriendName = (userId: string) => {
    const friend = allUsers.find((u) => u.id === userId);
    if (friend) return friend.display_name || friend.username;
    // Check conversations
    for (const c of conversations) {
      if (c.type === 'direct' && c.other_user?.id === userId) {
        return c.other_user.display_name || c.other_user.username;
      }
    }
    return `User (${userId.slice(0, 6)})`;
  };

  // Requests submitted by current user
  const myRequests = usernameRequests.filter((r) => r.requester_id === user?.id);
  // All pending requests (for admin/owner review)
  const pendingRequests = usernameRequests.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in select-none">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[620px] max-h-[92vh]">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-52 bg-slate-950/80 p-3.5 border-b md:border-b-0 md:border-r border-slate-800 flex md:flex-col justify-between shrink-0">
          <div className="space-y-1 w-full flex md:flex-col overflow-x-auto md:overflow-visible">
            <div className="hidden md:block px-3 py-2 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                RENKEI CONFIG
              </span>
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <User className="w-4 h-4" /> Profile & Bio
            </button>

            <button
              onClick={() => setActiveTab('username')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'username'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <AtSign className="w-4 h-4" /> Username & Claims
              {pendingRequests.length > 0 && (
                <span className="ml-auto px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('nicknames')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'nicknames'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Tag className="w-4 h-4" /> Nicknames
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Moon className="w-4 h-4" /> Appearance
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Lock className="w-4 h-4" /> Security
            </button>
          </div>

          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto bg-slate-900/60">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 capitalize flex items-center gap-2">
                {activeTab === 'profile' && <><User className="w-4 h-4 text-cyan-400" /> Profile & Identity</>}
                {activeTab === 'username' && <><AtSign className="w-4 h-4 text-cyan-400" /> Username & Ownership Claims</>}
                {activeTab === 'nicknames' && <><Tag className="w-4 h-4 text-cyan-400" /> Friend Nicknames Management</>}
                {activeTab === 'appearance' && <><Moon className="w-4 h-4 text-cyan-400" /> Appearance & Theme</>}
                {activeTab === 'privacy' && <><Lock className="w-4 h-4 text-cyan-400" /> Security & Account</>}
              </h3>
              <button
                type="button"
                onClick={onClose}
                title="Close Settings"
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: Profile & Bio */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {profileError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <Avatar src={avatarUrl || user?.avatar_url} name={displayName || user?.display_name} size="lg" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-slate-100">
                      {displayName || user?.display_name}
                    </h4>
                    <p className="text-xs text-cyan-400 font-mono">@{user?.username}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom Media</span>
                        <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                      </label>

                      {rawUploadedImgRef.current && (
                        <div className="inline-flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg text-[10px] font-medium border border-slate-700">
                          <button
                            type="button"
                            onClick={() => toggleCartoonFilter(true)}
                            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                              cartoonFilterActive
                                ? 'bg-cyan-600 text-white font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ✨ Cartoon Filter
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCartoonFilter(false)}
                            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                              !cartoonFilterActive
                                ? 'bg-cyan-600 text-white font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Original
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 30 Anime & Cyber Avatars */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Choose Anime & Cartoon Avatar</span>
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono font-bold">30 Curated Avatars</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto p-2 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="grid grid-cols-6 gap-2">
                      {RENKEI_ANIME_AVATARS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(p.url)}
                          title={p.name}
                          className={`p-0.5 rounded-full border-2 transition-all cursor-pointer overflow-hidden group ${
                            avatarUrl === p.url
                              ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                              : 'border-slate-800 hover:border-cyan-500/50'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-full bg-slate-800 transition-transform group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      Status Mood
                    </label>
                    <input
                      type="text"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="e.g. Exploring RENKEI cyber lounge"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Bio Option */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-400" />
                        <span>About Me / Bio</span>
                      </label>
                      <span className="text-[10px] text-slate-500">{bio.length}/200</span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={200}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell the community about yourself, your interests, tech stack, or gaming clans..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none text-xs"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="mt-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : null}
                  {isSaved ? 'Profile Updated!' : 'Save Profile & Bio'}
                </button>
              </div>
            )}

            {/* TAB 2: Username & Claims */}
            {activeTab === 'username' && (
              <div className="space-y-4 text-xs">
                {/* Current Handle Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Your Current Handle</span>
                    <h4 className="text-base font-black text-cyan-400 font-mono">@{user?.username}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Active & Verified
                  </span>
                </div>

                {/* Change or Claim Form */}
                <form onSubmit={handleProcessUsername} className="p-4 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-200">Change or Claim Username</h4>
                      <p className="text-[11px] text-slate-400">
                        If available, it updates directly. If already reserved by someone else, an official ownership change request is submitted for Owner/Admin review.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">
                      New Username Handle
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-cyan-400 font-mono font-bold">@</span>
                      <input
                        type="text"
                        value={newUsernameInput}
                        onChange={(e) => setNewUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="new_handle"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-7 pr-3 py-2 text-slate-100 font-mono focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  {usernameStatus.message && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                        usernameStatus.type === 'success'
                          ? 'bg-emerald-950/40 border border-emerald-900 text-emerald-300'
                          : usernameStatus.type === 'warning'
                          ? 'bg-amber-950/40 border border-amber-900 text-amber-300'
                          : 'bg-rose-950/40 border border-rose-900 text-rose-300'
                      }`}
                    >
                      {usernameStatus.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <span>{usernameStatus.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isCheckingUsername || !newUsernameInput.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    {isCheckingUsername ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AtSign className="w-3.5 h-3.5" />}
                    <span>Check & Request Handle</span>
                  </button>
                </form>

                {/* Submitted Requests List */}
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>My Username Claims History</span>
                  </h5>

                  {myRequests.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                      You haven't submitted any handle claim requests yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {myRequests.map((req) => (
                        <div
                          key={req.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan-400">@{req.requested_username}</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(req.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Owner / Admin Review Section */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-300 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Owner / Admin Review Desk</span>
                    </h5>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {pendingRequests.length} pending
                    </span>
                  </div>

                  {pendingRequests.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                      No pending username requests awaiting review.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-200">@{req.requester_username}</span>
                              <span className="text-slate-500">wants to claim</span>
                              <span className="font-mono font-bold text-cyan-400">@{req.requested_username}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(req.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => approveUsernameRequest(req.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => rejectUsernameRequest(req.id)}
                              className="px-2.5 py-1 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Ban className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Friend Nicknames */}
            {activeTab === 'nicknames' && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-800/50 flex items-start gap-2.5">
                  <Tag className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-cyan-300">Private Custom Nicknames</h4>
                    <p className="text-[11px] text-cyan-200/80">
                      Nicknames you assign are visible only in your direct chats and sidebar. Your friend receives a real-time notification informing them of the nickname you chose for them!
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-slate-300 flex items-center justify-between">
                    <span>Active Nicknames</span>
                    <span className="text-[10px] font-mono text-cyan-400">{Object.keys(nicknames).length} Set</span>
                  </h5>

                  {Object.keys(nicknames).length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-slate-950/50 border border-slate-800 space-y-1">
                      <Tag className="w-8 h-8 text-slate-600 mx-auto mb-1" />
                      <p className="text-slate-300 font-semibold">No Friend Nicknames Set</p>
                      <p className="text-[11px] text-slate-500">
                        Open any direct conversation and click the Tag icon in the header to set a custom nickname.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(nicknames).map(([friendId, nick]) => (
                        <div
                          key={friendId}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                              {nick.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-100">{nick}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono">
                                  Nickname
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Real: {getFriendName(friendId)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFriendNickname(friendId)}
                            title="Remove Nickname"
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Appearance */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-400">
                  Select your interface theme preference for RENKEI.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleToggleTheme('dark')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-cyan-500 bg-slate-800 text-cyan-400 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold">Dark (Cyber)</span>
                  </button>

                  <button
                    onClick={() => handleToggleTheme('light')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-cyan-500 bg-slate-800 text-cyan-400 ring-2 ring-cyan-500/20'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-bold">Light</span>
                  </button>

                  <button
                    onClick={() => handleToggleTheme('system')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'system'
                        ? 'border-cyan-500 bg-slate-800 text-cyan-400 ring-2 ring-cyan-500/20'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Laptop className="w-5 h-5" />
                    <span className="font-bold">System</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: Privacy & Security */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs">
                {/* Change Password Card */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60">
                  <h4 className="font-semibold text-slate-100 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" /> Change Password
                  </h4>

                  {passwordError && (
                    <div className="mb-2 p-2 rounded-lg bg-rose-950/40 text-rose-400 text-[11px] flex items-center gap-1.5 border border-rose-900">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-2 p-2 rounded-lg bg-emerald-950/40 text-emerald-400 text-[11px] flex items-center gap-1.5 border border-emerald-900">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-2.5">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="New password (min 8 chars, 1 uppercase, 1 number)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-hidden focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    />

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Update Password</span>
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="pt-2 border-t border-slate-800">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-rose-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account Permanently
                    </button>
                  ) : (
                    <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        <span>Confirm Account Deletion</span>
                      </div>
                      <p className="text-[11px] text-rose-300">
                        Type <strong>delete</strong> below to permanently erase your profile and messages:
                      </p>
                      {deleteError && (
                        <p className="text-[11px] text-rose-400 font-semibold">{deleteError}</p>
                      )}
                      <input
                        type="text"
                        placeholder="Type 'delete'"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        className="w-full bg-slate-900 border border-rose-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          <span>Confirm Delete</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmationText('');
                            setDeleteError(null);
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors cursor-pointer font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
