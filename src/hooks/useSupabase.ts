import { useEffect, useState } from 'react';
import { useAuth, UserProfile } from '../contexts/AuthContext';
import {
  ApprovalLog,
  ApprovalMatrix,
  BusinessCaseRouting,
  InvestmentRequest,
  KPI,
  supabase,
} from '../lib/supabase';

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

  const fetchDrafts = async () => {
    try {
      setError(null);
      console.log('Fetching drafts...');

      const { data, error } = await supabase
        .from('investment_requests')
        .select('*')
        .eq('status', 'Draft')
        .eq('user_id', user?.id)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched drafts:', data);
      return data || [];
    } catch (err) {
      console.error('Error fetching drafts:', err);
      throw new Error(
        err instanceof Error ? err.message : 'Failed to fetch drafts',
      );
    }
  };

  const addRequest = async (
    request: Omit<InvestmentRequest, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    try {
      setError(null);
      console.log('Adding request to database:', request);

      // Add user_id to the request
      const requestWithUser = {
        ...request,
        user_id: user?.id,
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
      setRequests((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding request:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const saveDraft = async (
    draftData: Omit<InvestmentRequest, 'id' | 'created_at' | 'updated_at'>,
  ) => {
    try {
      setError(null);
      console.log('Saving draft:', draftData);

      const draftWithUser = {
        ...draftData,
        user_id: user?.id,
        status: 'Draft',
        last_updated: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('investment_requests')
        .insert([draftWithUser])
        .select()
        .single();

      if (error) {
        console.error('Supabase draft save error:', error);
        throw error;
      }

      console.log('Draft saved successfully:', data);
      setRequests((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error saving draft:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateDraft = async (
    draftId: string,
    updates: Partial<InvestmentRequest>,
  ) => {
    try {
      setError(null);
      console.log('Updating draft:', draftId, updates);

      const updateData = {
        ...updates,
        last_updated: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('investment_requests')
        .update(updateData)
        .eq('id', draftId)
        .eq('status', 'Draft')
        .select()
        .single();

      if (error) {
        console.error('Supabase draft update error:', error);
        throw error;
      }

      console.log('Draft updated successfully:', data);
      setRequests((prev) =>
        prev.map((req) => (req.id === draftId ? data : req)),
      );
      return data;
    } catch (err) {
      console.error('Error updating draft:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const completeDraft = async (
    draftId: string,
    finalData: Partial<InvestmentRequest>,
  ) => {
    try {
      setError(null);
      console.log('Completing draft:', draftId, finalData);

      const completeData = {
        ...finalData,
        status: 'Submitted',
        submitted_date: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('investment_requests')
        .update(completeData)
        .eq('id', draftId)
        .eq('status', 'Draft')
        .select()
        .single();

      if (error) {
        console.error('Supabase draft completion error:', error);
        throw error;
      }

      console.log('Draft completed successfully:', data);
      setRequests((prev) =>
        prev.map((req) => (req.id === draftId ? data : req)),
      );
      return data;
    } catch (err) {
      console.error('Error completing draft:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to complete draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      setError(null);
      console.log('Deleting draft:', draftId);

      const { error } = await supabase
        .from('investment_requests')
        .delete()
        .eq('id', draftId)
        .eq('status', 'Draft')
        .eq('user_id', user?.id);

      if (error) {
        console.error('Supabase draft delete error:', error);
        throw error;
      }

      console.log('Draft deleted successfully');
      setRequests((prev) => prev.filter((req) => req.id !== draftId));
    } catch (err) {
      console.error('Error deleting draft:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete draft';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateRequest = async (
    id: string,
    updates: Partial<InvestmentRequest>,
  ) => {
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
      setRequests((prev) => prev.map((req) => (req.id === id ? data : req)));
      return data;
    } catch (err) {
      console.error('Error updating request:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update request';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  return {
    requests,
    loading,
    error,
    addRequest,
    updateRequest,
    refetch: fetchRequests,
    // Draft management functions
    fetchDrafts,
    saveDraft,
    updateDraft,
    completeDraft,
    deleteDraft,
  };
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
      await supabase
        .from('approval_matrix')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { data, error } = await supabase
        .from('approval_matrix')
        .insert(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          matrixData.map(({ id, created_at, updated_at, ...rest }) => rest),
        )
        .select();

      if (error) {
        console.error('Supabase matrix update error:', error);
        throw error;
      }

      console.log('Matrix updated successfully:', data);
      setMatrix(data || []);
    } catch (err) {
      console.error('Error updating matrix:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update matrix';
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
      await supabase
        .from('business_case_routing')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      const { data, error } = await supabase
        .from('business_case_routing')
        .insert(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          routingData.map(({ id, created_at, updated_at, ...rest }) => rest),
        )
        .select();

      if (error) {
        console.error('Supabase routing update error:', error);
        throw error;
      }

      console.log('Routing updated successfully:', data);
      setRouting(data || []);
    } catch (err) {
      console.error('Error updating routing:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update routing';
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

      // Check if user has already acted on this request
      const existingLog = logs.find(
        (existingLog) =>
          existingLog.request_id === log.request_id &&
          existingLog.user_id === log.user_id,
      );

      if (existingLog) {
        throw new Error(
          'You have already acted on this request. Please update your existing decision instead.',
        );
      }

      // Prepare log data with user_id
      const logData = {
        request_id: log.request_id,
        approved_by: log.approved_by,
        role: log.role,
        level: log.level,
        status: log.status,
        comments: log.comments,
        user_id: log.user_id,
        timestamp: log.timestamp || new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('approval_log')
        .insert([logData])
        .select()
        .single();

      if (error) {
        console.error('Supabase log insert error:', error);

        // Handle specific duplicate constraint violation
        if (
          error.code === '23505' &&
          error.message.includes('idx_approval_log_unique_user_request')
        ) {
          throw new Error(
            'You have already acted on this request. Please update your existing decision instead.',
          );
        }

        throw error;
      }

      console.log('Log added successfully:', data);
      setLogs((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding log:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add log';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateLog = async (id: string, updates: Partial<ApprovalLog>) => {
    try {
      setError(null);
      console.log('Updating approval log:', id, updates);

      const { data, error } = await supabase
        .from('approval_log')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase log update error:', error);
        throw error;
      }

      console.log('Log updated successfully:', data);
      setLogs((prev) => prev.map((log) => (log.id === id ? data : log)));
      return data;
    } catch (err) {
      console.error('Error updating log:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update log';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [requestId, user]);

  return { logs, loading, error, addLog, updateLog, refetch: fetchLogs };
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
      setKpis((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error adding KPI:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add KPI';
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
      setKpis((prev) => prev.map((kpi) => (kpi.id === id ? data : kpi)));
      return data;
    } catch (err) {
      console.error('Error updating KPI:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update KPI';
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

// New hook for ROI impact tracking
export const useROIImpactTracking = () => {
  const { requests } = useInvestmentRequests();
  const { logs } = useApprovalLogs();
  const { kpis } = useKPIs();

  // Calculate ROI impact for all requests
  const calculateROIImpacts = () => {
    return requests.map((request) => {
      // Get KPI data for original ROI
      const requestKPIs = kpis.filter((kpi) => kpi.request_id === request.id);
      const originalROI = requestKPIs.length > 0 ? requestKPIs[0].irr : 15; // Default 15% if no KPI

      // Get approval timeline
      const requestLogs = logs
        .filter((log) => log.request_id === request.id)
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

      const finalApprovalDate =
        requestLogs.find(
          (log) => log.status === 'Approved' || log.status === 'Rejected',
        )?.timestamp || null;

      // Calculate delay in weeks
      const submissionDate = new Date(request.submitted_date);
      const currentDate = new Date();
      const finalDate = finalApprovalDate
        ? new Date(finalApprovalDate)
        : currentDate;
      const delayInWeeks = Math.max(
        0,
        (finalDate.getTime() - submissionDate.getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      );

      // Calculate dynamic decay rate based on project characteristics
      let decayRate = 0.75; // Base 0.75% per week

      // Adjust based on investment amount
      const totalAmount =
        request.base_currency_capex + request.base_currency_opex;
      if (totalAmount > 1000000) decayRate += 0.3;
      else if (totalAmount > 500000) decayRate += 0.2;
      else if (totalAmount > 100000) decayRate += 0.1;

      // Adjust based on business case type
      if (request.business_case_type?.includes('IPO Prep')) decayRate += 0.5;
      if (request.business_case_type?.includes('Compliance')) decayRate += 0.3;
      if (request.business_case_type?.includes('Expansion')) decayRate += 0.2;

      // Apply ROI decay formula: ROI(d) = ROI₀ - (r × d)
      const roiDecay = decayRate * delayInWeeks;
      const adjustedROI = Math.max(0, originalROI - roiDecay);
      const roiLoss = originalROI - adjustedROI;

      // Calculate financial impact
      const projectedValue = totalAmount * (originalROI / 100);
      const adjustedValue = totalAmount * (adjustedROI / 100);
      const lostValue = projectedValue - adjustedValue;

      return {
        requestId: request.id,
        projectTitle: request.project_title,
        originalROI,
        adjustedROI: Math.round(adjustedROI * 100) / 100,
        roiLoss: Math.round(roiLoss * 100) / 100,
        delayInWeeks: Math.round(delayInWeeks * 10) / 10,
        decayRate,
        lostValue: Math.round(lostValue),
        submissionDate: request.submitted_date,
        finalApprovalDate,
        status: request.status,
        department: request.department,
        businessCaseTypes: request.business_case_type || [],
      };
    });
  };

  return {
    calculateROIImpacts,
    requests,
    logs,
    kpis,
  };
};

// Simple user management hook for hackathon demo
export const useUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching users...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDemoUser = async (userData: {
    email: string;
    name: string;
    role: string;
    department: string;
  }) => {
    try {
      setError(null);

      console.log('Creating demo user:', userData);

      // Create profile directly (for demo purposes)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          department: userData.department,
          active: true,
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Demo user created successfully:', profileData);
      setUsers((prev) => [profileData, ...prev]);
      return profileData;
    } catch (err) {
      console.error('Error creating demo user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      setError(null);

      console.log('Updating user:', userId, updates);

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('User updated successfully:', data);
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? data : user)),
      );
      return data;
    } catch (err) {
      console.error('Error updating user:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update user';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleUserStatus = async (userId: string, active: boolean) => {
    return updateUser(userId, { active });
  };

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  return {
    users,
    loading,
    error,
    createDemoUser,
    updateUser,
    toggleUserStatus,
    refetch: fetchUsers,
  };
};
