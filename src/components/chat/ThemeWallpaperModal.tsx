'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Palette,
  Sparkles,
  Upload,
  Layout,
  MessageSquare,
  Zap,
  Sliders,
  Paintbrush,
  Copy,
} from 'lucide-react';

interface ThemeWallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWallpaper: string;
  onSelectWallpaper: (url: string) => void;
  currentAppGradient?: string;
  onSelectAppGradient?: (gradient: string) => void;
}

export function ThemeWallpaperModal({
  isOpen,
  onClose,
  currentWallpaper,
  onSelectWallpaper,
  currentAppGradient,
  onSelectAppGradient,
}: ThemeWallpaperModalProps) {
  const [activeTab, setActiveTab] = useState<'app_theme' | 'diy_color' | 'chat_wallpaper' | 'custom_image'>('app_theme');
  const [appGradient, setAppGradient] = useState<string>(
    currentAppGradient || 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)'
  );

  // DIY Custom Color Choice states (Renkei Ice Sapphire default)
  const [colorStart, setColorStart] = useState('#38bdf8');
  const [colorEnd, setColorEnd] = useState('#2563eb');
  const [gradientDirection, setGradientDirection] = useState<'135deg' | '90deg' | '180deg' | 'radial'>('135deg');
  const [customUrl, setCustomUrl] = useState('');
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('genzoku_app_gradient');
      if (saved) {
        setAppGradient(saved);
      }
      const savedStart = localStorage.getItem('genzoku_custom_color_start');
      const savedEnd = localStorage.getItem('genzoku_custom_color_end');
      if (savedStart) setColorStart(savedStart);
      if (savedEnd) setColorEnd(savedEnd);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate CSS string for the DIY gradient
  const computeCustomGradient = () => {
    if (gradientDirection === 'radial') {
      return `radial-gradient(circle at center, ${colorStart} 0%, ${colorEnd} 100%)`;
    }
    return `linear-gradient(${gradientDirection}, ${colorStart} 0%, ${colorEnd} 100%)`;
  };

  const currentComputedGradient = computeCustomGradient();

  // Curated Renkei Official & Signature Themes
  const APP_GRADIENTS = [
    {
      name: '04. Ice Sapphire (Official)',
      value: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
      primary: '#38bdf8',
      description: 'Official Ice Blue & Royal Sapphire',
    },
    {
      name: '01. Original Cyber (Renkei)',
      value: 'linear-gradient(135deg, #00f0ff 0%, #c026d3 100%)',
      primary: '#00f0ff',
      description: 'Cyber Cyan & Electric Purple',
    },
    {
      name: '02. Sunset Amber (Renkei)',
      value: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      primary: '#f59e0b',
      description: 'Warm Amber & Sunset Orange glow',
    },
    {
      name: '03. Electric Mint (Renkei)',
      value: 'linear-gradient(135deg, #84cc16 0%, #14b8a6 100%)',
      primary: '#84cc16',
      description: 'Lime Green & Mint Teal energy',
    },
    {
      name: 'Royal Violet',
      value: 'linear-gradient(135deg, #9333ea 0%, #c026d3 100%)',
      primary: '#a855f7',
      description: 'Deep royal purple & fuchsia magenta',
    },
    {
      name: 'Midnight Stealth',
      value: 'linear-gradient(135deg, #334155 0%, #090d16 100%)',
      primary: '#64748b',
      description: 'Subtle slate & deep matte obsidian',
    },
    {
      name: 'WhatsApp Emerald',
      value: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
      primary: '#10b981',
      description: 'Modern messaging emerald & teal',
    },
    {
      name: 'Sunset Rose',
      value: 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)',
      primary: '#f43f5e',
      description: 'Vibrant crimson & warm golden amber',
    },
  ];

  // Curated Chat Wallpaper Background Gradients
  const CHAT_WALLPAPER_GRADIENTS = [
    { name: 'Renkei Deep Navy', value: 'linear-gradient(to bottom, #0e1322, #050811)' },
    { name: 'Renkei Cyber Dark', value: 'linear-gradient(to bottom, #090d16, #020617)' },
    { name: 'Dark Slate', value: 'linear-gradient(to bottom, #0f172a, #020617)' },
    { name: 'Midnight Blue', value: 'linear-gradient(to bottom, #030712, #0c1527)' },
    { name: 'Deep Violet', value: 'linear-gradient(to bottom, #130a24, #080312)' },
    { name: 'Rose Sunset', value: 'linear-gradient(to bottom, #210a14, #0d0307)' },
    { name: 'Emerald Forest', value: 'linear-gradient(to bottom, #041a12, #020a06)' },
    { name: 'Pure Obsidian', value: 'linear-gradient(to bottom, #000000, #0a0a0a)' },
  ];

  const PRESET_WALLPAPER_IMAGES = [
    {
      name: 'Default Clean',
      value: '',
      preview: 'bg-slate-900',
    },
    {
      name: 'WhatsApp Dark Pattern',
      value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60',
    },
    {
      name: 'Cyberpunk Neon City',
      value: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop&q=60',
    },
    {
      name: 'Midnight Deep Nebula',
      value: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=800&auto=format&fit=crop&q=60',
    },
    {
      name: 'Minimalist Sunset',
      value: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=60',
    },
    {
      name: 'Forest Mist Aura',
      value: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=60',
    },
  ];

  // Quick Swatches for DIY Color Choice
  const DIY_SWATCHES = [
    { start: '#6366f1', end: '#ec4899', name: 'Cyber Pink' },
    { start: '#06b6d4', end: '#3b82f6', name: 'Electric Cyan' },
    { start: '#10b981', end: '#047857', name: 'Emerald Wave' },
    { start: '#f59e0b', end: '#ef4444', name: 'Fire Amber' },
    { start: '#8b5cf6', end: '#6366f1', name: 'Deep Ultraviolet' },
    { start: '#14b8a6', end: '#065f46', name: 'Aqua Teal' },
    { start: '#f43f5e', end: '#881337', name: 'Ruby Glow' },
    { start: '#38bdf8', end: '#a855f7', name: 'Cotton Candy' },
  ];

  const handleApplyAppGradient = (gradValue: string, primaryColor: string) => {
    setAppGradient(gradValue);
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--brand-gradient', gradValue);
      document.documentElement.style.setProperty('--brand-primary', primaryColor);
      localStorage.setItem('genzoku_app_gradient', gradValue);
      localStorage.setItem('genzoku_app_primary', primaryColor);
      localStorage.setItem('genzoku_custom_color_start', colorStart);
      localStorage.setItem('genzoku_custom_color_end', colorEnd);
    }
    if (onSelectAppGradient) {
      onSelectAppGradient(gradValue);
    }
    showToast('Applied to App Theme!');
  };

  const handleApplyChatWallpaper = (gradValue: string) => {
    onSelectWallpaper(gradValue);
    showToast('Applied to Chat Wallpaper!');
  };

  const handleSyncBoth = (gradValue: string, primaryColor: string) => {
    handleApplyAppGradient(gradValue, primaryColor);
    handleApplyChatWallpaper(gradValue);
    showToast('Applied to Both App & Chat!');
  };

  const showToast = (msg: string) => {
    setSavedSuccessMsg(msg);
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onSelectWallpaper(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      onSelectWallpaper(customUrl.trim());
      setCustomUrl('');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90dvh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>DIY Theme & Color Choice</span>
                {savedSuccessMsg && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-in fade-in">
                    {savedSuccessMsg}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose custom colors or presets for App & Chat individually
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close Theme"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold bg-slate-50/50 dark:bg-slate-950/30 overflow-x-auto no-scrollbar">
          {/* TAB 0: DIY Color Choice (User's main request) */}
          <button
            onClick={() => setActiveTab('diy_color')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'diy_color'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span>DIY Picker</span>
          </button>

          {/* TAB 1: App Gradient Presets */}
          <button
            onClick={() => setActiveTab('app_theme')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'app_theme'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>App Themes</span>
          </button>

          {/* TAB 2: Chat Wallpaper */}
          <button
            onClick={() => setActiveTab('chat_wallpaper')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'chat_wallpaper'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Wallpapers</span>
          </button>

          {/* TAB 3: Media Upload */}
          <button
            onClick={() => setActiveTab('custom_image')}
            className={`flex-1 py-3 px-3 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'custom_image'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 max-h-[calc(90dvh-130px)] overflow-y-auto space-y-4">
          {/* TAB 0: DIY CUSTOM COLOR PICKER (Option to choose custom colors) */}
          {activeTab === 'diy_color' && (
            <div className="space-y-4">
              {/* Interactive Live Gradient Preview Box */}
              <div
                className="w-full h-24 rounded-2xl p-3 flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 border border-white/10"
                style={{ background: currentComputedGradient }}
              >
                <div className="flex items-center justify-between text-white drop-shadow-md">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-black tracking-wide">CUSTOM GRADIENT PREVIEW</span>
                  </div>
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono uppercase">
                    {colorStart} → {colorEnd}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/95 drop-shadow-xs">
                    Live UI Preview • Active Bubble
                  </span>
                  <div className="px-2.5 py-1 rounded-xl bg-white text-slate-900 text-[10px] font-bold shadow-md">
                    Sample Button
                  </div>
                </div>
              </div>

              {/* Color Inputs Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Start Color */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    Start Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorStart}
                      onChange={(e) => setColorStart(e.target.value)}
                      className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={colorStart}
                      onChange={(e) => setColorStart(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>
                </div>

                {/* End Color */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                    End Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colorEnd}
                      onChange={(e) => setColorEnd(e.target.value)}
                      className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0 bg-transparent shrink-0"
                    />
                    <input
                      type="text"
                      value={colorEnd}
                      onChange={(e) => setColorEnd(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Angle / Direction */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Gradient Direction
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '135deg', label: 'Diagonal ↘' },
                    { id: '90deg', label: 'Horizontal →' },
                    { id: '180deg', label: 'Vertical ↓' },
                    { id: 'radial', label: 'Radial ◉' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => setGradientDirection(dir.id as any)}
                      className={`py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                        gradientDirection === dir.id
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Preset Palette Swatches */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Quick Palette Swatches
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DIY_SWATCHES.map((sw) => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => {
                        setColorStart(sw.start);
                        setColorEnd(sw.end);
                      }}
                      className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:scale-105 transition-transform flex items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800/80"
                      title={sw.name}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ background: `linear-gradient(135deg, ${sw.start}, ${sw.end})` }}
                      />
                      <span className="text-[9px] font-semibold truncate text-slate-700 dark:text-slate-300">
                        {sw.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Action Buttons (Individual or Together) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Choose Where to Apply:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {/* Button 1: App Theme */}
                  <button
                    type="button"
                    onClick={() => handleApplyAppGradient(currentComputedGradient, colorStart)}
                    className="py-2.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>App Theme</span>
                  </button>

                  {/* Button 2: Chat Wallpaper */}
                  <button
                    type="button"
                    onClick={() => handleApplyChatWallpaper(currentComputedGradient)}
                    className="py-2.5 px-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Wallpaper</span>
                  </button>

                  {/* Button 3: Both */}
                  <button
                    type="button"
                    onClick={() => handleSyncBoth(currentComputedGradient, colorStart)}
                    className="py-2.5 px-2 bg-gradient-to-r from-brand-600 to-pink-600 hover:from-brand-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Apply to Both</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: App Theme Color Gradients */}
          {activeTab === 'app_theme' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Select App Color Gradient
                </span>
                <span className="text-[10px] text-slate-400">
                  Affects bubbles, accents & sidebar
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {APP_GRADIENTS.map((grad) => {
                  const isSelected = appGradient === grad.value;
                  return (
                    <div
                      key={grad.name}
                      className={`relative rounded-2xl border-2 p-3 transition-all cursor-pointer flex flex-col justify-between overflow-hidden group ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                      onClick={() => handleApplyAppGradient(grad.value, grad.primary)}
                    >
                      <div
                        className="absolute inset-0 opacity-80 group-hover:opacity-95 transition-opacity"
                        style={{ background: grad.value }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      <div className="relative z-10 flex items-start justify-between">
                        <span className="text-xs font-bold text-white drop-shadow-xs">
                          {grad.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 flex items-center justify-between mt-4">
                        <span className="text-[10px] text-white/80 line-clamp-1">
                          {grad.description}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncBoth(grad.value, grad.primary);
                          }}
                          className="px-1.5 py-0.5 rounded-sm bg-white/20 hover:bg-white/30 text-white text-[9px] font-bold flex items-center gap-1 shrink-0"
                          title="Apply this gradient to both App & Chat Wallpaper"
                        >
                          <Zap className="w-2.5 h-2.5" /> Both
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Chat Wallpaper Color Gradients */}
          {activeTab === 'chat_wallpaper' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Chat Wallpaper Background
                </span>
                <span className="text-[10px] text-slate-400">
                  Individual chat stream wallpaper
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {CHAT_WALLPAPER_GRADIENTS.map((col) => {
                  const isSelected = currentWallpaper === col.value;
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => handleApplyChatWallpaper(col.value)}
                      style={{ background: col.value }}
                      className={`relative h-20 rounded-2xl border-2 text-left p-3 transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-md'
                          : 'border-slate-300 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-white drop-shadow-xs">
                          {col.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Color Gradient</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Custom Media & Photo Wallpapers */}
          {activeTab === 'custom_image' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-2">
                {PRESET_WALLPAPER_IMAGES.map((wp) => {
                  const isSelected = currentWallpaper === wp.value;
                  return (
                    <button
                      key={wp.name}
                      type="button"
                      onClick={() => handleApplyChatWallpaper(wp.value)}
                      className={`relative h-20 rounded-xl overflow-hidden border-2 text-left p-2 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-brand-500 ring-2 ring-brand-500/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {wp.value ? (
                        <img
                          src={wp.value}
                          alt={wp.name}
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-slate-900" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="relative z-10 h-full flex flex-col justify-between">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-brand-500 text-white flex items-center justify-center self-end">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div />
                        )}
                        <span className="text-[10px] font-bold text-white truncate">
                          {wp.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Upload Wallpaper Image from Device
                </label>
                <label className="w-full py-4 px-3 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                  <Upload className="w-5 h-5 text-brand-500" />
                  <span className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                    Browse photo or custom wallpaper
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Or Paste Image URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    disabled={!customUrl.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {currentWallpaper && (
                <button
                  type="button"
                  onClick={() => handleApplyChatWallpaper('')}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
                >
                  Reset Chat Wallpaper to Default
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
