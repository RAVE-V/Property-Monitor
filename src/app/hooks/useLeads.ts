import { useState, useEffect, useCallback } from 'react';

export function useLeads(userId: string = 'demo-user') {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const saveLead = async (propertyId: string, status?: string, notes?: string, roiAtSave?: string) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, propertyId, status, notes, roiAtSave }),
      });
      if (!response.ok) throw new Error('Failed to save lead');
      await fetchLeads(); // refresh
      return await response.json();
    } catch (err) {
      setError(err);
      return null;
    }
  };

  const deleteLead = async (id: string) => {
    try {
      const response = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete lead');
      await fetchLeads(); // refresh
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return { leads, isLoading, error, saveLead, deleteLead, refreshLeads: fetchLeads };
}
