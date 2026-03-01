"use client";

import { useAppStore, Property } from '../store';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

const columnHelper = createColumnHelper<Property>();

export default function PropertyListView() {
  const visibleProperties = useAppStore((state) => state.visibleProperties);
  const selectedId = useAppStore((state) => state.selectedPropertyId);
  const setSelectedId = useAppStore((state) => state.setSelectedPropertyId);

  const minOccupancyFilter = useAppStore((state) => state.minOccupancyFilter);
  const setMinOccupancyFilter = useAppStore((state) => state.setMinOccupancyFilter);
  const minProfitFilter = useAppStore((state) => state.minProfitFilter);
  const setMinProfitFilter = useAppStore((state) => state.setMinProfitFilter);

  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'saProfit', desc: true }]);
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);

  const saveLead = async (propertyId: string) => {
    setSavingLeadId(propertyId);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          status: 'New',
          notes: 'Saved from Monitor View',
        }),
      });
      if (!res.ok) throw new Error('Failed to save lead');

      // Auto-navigate to Satellite Board
      router.push('/pipeline');
    } catch (err) {
      console.error(err);
    } finally {
      setSavingLeadId(null);
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor('source', {
      header: 'Source',
      cell: info => (
        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${info.getValue() === 'openrent' ? 'border-brand-cyan/40 text-brand-cyan bg-brand-cyan/10' :
          info.getValue() === 'zoopla' ? 'border-orange-500/40 text-orange-500 bg-orange-500/10' :
            'border-purple-500/40 text-purple-500 bg-purple-500/10'
          }`}>
          {info.getValue() || 'OpenRent'}
        </span>
      ),
    }),
    columnHelper.accessor('title', {
      header: 'Asset Identifier',
      cell: info => (
        <div>
          <div className="font-bold text-[10px] uppercase tracking-tight truncate max-w-[200px]" title={info.getValue()}>
            {info.getValue()}
          </div>
          <div className="text-[9px] font-mono text-gray-400 mt-0.5 glow-cyan">
            £{(info.row.original.price || 0).toLocaleString()} {info.row.original.tenure === 'sale' ? '' : 'pcm'}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('saProfit', {
      header: 'Yield PCM',
      cell: info => {
        const profit = info.getValue();
        if (profit === null || profit === undefined) {
          return (
            <div>
              <div className="font-mono text-[10px] font-bold text-gray-500">N/A</div>
              <div className="text-[8px] text-gray-600">Sale</div>
            </div>
          );
        }

        const isPositive = profit > 0;
        return (
          <div>
            <div className={`font-mono text-[10px] font-bold ${isPositive ? 'text-wm-green' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}£{profit.toLocaleString()}
            </div>
            <div className="text-[8px] text-gray-600">est/mo</div>
          </div>
        );
      },
    }),
    columnHelper.accessor('bedrooms', {
      header: 'Beds',
      cell: info => <div className="text-[10px] font-mono">{info.getValue() || '-'}</div>,
    }),
    columnHelper.accessor('occupancyRate', {
      header: 'Occ %',
      cell: info => {
        const occ = info.getValue();
        if (occ === null || occ === undefined) return <span className="text-gray-600 text-[10px]">-</span>;
        const color = occ >= 75 ? 'text-wm-green' : occ >= 50 ? 'text-amber-400' : 'text-red-400';
        return <div className={`text-[10px] font-mono font-bold ${color}`}>{occ}%</div>;
      },
    }),
    columnHelper.accessor('isArticle4', {
      header: 'Art 4',
      cell: info => (
        <span className={`text-[8px] font-black uppercase ${info.getValue() ? 'text-brand-red' : 'text-gray-600'}`}>
          {info.getValue() ? 'ALERT' : 'Safe'}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Cmd',
      cell: props => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            saveLead(props.row.original.id);
          }}
          disabled={savingLeadId === props.row.original.id}
          className="btn-command py-0.5 px-2 text-[8px]"
        >
          {savingLeadId === props.row.original.id ? '...' : 'Intrcpt'}
        </button>
      )
    })
  ], [savingLeadId]);

  const filteredData = useMemo(() => {
    return visibleProperties.filter(p => {
      if (minOccupancyFilter > 0 && (p.occupancyRate || 0) < minOccupancyFilter) return false;
      if (minProfitFilter > 0 && (p.saProfit || 0) < minProfitFilter) return false;
      return true;
    });
  }, [visibleProperties, minOccupancyFilter, minProfitFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (visibleProperties.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4 panel-glass">
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-600">No telemetry detected in sector</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full panel-glass border-b-0 overflow-hidden">
      <div className="p-3 border-b border-brand-border flex flex-col gap-3 bg-black/40">
        <div className="flex justify-between items-center">
          <h2 className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] glow-cyan">Sector Activity</h2>
          <span className="text-[8px] font-mono text-gray-500 uppercase">
            {filteredData.length} visible ({visibleProperties.length} total)
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-brand-surface z-10 border-b border-brand-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-4 py-2 text-[8px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-brand-cyan transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-brand-border">
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                onClick={() => setSelectedId(row.original.id)}
                className={`hover:bg-brand-cyan/5 cursor-pointer transition-colors ${selectedId === row.original.id ? 'bg-brand-cyan/10 border-l-2 border-brand-cyan' : 'border-l-2 border-transparent'}`}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
