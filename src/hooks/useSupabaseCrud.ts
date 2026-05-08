import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

type TableName =
  | 'vehicles' | 'trips' | 'bookings' | 'renters' | 'expenses'
  | 'cleaning' | 'maintenance' | 'claims' | 'team_members' | 'payouts'
  | 'mileage_logs' | 'settings';

interface UseCrudOptions {
  orderBy?: string;
  ascending?: boolean;
  filters?: Record<string, unknown>;
}

export function useSupabaseCrud<T extends { id: string }>(
  table: TableName,
  options?: UseCrudOptions,
) {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderBy = options?.orderBy;
  const ascending = options?.ascending;
  const filtersKey = useMemo(() => JSON.stringify(options?.filters ?? {}), [options?.filters]);

  const fetchData = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select('*').eq('user_id', user.id);

      const filters = JSON.parse(filtersKey) as Record<string, unknown>;
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      query = query.order(orderBy ?? 'created_at', { ascending: ascending ?? false });

      const { data: rows, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setData((rows as T[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [user, table, orderBy, ascending, filtersKey]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (item: Record<string, unknown>) => {
    if (!user) return { error: 'Not authenticated' };
    const { error: createError } = await supabase
      .from(table)
      .insert({ ...item, user_id: user.id } as any);

    if (createError) return { error: createError.message };
    await fetchData();
    return { error: null };
  };

  const update = async (id: string, updates: Record<string, unknown>) => {
    if (!user) return { error: 'Not authenticated' };
    const client = supabase as any;
    const { error: updateError } = await client
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) return { error: updateError.message };
    await fetchData();
    return { error: null };
  };

  const remove = async (id: string) => {
    if (!user) return { error: 'Not authenticated' };
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq('id', id as any)
      .eq('user_id', user.id as any);

    if (deleteError) return { error: deleteError.message };
    await fetchData();
    return { error: null };
  };

  const getById = async (id: string) => {
    if (!user) return null;
    const { data: row } = await supabase
      .from(table)
      .select('*')
      .eq('id', id as any)
      .eq('user_id', user.id as any)
      .single();
    return row as T | null;
  };

  return { data, loading, error, refresh: fetchData, create, update, remove, getById };
}

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .eq('user_id', user.id);

      const map: Record<string, string> = {};
      data?.forEach((row: any) => { map[row.key] = row.value; });
      setSettings(map);
    } catch (e) {
      if (__DEV__) console.warn('[settings] fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = async (key: string, value: string) => {
    if (!user) return;
    try {
      await supabase
        .from('settings')
        .upsert({ user_id: user.id, key, value } as any);
      setSettings((prev) => ({ ...prev, [key]: value }));
    } catch (e) {
      if (__DEV__) console.warn('[settings] update failed', e);
    }
  };

  return { settings, loading, updateSetting, refresh: fetchSettings };
}
