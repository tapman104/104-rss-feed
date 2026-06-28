import React, { useState, useRef } from "react";
import { Download, Upload, Trash2, LayoutGrid, LayoutList, RefreshCw, Type, Eye, Check, AlertTriangle, FileJson, Sparkles } from "lucide-react";
import { AppSettings, Feed, Category } from "../types";

interface SettingsPanelProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  feeds: Feed[];
  categories: Category[];
  readIds: string[];
  bookmarkIds: string[];
  onResetToDefaults: () => void;
  onImportData: (feeds: Feed[], settings: AppSettings, readIds: string[], bookmarkIds: string[]) => boolean;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  feeds,
  categories,
  readIds,
  bookmarkIds,
  onResetToDefaults,
  onImportData,
}: SettingsPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importErrorMsg, setImportErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout mode descriptor
  const getLayoutLabel = (mode: AppSettings["layoutMode"]) => {
    switch (mode) {
      case "grid":
        return "Bento Grid: Multi-column visually rich dashboard cards, optimal for magazine-style reading.";
      case "list":
        return "Detailed Stream: Expanded rows with large text snippets and summaries, great for thorough scrolling.";
      case "split":
        return "Split View: Compact rows on the left, full article reader on the right, perfect for ultra-fast browsing.";
    }
  };

  // Back up data to JSON and download
  const handleExport = () => {
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      feeds,
      settings,
      readIds,
      bookmarkIds,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material_rss_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Parse and validate backup file
  const validateAndProcessJSON = (text: string): boolean => {
    try {
      const data = JSON.parse(text);
      if (!data.feeds || !Array.isArray(data.feeds)) {
        throw new Error("Invalid format: Missing subscriptions database.");
      }
      
      const importedSettings: AppSettings = data.settings || {
        darkMode: false,
        autoRefreshMinutes: 15,
        fontSize: "base",
        fontSerif: false,
        layoutMode: "grid",
        showReadArticles: true,
      };

      const success = onImportData(
        data.feeds,
        importedSettings,
        data.readIds || [],
        data.bookmarkIds || []
      );

      if (success) {
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 5000);
        return true;
      } else {
        throw new Error("Failed to store database locally.");
      }
    } catch (err: any) {
      setImportStatus("error");
      setImportErrorMsg(err.message || "Invalid backup JSON schema.");
      setTimeout(() => setImportStatus("idle"), 8000);
      return false;
    }
  };

  // File Picker Trigger
  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        validateAndProcessJSON(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop support
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type !== "application/json" && !file.name.endsWith(".json")) {
        setImportStatus("error");
        setImportErrorMsg("Please upload a valid backup JSON file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          validateAndProcessJSON(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16" id="settings-panel-section">
      <div>
        <h2 className="font-sans font-extrabold text-2xl text-on-surface tracking-tight">
          Application Settings
        </h2>
        <p className="text-sm text-on-surface-variant font-medium">
          Personalize typography, adjust caching speeds, and backup reading progress databases.
        </p>
      </div>

      {/* Grid container for MD3 cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Visual Preferences */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Layout Mode */}
          <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <LayoutGrid size={16} />
              <span>Display Layout</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {(["grid", "list", "split"] as const).map((mode) => {
                const isActive = settings.layoutMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => onUpdateSettings({ ...settings, layoutMode: mode })}
                    className={`p-3 rounded-2xl border font-sans font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant/40"
                    }`}
                    id={`btn-setting-layout-${mode}`}
                  >
                    {mode === "grid" ? (
                      <LayoutGrid size={18} />
                    ) : mode === "list" ? (
                      <LayoutList size={18} />
                    ) : (
                      <LayoutList size={18} className="rotate-90" />
                    )}
                    <span className="capitalize">{mode}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-on-surface-variant/90 leading-relaxed font-medium">
              {getLayoutLabel(settings.layoutMode)}
            </p>
          </div>

          {/* Card: Typography Settings */}
          <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <Type size={16} />
              <span>Reader Typography</span>
            </h3>

            <div className="space-y-4">
              {/* Font style */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface font-sans">
                    Long-form Serif Font
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Display reading text in comfortable, editorial serif styles.
                  </p>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, fontSerif: !settings.fontSerif })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.fontSerif ? "bg-primary justify-end" : "bg-outline/50 justify-start"
                  }`}
                  id="setting-toggle-serif"
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>

              <div className="h-px bg-outline-variant/40" />

              {/* Font sizes */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface font-sans">Default Scale</p>
                  <p className="text-xs text-on-surface-variant">
                    Sets default font scale size for article readers.
                  </p>
                </div>
                <div className="flex bg-surface rounded-xl p-1 border border-outline-variant/60">
                  {(["sm", "base", "lg", "xl"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => onUpdateSettings({ ...settings, fontSize: sz })}
                      className={`px-2.5 py-1 text-xs rounded-lg font-bold font-mono transition-all ${
                        settings.fontSize === sz
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface-variant hover:bg-surface-variant/50"
                      }`}
                      id={`btn-setting-font-${sz}`}
                    >
                      {sz.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card: Caching & Feeds Preferences */}
          <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 space-y-4 text-left">
            <h3 className="text-sm font-extrabold text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <RefreshCw size={16} />
              <span>Feed & Caching Preferences</span>
            </h3>

            <div className="space-y-4">
              {/* Hide/Show read */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface font-sans">
                    Retain Read Articles
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Keep showing articles in Home feed even after opening them.
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({ ...settings, showReadArticles: !settings.showReadArticles })
                  }
                  className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${
                    settings.showReadArticles ? "bg-primary justify-end" : "bg-outline/50 justify-start"
                  }`}
                  id="setting-toggle-show-read"
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </button>
              </div>

              <div className="h-px bg-outline-variant/40" />

              {/* Refresh intervals */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-on-surface font-sans">
                    Automatic Sync Frequency
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Interval to contact server and query feed updates in background.
                  </p>
                </div>
                <select
                  value={settings.autoRefreshMinutes}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, autoRefreshMinutes: Number(e.target.value) })
                  }
                  className="px-3 py-2 bg-surface border border-outline rounded-xl text-xs font-semibold text-on-surface focus:outline-none"
                  id="setting-select-refresh"
                >
                  <option value={0}>Manual Refresh Only</option>
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Hourly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Database Backup, Imports & Resets */}
        <div className="space-y-6">
          {/* Card: Export and Backups */}
          <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 space-y-4 text-left flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-primary font-mono uppercase tracking-wider flex items-center gap-2 mb-3">
                <Download size={16} />
                <span>Backup Local Database</span>
              </h3>
              <p className="text-xs text-on-surface-variant/95 leading-relaxed font-medium">
                Export all custom feeds, assigned categories, bookmarks list, and read history into a local JSON backup file to migrate data or store safe.
              </p>
              
              <div className="mt-4 p-3 bg-surface rounded-2xl border border-outline-variant/50 space-y-1 text-xs">
                <p className="flex justify-between font-medium">
                  <span className="text-on-surface-variant">Feeds cataloged:</span>
                  <span className="font-mono text-on-surface font-bold">{feeds.length}</span>
                </p>
                <p className="flex justify-between font-medium">
                  <span className="text-on-surface-variant">Read history:</span>
                  <span className="font-mono text-on-surface font-bold">{readIds.length}</span>
                </p>
                <p className="flex justify-between font-medium">
                  <span className="text-on-surface-variant">Saved bookmarks:</span>
                  <span className="font-mono text-on-surface font-bold">{bookmarkIds.length}</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-container text-on-primary-container rounded-2xl font-sans font-bold text-xs hover:shadow-sm active:scale-95 transition-all"
              id="settings-export-button"
            >
              <Download size={15} />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          {/* Card: Import Database (with Drag-and-Drop Usability) */}
          <div className="bg-surface-container rounded-3xl p-5 border border-outline-variant/40 space-y-3 text-left">
            <h3 className="text-sm font-extrabold text-primary font-mono uppercase tracking-wider flex items-center gap-2">
              <Upload size={16} />
              <span>Import Database</span>
            </h3>

            {/* Drag & Drop Visual Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowseFiles}
              className={`p-5 rounded-2xl border border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-outline hover:border-primary hover:bg-surface-variant/30"
              }`}
              id="settings-import-dropzone"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
                id="settings-import-input"
              />
              <FileJson size={28} className="text-on-surface-variant/70" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-on-surface font-sans">Import Backup</p>
                <p className="text-[10px] text-on-surface-variant/80">
                  Drag & drop JSON file here, or click to browse files
                </p>
              </div>
            </div>

            {/* Import Status Indicator overlays */}
            {importStatus === "success" && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <Check size={14} className="shrink-0" />
                <span className="font-semibold">Backup imported successfully! Refreshed layout.</span>
              </div>
            )}

            {importStatus === "error" && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold">Import Failed</p>
                  <p className="opacity-90 font-medium">{importErrorMsg}</p>
                </div>
              </div>
            )}
          </div>

          {/* Card: Reset Application cache / factory defaults */}
          <div className="bg-surface-container-low rounded-3xl p-5 border border-outline-variant/30 space-y-3 text-left">
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono uppercase tracking-wider">
              Danger Zone
            </h3>
            <p className="text-[11px] text-on-surface-variant/95 leading-relaxed">
              Clear all customized settings, bookmarks, custom feeds, and cached files, resetting everything back to pristine factory defaults.
            </p>
            <button
              onClick={() => {
                if (window.confirm("Are you absolutely sure you want to clear your local database and restore default feeds? This action is irreversible.")) {
                  onResetToDefaults();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/25 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-2xl font-sans font-bold text-xs active:scale-95 transition-all"
              id="settings-reset-button"
            >
              <Trash2 size={14} />
              <span>Reset database & cache</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
