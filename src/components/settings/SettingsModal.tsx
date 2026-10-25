'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Avatar } from '@/components/ui/Avatar';
import { changePasswordSchema } from '@/lib/validation';
import {
  X,
  User,
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
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, logout, updateProfile, updateUserPassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy'>('profile');

  // Profile Form States
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [statusText, setStatusText] = useState(user?.status_text || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [isSaved, setIsSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Cartoon style filter state for media uploads
  const [cartoonFilterActive, setCartoonFilterActive] = useState(true);
  const rawUploadedImgRef = React.useRef<HTMLImageElement | null>(null);

  // Keep state synchronized with current user whenever modal opens
  React.useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.display_name || '');
      setStatusText(user.status_text || '');
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
      avatar_url: avatarUrl,
    });

    if (res?.error) {
      setProfileError(res.error);
    } else {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in select-none">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[550px]">
        {/* Navigation Tabs */}
        <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-950 p-3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex md:flex-col justify-between">
          <div className="space-y-1 w-full flex md:flex-col overflow-x-auto md:overflow-visible">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" /> Profile
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === 'appearance'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4" /> Appearance
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
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
            className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 capitalize">
                {activeTab === 'privacy' ? 'Security & Account' : `${activeTab} Settings`}
              </h3>
              <button
                type="button"
                onClick={onClose}
                title="Close Settings"
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                {profileError && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Avatar src={avatarUrl || user?.avatar_url} name={displayName || user?.display_name} size="lg" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {displayName || user?.display_name}
                    </h4>
                    <p className="text-xs text-slate-400">@{user?.username}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 border border-brand-500/20 rounded-xl text-[11px] font-semibold cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload from Media</span>
                        <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                      </label>

                      {rawUploadedImgRef.current && (
                        <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-medium border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            onClick={() => toggleCartoonFilter(true)}
                            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                              cartoonFilterActive
                                ? 'bg-brand-600 text-white font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            ✨ Cartoon
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleCartoonFilter(false)}
                            className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                              !cartoonFilterActive
                                ? 'bg-brand-600 text-white font-bold'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            Original
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cartoon & Anime Avatar Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Choose Anime & Cartoon Avatar</span>
                    </label>
                    <span className="text-[10px] text-sky-400 font-bold">30 Official Renkei Avatars</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto p-1.5 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
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
                              : 'border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                          }`}
                        >
                          <img
                            src={p.url}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-full bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-105"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Status / About
                    </label>
                    <input
                      type="text"
                      value={statusText}
                      onChange={(e) => setStatusText(e.target.value)}
                      placeholder="e.g. Exploring GENZOKU network"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isSaved ? <Check className="w-4 h-4" /> : null}
                  {isSaved ? 'Changes Saved!' : 'Save Profile'}
                </button>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 dark:text-slate-400">
                  Select your interface theme preference for GENZOKU.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleToggleTheme('light')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="font-semibold">Light</span>
                  </button>

                  <button
                    onClick={() => handleToggleTheme('dark')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="font-semibold">Dark</span>
                  </button>

                  <button
                    onClick={() => handleToggleTheme('system')}
                    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                      theme === 'system'
                        ? 'border-brand-500 bg-brand-50/50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Laptop className="w-5 h-5" />
                    <span className="font-semibold">System</span>
                  </button>
                </div>
              </div>
            )}

            {/* Privacy & Security Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4 text-xs">
                {/* Change Password Card */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-brand-600" /> Change Password
                  </h4>

                  {passwordError && (
                    <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 text-[11px] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 text-[11px] flex items-center gap-1.5">
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
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
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
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Update Password</span>
                    </button>
                  </form>
                </div>

                {/* Delete Account */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Account Permanently
                    </button>
                  ) : (
                    <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5 text-red-700 dark:text-red-300 font-semibold text-xs">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        <span>Confirm Account Deletion</span>
                      </div>
                      <p className="text-[11px] text-red-600 dark:text-red-400">
                        Type <strong>delete</strong> below to permanently erase your profile and messages:
                      </p>
                      {deleteError && (
                        <p className="text-[11px] text-red-700 font-semibold">{deleteError}</p>
                      )}
                      <input
                        type="text"
                        placeholder="Type 'delete'"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-colors cursor-pointer font-medium"
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
