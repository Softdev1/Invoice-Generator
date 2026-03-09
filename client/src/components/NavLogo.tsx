'use client';

export function NavLogo() {
  const handleClick = () => {
    window.location.href = '/create';
  };

  return (
    <button onClick={handleClick} className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
        <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <span className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
        Invoice Generator
      </span>
    </button>
  );
}
