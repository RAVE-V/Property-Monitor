import React, { useState, useMemo, useEffect } from 'react';
import { calculateROI, DEFAULT_ASSUMPTIONS } from '../../libs/shared/roi';
import { Property } from '../../libs/shared/types';
import { useLeads } from '../hooks/useLeads';

interface SidePanelProps {
  property: any; // Full GeoJSON properties object
  onClose: () => void;
}

// Build an Unsplash image URL based on property type
function getPropertyImageUrl(propertyType: string | null, title: string): string {
  const t = (propertyType || title || '').toLowerCase();
  let query = 'london,apartment,house';
  if (t.includes('flat') || t.includes('apartment')) query = 'london,apartment,interior';
  else if (t.includes('hmo') || t.includes('house') || t.includes('terrace')) query = 'london,house,property';
  else if (t.includes('room') || t.includes('studio')) query = 'london,studio,room,interior';
  else if (t.includes('maisonette')) query = 'london,maisonette,flat';
  // Use a stable seed based on the title for a consistent image per property
  const seed = (title || '').charCodeAt(0) + (title || '').charCodeAt(4);
  return `https://source.unsplash.com/seed/${seed}/600x240/?${query}`;
}

function SourceBadge({ source }: { source: string }) {
  const colours: Record<string, string> = {
    openrent: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    rightmove: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    zoopla: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    spareroom: 'bg-pink-500/20 text-pink-400 border-pink-500/40',
    otm: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  };
  const cls = colours[source?.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/40';
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 border uppercase tracking-widest ${cls}`}>
      {source || 'portal'}
    </span>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
      <span className={`font-mono text-base font-bold ${highlight ? 'text-brand-cyan glow-cyan' : 'text-gray-200'}`}>
        {value}
      </span>
    </div>
  );
}

const SidePanel: React.FC<SidePanelProps> = ({ property, onClose }) => {
  const { leads, saveLead, deleteLead, isLoading: leadsLoading, refreshLeads } = useLeads();

  const existingLead = useMemo(() => {
    return leads.find(l => l.propertyId === property.id);
  }, [leads, property.id]);

  const defaultIncome = useMemo(() => {
    // strict heuristic matching page.tsx: estIncome = Math.round(rent * 2.8)
    return Math.round((property.price || 0) * 2.8);
  }, [property.price]);

  const [income, setIncome] = useState<number>(defaultIncome);
  const [rent, setRent] = useState<number>(property.price || 0);
  const [bills, setBills] = useState<number>(Math.round((property.price || 0) * 0.15)); // Matches page.tsx
  const [fees, setFees] = useState<number>(10); // Matches page.tsx (10%)
  const [setup, setSetup] = useState<number>(DEFAULT_ASSUMPTIONS.setupCosts);
  const [useTOMS, setUseTOMS] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>(existingLead?.notes || '');
  const [imgError, setImgError] = useState(false);
  const [occupancy, setOccupancy] = useState<{ avgOccupancy: number | null; tier: string; tierColour: string; nearbyPoints: any[] } | null>(null);
  const [llmVerdict, setLlmVerdict] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  useEffect(() => {
    if (existingLead) setNotes(existingLead.notes || '');
  }, [existingLead]);

  // Reset state when property changes, and fetch occupancy data
  useEffect(() => {
    setRent(property.price || 0);
    setBills(Math.round((property.price || 0) * 0.15));
    setFees(10);
    setIncome(defaultIncome);
    setImgError(false);
    setOccupancy(null);
    setLlmVerdict(null);

    // Fetch Airbnb occupancy if we have coordinates
    const lat = property.lat ?? property.location?.lat;
    const lng = property.lng ?? property.location?.lng;
    if (lat && lng) {
      fetch(`/api/occupancy?lat=${lat}&lng=${lng}`)
        .then(r => r.json())
        .then(data => setOccupancy(data))
        .catch(() => { });
    }
  }, [property.id, property.price, defaultIncome]);

  // Fetch LLM verdict when ROI results are ready
  useEffect(() => {
    if (!property.id) return;
    setLlmLoading(true);
    fetch('/api/ai-verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: property.id,
        title: property.title,
        price: property.price,
        bedrooms: property.bedrooms,
        propertyType: property.propertyType,
        source: property.source,
        url: property.url,
        monthlyProfit: roiResult.monthlyProfit,
        income,
        occupancyRate: occupancy?.avgOccupancy ?? null,
        isArticle4: property.isArticle4,
        isTiredLandlord: property.isTiredLandlord,
        priceDropPercent,
        timeOnMarket: property.timeOnMarket,
        roiPercentage: roiResult.roiPercentage,
        breakEvenADR: roiResult.breakEvenADR60,
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.verdict) setLlmVerdict(data.verdict); })
      .catch(() => { })
      .finally(() => setLlmLoading(false));
  }, [property.id]);

  const roiResult = useMemo(() => {
    return calculateROI({
      propertyId: property.id,
      monthlyIncome: income,
      monthlyRent: rent,
      monthlyBills: bills,
      managementFees: fees,
      setupCosts: setup,
      useTOMS,
    });
  }, [property.id, income, rent, bills, fees, setup, useTOMS]);

  const priceDropPercent = useMemo(() => {
    if (!property.originalPrice || property.originalPrice === property.price) return null;
    return Math.round(((property.originalPrice - property.price) / property.originalPrice) * 100);
  }, [property]);

  const handleSave = async (status?: string) => {
    await saveLead(property.id, status || existingLead?.status || 'new', notes, `${roiResult.roiPercentage}%`);
  };

  const handleDispatch = async () => {
    if (!existingLead) return;
    try {
      const res = await fetch(`/api/leads/${existingLead.id}/letter`, { method: 'POST' });
      if (res.ok) { alert('Strategic Outreach Dispatched via Stannp'); refreshLeads(); }
    } catch (err) { console.error(err); }
  };

  const imageUrl = property.imageUrl || getPropertyImageUrl(property.propertyType, property.title);
  const isProfit = roiResult.monthlyProfit > 0;

  // AI Expert Opinion Generator
  const aiOpinion = React.useMemo(() => {
    let verdict = "";
    const yieldPcm = isProfit ? roiResult.monthlyProfit : 0;
    const isDiscounted = priceDropPercent && priceDropPercent > 5;

    // Core opinion based on yield and demand
    if (yieldPcm > 1000 && occupancy && occupancy.avgOccupancy !== null && occupancy.avgOccupancy >= 60) {
      verdict = "Strong SA Potential. High local demand combined with excellent projected margins makes this a tier-1 acquisition target.";
    } else if (yieldPcm > 500) {
      verdict = "Viable R2R opportunity. Positive cash flow projected, though local seasonality requires disciplined pricing management.";
    } else if (property.bedrooms && property.bedrooms >= 4 && (!occupancy || occupancy.avgOccupancy === null || occupancy.avgOccupancy < 50)) {
      verdict = "Better suited for HMO conversion than Short-Term Let due to lower local tourist/workforce demand but high bedroom count.";
    } else {
      verdict = "Marginal yield. Proceed with caution. Requires aggressive negotiation on rent to stress-test against low-season voids.";
    }

    // Add context modifiers
    if (property.isTiredLandlord && isDiscounted) {
      verdict += " The recent price drop and landlord motivation signal high negotiability.";
    } else if (property.isArticle4) {
      verdict += " Warning: Article 4 localized restrictions apply. Verify C1/C3 planning status before proceeding.";
    }

    return verdict;
  }, [roiResult.monthlyProfit, occupancy, property, priceDropPercent]);

  return (
    <div className="flex flex-col h-full panel-glass border-l-0 overflow-hidden">

      {/* Hero Image */}
      <div className="relative h-40 flex-shrink-0 overflow-hidden bg-gray-900">
        {!imgError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover opacity-80"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <span className="text-4xl opacity-30">🏠</span>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 bg-black/60 border border-white/20 flex items-center justify-center text-white hover:text-brand-cyan hover:border-brand-cyan/50 transition-colors text-xs"
        >
          ✕
        </button>
        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2 mb-1">
            <SourceBadge source={property.source} />
            {property.isTiredLandlord && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest">⚡ Motivated</span>
            )}
          </div>
          <h2 className="text-sm font-black uppercase tracking-tight leading-tight text-white line-clamp-2">
            {property.title}
          </h2>
        </div>
      </div>

      {/* Key Facts */}
      <div className="flex-shrink-0 grid border-b border-brand-border bg-black/60 px-4 py-3 gap-3">
        <div className="grid grid-cols-4 gap-3">
          <StatBox label="Price" value={`£${(property.price || 0).toLocaleString()}`} />
          <StatBox label="Beds" value={property.bedrooms ?? '—'} />
          <StatBox label="Type" value={property.propertyType || '—'} />
          <StatBox
            label="On Market"
            value={property.timeOnMarket > 0 ? `${property.timeOnMarket}d` : 'New'}
            highlight={property.timeOnMarket > 45}
          />
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-1">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Date Posted/Seen</span>
          <span className="text-xs font-mono text-gray-300">
            {property.firstSeenAt
              ? new Date(property.firstSeenAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
              : (property.scrapedAt ? new Date(property.scrapedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown')}
          </span>
        </div>
      </div>

      {/* Price History Strip */}
      {priceDropPercent && (
        <div className="flex-shrink-0 flex items-center gap-3 bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Price Drop</span>
          <span className="font-mono text-xs text-amber-300">
            £{(property.originalPrice || 0).toLocaleString()} pcm → £{(property.price || 0).toLocaleString()} pcm
          </span>
          <span className="ml-auto text-sm font-black text-red-400">−{priceDropPercent}%</span>
        </div>
      )}

      {/* AI Expert Opinion Block */}
      <div className="flex-shrink-0 bg-[#0a0f16] border-b border-brand-cyan/20 px-4 py-3 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-cyan/10 rounded-full blur-2xl"></div>

        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded bg-brand-cyan/20 flex items-center justify-center border border-brand-cyan/50">
            <span className="text-[9px] text-brand-cyan animate-pulse">✦</span>
          </div>
          <h3 className="text-[11px] font-black text-brand-cyan uppercase tracking-widest">AI Expert Verdict</h3>
          {llmVerdict && !llmLoading && (
            <span className="ml-auto text-[8px] font-black text-brand-cyan/60 border border-brand-cyan/20 px-1.5 py-0.5 uppercase tracking-widest">✦ Groq AI</span>
          )}
          {llmLoading && (
            <span className="ml-auto text-[8px] font-black text-gray-600 uppercase tracking-widest animate-pulse">Analysing...</span>
          )}
        </div>
        <p className="text-[12px] text-gray-300 leading-relaxed relative z-10 italic transition-all duration-500">
          "{llmVerdict || aiOpinion}"
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Airbnb / VRBO / SA Demand Intelligence */}
        <section className="border-b border-brand-border p-4 bg-black/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-black text-gray-300 uppercase tracking-widest">SA Demand Intelligence</h3>
            <span className="text-[10px] font-black text-gray-500 uppercase">Powered by Airbnb & VRBO data</span>
          </div>
          {!occupancy ? (
            <div className="flex items-center gap-2 text-gray-500 text-[11px] uppercase tracking-widest animate-pulse">
              <div className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-ping" />
              Scanning demand signals...
            </div>
          ) : occupancy.avgOccupancy === null ? (
            <p className="text-[11px] text-gray-500 uppercase">No demand data in this area</p>
          ) : (
            <div className="space-y-3">
              {/* Occupancy bar */}
              <div>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Avg Occupancy Rate</span>
                  <span className="font-mono text-xl font-black" style={{ color: occupancy.tierColour }}>
                    {occupancy.avgOccupancy}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${occupancy.avgOccupancy}%`, backgroundColor: occupancy.tierColour }}
                  />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: occupancy.tierColour }} />
                  <span className="text-[13px] font-black uppercase tracking-widest" style={{ color: occupancy.tierColour }}>
                    {occupancy.tier}
                  </span>
                </div>
              </div>
              {/* Nearby demand points */}
              {occupancy.nearbyPoints.length > 0 && (
                <div className="pt-3 mt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2 group relative w-fit cursor-help">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Nearby Demand Epicenters</span>
                    <span className="w-3 h-3 rounded-full border border-gray-500 text-gray-500 text-[8px] flex items-center justify-center group-hover:bg-brand-cyan group-hover:text-black group-hover:border-brand-cyan transition-colors">
                      i
                    </span>
                    {/* Tooltip hover */}
                    <div className="absolute bottom-full mb-1 left-0 w-48 bg-black border border-[#333] text-gray-300 text-[9px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                      Distance from this property to the epicenter of the highest-yielding SA demand zones.
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {occupancy.nearbyPoints.slice(0, 3).map((p, i) => (
                      <div key={i} className="text-center bg-black/20 py-1.5 rounded border border-white/5">
                        <div className="font-mono text-[13px] font-bold text-white">{p.occupancy}%</div>
                        <div className="text-[10px] font-bold text-gray-400">
                          {p.distanceKm}km away
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Revenue estimate */}
              <div className="bg-black/40 border border-white/10 p-2 mt-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Est. SA Monthly Revenue at {occupancy.avgOccupancy}% occ.</div>
                <div className="font-mono text-base font-bold text-white">
                  £{Math.round((occupancy.avgOccupancy / 100) * 30 * (property.price / 30 * 2.8)).toLocaleString()}
                  <span className="text-gray-400 text-[11px] ml-1">/mo</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ROI Calculator */}

        <section className="p-4 space-y-4 border-b border-brand-border">
          <div className="flex justify-between items-center">
            <h3 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">SA/R2R Profit Model</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-500 uppercase">TOMS</span>
              <button
                onClick={() => setUseTOMS(!useTOMS)}
                className={`w-7 h-3.5 border rounded-sm transition-colors ${useTOMS ? 'border-brand-cyan bg-brand-cyan/20' : 'border-brand-border bg-black/40'}`}
              >
                <div className={`w-2 h-2 mx-auto ${useTOMS ? 'bg-brand-cyan shadow-[0_0_5px_#00f2ff]' : 'bg-gray-600'}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Revenue (est)', value: income, set: setIncome },
              { label: 'Rent Commitment', value: rent, set: setRent },
              { label: 'Bills/Utilities', value: bills, set: setBills },
              { label: 'Setup Costs', value: setup, set: setSetup },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">{label}</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">£</span>
                  <input
                    type="number"
                    value={value}
                    onChange={e => set(Number(e.target.value))}
                    className="input-command w-full font-mono pl-5 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className={`border-b border-brand-border p-4 relative overflow-hidden ${isProfit ? 'bg-cyan-950/20' : 'bg-red-950/20'}`}>
          <div className={`absolute top-0 left-0 w-1 h-full ${isProfit ? 'bg-brand-cyan shadow-[0_0_8px_#00f2ff]' : 'bg-brand-red shadow-[0_0_8px_#ff3e3e]'}`} />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isProfit ? 'text-brand-cyan/70' : 'text-red-400/70'}`}>Net Monthly Profit</span>
              <span className={`text-3xl font-black ${isProfit ? 'glow-cyan text-white' : 'text-red-400'}`}>
                £{roiResult.monthlyProfit.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${isProfit ? 'text-brand-cyan/70' : 'text-red-400/70'}`}>Annual Profit</span>
              <span className={`text-xl font-black ${isProfit ? 'text-brand-cyan' : 'text-red-400'}`}>
                £{roiResult.annualProfit.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
            <div>
              <span className="text-[7px] font-black text-gray-500 uppercase block">ROI</span>
              <span className={`font-mono text-sm font-bold ${isProfit ? 'text-brand-cyan' : 'text-gray-400'}`}>
                {roiResult.roiPercentage}%
              </span>
            </div>
            <div>
              <span className="text-[7px] font-black text-gray-500 uppercase block">Break-even ADR</span>
              <span className="font-mono text-sm font-bold text-gray-300">£{roiResult.breakEvenADR60}/nt</span>
            </div>
            {useTOMS && (
              <div>
                <span className="text-[7px] font-black text-gray-500 uppercase block">TOMS VAT</span>
                <span className="font-mono text-sm font-bold text-red-400">−£{roiResult.tomsVAT}</span>
              </div>
            )}
          </div>
        </section>

        {/* Pipeline Actions */}
        <section className="p-4 space-y-3 border-b border-brand-border">
          <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pipeline</h3>
          {!existingLead ? (
            <button
              onClick={() => handleSave('new')}
              disabled={leadsLoading}
              className="btn-command bg-brand-cyan/10 border-brand-cyan/40 text-brand-cyan hover:bg-brand-cyan/20 w-full"
            >
              + Intercept Property
            </button>
          ) : (
            <div className="space-y-2">
              <select
                value={existingLead.status}
                onChange={e => handleSave(e.target.value)}
                className="input-command w-full bg-brand-bg appearance-none"
              >
                {['new', 'interested', 'contacted', 'viewing', 'offered', 'rejected'].map(s => (
                  <option key={s} value={s}>Status: {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <textarea
                placeholder="Intelligence notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                onBlur={() => handleSave()}
                className="input-command w-full h-20 bg-brand-bg resize-none text-xs"
              />
              <button
                onClick={handleDispatch}
                className="btn-command bg-brand-gold/10 border-brand-gold/40 text-brand-gold hover:bg-brand-gold/20 w-full"
              >
                Dispatch Physical Letter
              </button>
              {existingLead.lastOutreachAt && (
                <p className="text-[7px] text-gray-500 uppercase text-center">
                  Last sent: {new Date(existingLead.lastOutreachAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </section>

        {/* View Listing */}
        <div className="p-4">
          <a
            href={property.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-command w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-white/20 text-white"
          >
            <span>View Listing</span>
            <span className="text-gray-500">↗</span>
          </a>
          {property.scrapedAt && (
            <p className="text-[7px] text-gray-600 uppercase text-center mt-2">
              Scraped {new Date(property.scrapedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
