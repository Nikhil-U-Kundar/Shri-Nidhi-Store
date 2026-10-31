import React from 'react';
import { LayoutDashboard, ShoppingBasket, UserCheck, UserX, Code2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const TopControllerBar: React.FC = () => {
  const { viewMode, toggleViewMode, isLoggedIn, toggleAuthSimulation, setIsSeoModalOpen, user } = useApp();

  return (
    <aside
      aria-label="Prototype environment control"
      className="bg-stone-900 text-stone-200 text-xs px-4 py-2 border-b border-stone-800 sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 shadow-md"
    >
      <div className="flex items-center gap-2.5">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white tracking-wide">
          LIVE PROTOTYPE
        </span>
        <span className="text-stone-400 hidden sm:inline">Active Mode:</span>
        <span className="font-bold text-amber-300">
          {viewMode === 'admin'
            ? 'Store Owner / Admin Console'
            : isLoggedIn
            ? `Customer (${user.name})`
            : 'Customer (Guest Browsing)'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleAuthSimulation}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title={isLoggedIn ? 'Switch to Guest Mode' : 'Log in as Rahul'}
        >
          {isLoggedIn ? (
            <>
              <UserX className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Guest</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Simulate Login (Rahul)</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsSeoModalOpen(true)}
          className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-3 py-1.5 rounded-lg border border-stone-700 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Inspect Schema.org & SEO Architecture"
        >
          <Code2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">SEO / Schema</span>
        </button>

        <div className="h-4 w-px bg-stone-700 mx-0.5" />

        <button
          onClick={toggleViewMode}
          className={`font-semibold px-3 py-1.5 rounded-lg shadow transition flex items-center gap-1.5 text-xs cursor-pointer ${
            viewMode === 'admin'
              ? 'bg-amber-600 hover:bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {viewMode === 'admin' ? (
            <>
              <ShoppingBasket className="w-3.5 h-3.5" />
              <span>Return to Storefront</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Switch to Admin Panel</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
