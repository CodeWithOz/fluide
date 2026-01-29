import type { ReactNode } from 'react';
import { Calendar } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  currentDay: string;
}

export function Layout({ children, currentDay }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center">
      <header className="w-full bg-white border-b border-gray-200 shadow-xs sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-french-blue rounded-md flex items-center justify-center text-white font-bold">
              Fr
            </div>
            <h1 className="font-bold text-gray-800 tracking-tight">Fluide</h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-french-blue bg-blue-50 px-3 py-1 rounded-full">
            <Calendar size={14} />
            <span>{currentDay}</span>
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
