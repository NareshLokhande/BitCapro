import { useState, useEffect } from 'react';
import { supabase, InvestmentRequest, ApprovalMatrix, ApprovalLog, KPI, BusinessCaseRouting } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const useInvestmentRequests = () => {
  const [requests, setRequests] = useState<InvestmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching investment requests...');
      const { data, error } = await supabase
        .from('investment_requests')
        .select('*')
        .order('submitted_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched requests:', data);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addRequest = async (request: Omit<InvestmentRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      console.log('Adding request to database:', request);
      
      // Add user_id to the request
      const requestWithUser = {
        ...request,
        user_id: user?.id
      };
      
      const { data, error } = await supabase
        .from('investment_requests')
        .insert([requestWithUser])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Request added successfully:', data);
      setRequests(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateRequest = async (id: string, updates: Partial<InvestmentRequest>) => {
    try {
      setError(null);
      console.log('Updating request:', id, updates);
      
      const { data, error } = await supabase
        .from('investment_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Request updated successfully:', data);
      setRequests(prev => prev.map(req => req.id === id ? data : req));
      return data;
    } catch (err) {
      console.error('Error updating request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  return { requests, loading, error, addRequest, updateRequest, refetch: fetchRequests };
};

export const useApprovalMatrix = () => {
  const [matrix, setMatrix] = useState<ApprovalMatrix[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching approval matrix...');
      const { data, error } = await supabase
        .from('approval_matrix')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched matrix:', data);
      setMatrix(data || []);
    } catch (err) {
      console.error('Error fetching matrix:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateMatrix = async (matrixData: ApprovalMatrix[]) => {
    try {
      setError(null);
      console.log('Updating approval matrix:', matrixData);
      
      // Delete existing and insert new
      await supabase.from('approval_matrix').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data, error } = await supabase
        .from('approval_matrix')
        .insert(matrixData.map(({ id, created_at, updated_at, ...rest }) => rest))
        .select();

      if (error) {
        console.error('Supabase matrix update error:', error);
        throw error;
      }
      
      console.log('Matrix updated successfully:', data);
      setMatrix(data || []);
    } catch (err) {
      console.error('Error updating matrix:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update matrix';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatrix();
    }
  }, [user]);

  return { matrix, loading, error, updateMatrix, refetch: fetchMatrix };
};

export const useBusinessCaseRouting = () => {
  const [routing, setRouting] = useState<BusinessCaseRouting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRouting = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching business case routing...');
      const { data, error } = await supabase
        .from('business_case_routing')
        .select('*')
        .order('business_case_type', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched routing:', data);
      setRouting(data || []);
    } catch (err) {
      console.error('Error fetching routing:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateRouting = async (routingData: BusinessCaseRouting[]) => {
    try {
      setError(null);
      console.log('Updating business case routing:', routingData);
      
      // Delete existing and insert new
      await supabase.from('business_case_routing').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      const { data, error } = await supabase
        .from('business_case_routing')
        .insert(routingData.map(({ id, created_at, updated_at, ...rest }) => rest))
        .select();

      if (error) {
        console.error('Supabase routing update error:', error);
        throw error;
      }
      
      console.log('Routing updated successfully:', data);
      setRouting(data || []);
    } catch (err) {
      console.error('Error updating routing:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update routing';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRouting();
    }
  }, [user]);

  return { routing, loading, error, updateRouting, refetch: fetchRouting };
};

export const useApprovalLogs = (requestId?: string) => {
  const [logs, setLogs] = useState<ApprovalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching approval logs...');
      let query = supabase
        .from('approval_log')
        .select('*')
        .order('timestamp', { ascending: false });

      if (requestId) {
        query = query.eq('request_id', requestId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched logs:', data);
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addLog = async (log: Omit<ApprovalLog, 'id' | 'created_at'>) => {
    try {
      setError(null);
      console.log('Adding approval log:', log);
      
      const { data, error } = await supabase
        .from('approval_log')
        .insert([log])
        .select()
        .single();

      if (error) {
        console.error('Supabase log insert error:', error);
        throw error;
      }
      
      console.log('Log added successfully:', data);
      setLogs(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding log:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add log';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [requestId, user]);

  return { logs, loading, error, addLog, refetch: fetchLogs };
};

export const useKPIs = (requestId?: string) => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching KPIs...');
      let query = supabase
        .from('kpis')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestId) {
        query = query.eq('request_id', requestId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched KPIs:', data);
      setKpis(data || []);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addKPI = async (kpi: Omit<KPI, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      console.log('Adding KPI to database:', kpi);
      
      const { data, error } = await supabase
        .from('kpis')
        .insert([kpi])
        .select()
        .single();

      if (error) {
        console.error('Supabase KPI insert error:', error);
        throw error;
      }
      
      console.log('KPI added successfully:', data);
      setKpis(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding KPI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add KPI';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateKPI = async (id: string, updates: Partial<KPI>) => {
    try {
      setError(null);
      console.log('Updating KPI:', id, updates);
      
      const { data, error } = await supabase
        .from('kpis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase KPI update error:', error);
        throw error;
      }
      
      console.log('KPI updated successfully:', data);
      setKpis(prev => prev.map(kpi => kpi.id === id ? data : kpi));
      return data;
    } catch (err) {
      console.error('Error updating KPI:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update KPI';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchKPIs();
    }
  }, [requestId, user]);

  return { kpis, loading, error, addKPI, updateKPI, refetch: fetchKPIs };
};