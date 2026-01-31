import type { ReactNode } from 'react';
import { Calendar, Settings } from 'lucide-react';
import { LogoMark } from './LogoMark';

interface LayoutProps {
  children: ReactNode;
  currentDay: string;
  onLogoClick?: () => void;
  onOpenSettings?: () => void;
}

export function Layout({ children, currentDay, onLogoClick, onOpenSettings }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-gray-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {onLogoClick ? (
              <button
                type="button"
                onClick={onLogoClick}
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-french-blue focus:ring-offset-2 rounded"
                aria-label="Back to start"
              >
                <LogoMark size={32} className="shrink-0" />
                <h1 className="font-bold text-gray-800 tracking-tight">Fluide</h1>
              </button>
            ) : (
              <>
                <LogoMark size={32} className="shrink-0" />
                <h1 className="font-bold text-gray-800 tracking-tight">Fluide</h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-french-blue bg-blue-50 px-3 py-1 rounded-full">
              <Calendar size={14} />
              <span>{currentDay}</span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-2 text-gray-500 hover:text-french-blue transition-colors rounded-lg hover:bg-gray-100"
                aria-label="Settings"
              >
                <Settings size={18} />
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="w-full max-w-3xl px-4 py-6 flex-grow flex flex-col">
        {children}
      </main>
      <footer className="w-full py-6 text-center text-gray-400 text-sm">
        <p>Based on the method by Français avec Pierre</p>
      </footer>
    </div>
  );
}
