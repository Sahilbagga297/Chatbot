function IntelligenceData({ data }: { data: any }) {
  const sections = [
    { label: "Financial: UPI IDs", items: data?.upi_ids, color: "text-rose-400" },
    { label: "Account Strings", items: data?.bank_accounts, color: "text-emerald-400" },
    { label: "Malicious Vectors", items: data?.phishing_links, color: "text-amber-400" },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              {section.label}
            </span>
            <span className="text-[10px] text-slate-600">[{section.items?.length || 0}]</span>
          </div>
          <div className="min-h-[40px] bg-slate-950/50 rounded border border-slate-800/50 p-2">
            {section.items?.length > 0 ? (
              section.items.map((item: string, idx: number) => (
                <div key={idx} className={`text-xs font-mono break-all mb-1 ${section.color}`}>
                  {`> ${item}`}
                </div>
              ))
            ) : (
              <span className="text-[10px] italic text-slate-700">No data captured...</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}