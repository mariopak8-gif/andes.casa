export function NetworkSelector({ networks, selected, onSelect }: any) {
  return (
    <div className="w-full">
      <h4 className="font-medium mb-4 text-sm text-slate-500 uppercase tracking-wider pl-1">Select Network</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {networks.map((n: any) => (
          <button
            key={n.id}
            onClick={() => onSelect(n.id)}
            className={`relative overflow-hidden px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 group border
              ${
                selected === n.id
                  ? "bg-cyan-50 border-cyan-200 text-cyan-700 shadow-lg shadow-cyan-100/50"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 shadow-sm"
              }`}
          >
            {/* Active Indicator */}
            {selected === n.id && (
               <div className="absolute inset-y-0 left-0 w-1 bg-cyan-500 rounded-full"></div>
            )}
            
            <div className="flex items-center justify-between">
               <span>{n.label}</span>
               {selected === n.id && (
                  <svg className="w-4 h-4 text-cyan-600 animate-fade-in" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
               )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
