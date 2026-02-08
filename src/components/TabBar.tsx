import {
  Dumbbell,
  Library as LibraryIcon,
  History as HistoryIcon,
} from 'lucide-react';

export type Tab = 'practice' | 'library' | 'history';

const TABS: { key: Tab; label: string; icon: typeof Dumbbell }[] = [
  { key: 'practice', label: 'Practice', icon: Dumbbell },
  { key: 'library', label: 'Chunk Library', icon: LibraryIcon },
  { key: 'history', label: 'History', icon: HistoryIcon },
];

export function TabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-6">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onTabChange(key)}
            className={`px-4 py-2 font-medium flex items-center gap-1 ${
              isActive
                ? 'text-french-blue border-b-2 border-french-blue'
                : 'text-gray-600 hover:text-french-blue'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        );
      })}
    </div>
  );
}
