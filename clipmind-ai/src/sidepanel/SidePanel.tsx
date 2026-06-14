import { useCallback, useEffect, useState } from 'react';
import type { Clip, ClipFilters, ClipStats } from '../types/clip';
import type { Project } from '../types/project';
import {
  deleteClip,
  deleteProject,
  getClipStats,
  getClips,
  getProjects,
  onStorageChange,
  saveProject,
  searchClips,
} from '../services/storageService';
import { CATEGORIES } from '../utils/category';
import { clipToMarkdown, clipsToJson, downloadFile } from '../utils/markdown';
import { SearchBar, FilterBar } from '../components/SearchBar';
import { StatsCards } from '../components/StatsCards';
import { ClipCard } from '../components/ClipCard';
import { ClipDetailModal } from '../components/ClipDetailModal';
import { ProjectSidebar, PROJECT_COLORS } from '../components/ProjectSidebar';
import { AskMemory } from '../components/AskMemory';
import { EmptyState } from '../components/EmptyState';
import { getSettings, saveSettings, onSettingsChange } from '../services/settingsService';
import { getSyncStatus, type SyncStatus } from '../services/syncService';
import '../styles/global.css';
import './sidepanel.css';

export function SidePanel() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ClipStats>({ total: 0, text: 0, image: 0, page: 0, categories: 0 });
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [activeProjectId, setActiveProjectId] = useState('all');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'clips' | 'ask'>('clips');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const loadData = useCallback(async () => {
    const filters: ClipFilters = {
      search: search || undefined,
      category: category !== 'all' ? category : undefined,
      type: type !== 'all' ? (type as Clip['type']) : undefined,
      projectId: activeProjectId !== 'all' ? activeProjectId : undefined,
      sort,
    };

    const [filtered, all, proj, clipStats] = await Promise.all([
      searchClips(filters),
      getClips(),
      getProjects(),
      getClipStats(),
    ]);

    setClips(filtered);
    setAllClips(all);
    setProjects(proj);
    setStats(clipStats);
  }, [search, category, type, sort, activeProjectId]);

  useEffect(() => {
    loadData();
    return onStorageChange(loadData);
  }, [loadData]);

  useEffect(() => {
    getSettings().then((s) => setDarkMode(s.darkMode));
    getSyncStatus().then(setSyncStatus);
    return onSettingsChange((s) => setDarkMode(s.darkMode));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await saveSettings({ darkMode: next });
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
  };

  const handleDelete = async (id: string) => {
    await deleteClip(id);
    if (selectedClip?.id === id) setSelectedClip(null);
    await loadData();
  };

  const handleCopy = async (clip: Clip) => {
    await navigator.clipboard.writeText(clipToMarkdown(clip));
  };

  const handleCreateProject = async (name: string) => {
    const color = PROJECT_COLORS[projects.length % PROJECT_COLORS.length];
    await saveProject({ name, color });
    await loadData();
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
    if (activeProjectId === id) setActiveProjectId('all');
    await loadData();
  };

  const handleExportJson = () => {
    downloadFile(clipsToJson(allClips), `clipmind-export-${Date.now()}.json`, 'application/json');
  };

  const handleSyncNow = async () => {
    await chrome.runtime.sendMessage({ type: 'SYNC_NOW' });
    const status = await getSyncStatus();
    setSyncStatus(status);
    await loadData();
  };

  const handleExportMarkdown = () => {
    const md = clips.map((c) => clipToMarkdown(c)).join('\n\n---\n\n');
    downloadFile(md, `clipmind-export-${Date.now()}.md`, 'text/markdown');
  };

  const handleClipUpdate = (clip: Clip) => {
    setSelectedClip(clip);
    loadData();
  };

  const usedCategories = [...new Set(allClips.map((c) => c.category))];
  const filterCategories = [...new Set([...CATEGORIES, ...usedCategories])];

  return (
    <div className="sidepanel">
      <header className="sidepanel__header">
        <div className="sidepanel__brand">
          <span className="sidepanel__logo">✦</span>
          <div>
            <h1>ClipMind AI</h1>
            <p>Your web memory dashboard</p>
          </div>
        </div>
        <div className="sidepanel__header-actions">
          <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={toggleDarkMode} title="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={openSettings} title="Settings">
            ⚙️
          </button>
          <button className="cm-btn cm-btn--sm" onClick={handleExportJson} title="Export all clips">
            ⬇ JSON
          </button>
          <button className="cm-btn cm-btn--sm" onClick={handleExportMarkdown} title="Export visible clips as Markdown" disabled={clips.length === 0}>
            ⬇ MD
          </button>
          {syncStatus?.enabled && (
            <button className="cm-btn cm-btn--sm cm-btn--ghost" onClick={handleSyncNow} title="Sync from cloud">
              🔄
            </button>
          )}
        </div>
      </header>

      <StatsCards stats={stats} />

      <div className="sidepanel__tabs">
        <button
          className={`sidepanel__tab ${activeTab === 'clips' ? 'sidepanel__tab--active' : ''}`}
          onClick={() => setActiveTab('clips')}
        >
          📚 My Clips
        </button>
        <button
          className={`sidepanel__tab ${activeTab === 'ask' ? 'sidepanel__tab--active' : ''}`}
          onClick={() => setActiveTab('ask')}
        >
          🧠 Ask Memory
        </button>
      </div>

      {activeTab === 'ask' ? (
        <AskMemory clips={allClips} />
      ) : (
        <div className="sidepanel__body">
          <ProjectSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            onSelect={setActiveProjectId}
            onCreate={handleCreateProject}
            onDelete={handleDeleteProject}
          />

          <main className="sidepanel__main">
            <SearchBar value={search} onChange={setSearch} />
            <FilterBar
              category={category}
              type={type}
              sort={sort}
              onCategoryChange={setCategory}
              onTypeChange={setType}
              onSortChange={(v) => setSort(v as 'newest' | 'oldest')}
              categories={filterCategories}
            />

            {clips.length === 0 ? (
              <EmptyState
                title={search ? 'No matching clips' : 'Start building your memory'}
                description={
                  search
                    ? 'Try different keywords or clear your filters.'
                    : 'Select text on any webpage, right-click images, or save pages to populate your dashboard.'
                }
              />
            ) : (
              <div className="sidepanel__clips cm-scrollbar">
                {clips.map((clip) => (
                  <ClipCard
                    key={clip.id}
                    clip={clip}
                    project={projects.find((p) => p.id === clip.projectId)}
                    onClick={setSelectedClip}
                    onDelete={handleDelete}
                    onCopy={handleCopy}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      <footer className="sidepanel__privacy">
        🔒 Your clips are saved locally in your browser. No account required for MVP. No data is sent anywhere.
      </footer>

      {selectedClip && (
        <ClipDetailModal
          clip={selectedClip}
          projects={projects}
          onClose={() => setSelectedClip(null)}
          onUpdate={handleClipUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
