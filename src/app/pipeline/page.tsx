'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useLeads } from '../../hooks/useLeads';

const COLUMNS = ['New', 'Evaluating', 'Pursuing', 'Rejected', 'Sold'];

export default function PipelineView() {
  const { leads, isLoading, saveLead, deleteLead } = useLeads();
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow the visual drag clone to render before adding dragging class
    setTimeout(() => {
      const el = document.getElementById(`lead-${id}`);
      if (el) el.classList.add('opacity-50');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(null);
    const el = document.getElementById(`lead-${id}`);
    if (el) el.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedLeadId) return;

    const lead = leads.find(l => l.id === draggedLeadId);
    if (lead && lead.status !== newStatus) {
      // Optimistic update handled intrinsically by useLeads refreshing, but trigger save:
      await saveLead(lead.property.id, newStatus, lead.notes);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col select-none overflow-hidden">
      <header className="h-12 bg-black/80 border-b border-brand-border flex items-center justify-between px-8 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 bg-brand-cyan animate-pulse shadow-[0_0_5px_#00f2ff]" />
          <h1 className="text-[12px] font-black uppercase tracking-[0.4em] text-white glow-cyan">Tactical Lead Pipeline</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/" className="btn-command border-0 text-[9px] hover:text-brand-cyan font-black">
            ← Command Map
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6 w-full flex flex-col min-h-0">
        <div className="mb-6 flex justify-between items-end shrink-0 px-2">
          <div>
            <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] glow-cyan">Active Intelligence Signals</span>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white mt-1">Satellite Board</h2>
          </div>
          <div className="text-right">
            <span className="label-command">Total Intercepts</span>
            <span className="text-xl font-mono text-brand-cyan">[{leads.length}]</span>
          </div>
        </div>

        {isLoading && leads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="w-6 h-6 border-2 border-brand-cyan border-t-transparent animate-spin rounded-full" />
            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Querying Lead Matrix...</span>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 px-2 items-start h-full">
            {COLUMNS.map(column => {
              const columnLeads = leads.filter(l => {
                const isPropertySold = l.property.status === 'sold';
                if (column === 'Sold') return l.status === 'Sold' || isPropertySold;
                return (l.status || 'New') === column && !isPropertySold;
              });

              return (
                <div
                  key={column}
                  className={`flex-1 min-w-[300px] max-w-[400px] flex flex-col max-h-full bg-black/20 border rounded-sm overflow-hidden ${column === 'Sold' ? 'border-red-500/30 bg-red-950/20' : 'border-brand-border/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column)}
                >
                  <div className={`p-3 border-b flex justify-between items-center shrink-0 ${column === 'Sold' ? 'border-red-500/30 bg-[#1a0f0f]' : 'border-brand-border/50 bg-[#111]'
                    }`}>
                    <h3 className={`text-[11px] font-black uppercase tracking-widest ${column === 'Sold' ? 'text-red-400' : 'text-gray-300'
                      }`}>
                      {column}
                    </h3>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${column === 'Sold' ? 'text-red-400 bg-red-400/10' : 'text-brand-cyan bg-brand-cyan/10'
                      }`}>
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                    {columnLeads.map(lead => (
                      <div
                        key={lead.id}
                        id={`lead-${lead.id}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={(e) => handleDragEnd(e, lead.id)}
                        className="panel-glass p-4 border border-brand-border hover:border-brand-cyan/40 hover:bg-[#1a1a1a] transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1 pr-2">
                            <h4 className="text-[11px] font-black uppercase tracking-tight text-gray-200 line-clamp-2 leading-tight">
                              {lead.property.title}
                            </h4>
                          </div>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="text-gray-600 hover:text-brand-red p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Purge Lead"
                          >
                            ×
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                          <div className="text-[10px] font-mono text-gray-500">
                            {lead.property.bedrooms ? `${lead.property.bedrooms} Bed` : lead.property.propertyType || "Property"}
                          </div>
                          <div className="text-[12px] font-black text-brand-cyan glow-cyan">
                            £{lead.property.price.toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2 w-full pt-3 border-t border-brand-border/30">
                          <Link
                            href={lead.property.url}
                            target="_blank"
                            className="flex-1 btn-command py-1 text-center text-[9px] bg-brand-cyan/5 border-brand-cyan/20 text-brand-cyan hover:bg-brand-cyan hover:text-black"
                          >
                            Source File
                          </Link>
                        </div>
                      </div>
                    ))}

                    {columnLeads.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-gray-800 rounded">
                        <span className="text-[9px] font-black tracking-widest uppercase text-gray-600">Drop Zone Secure</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
