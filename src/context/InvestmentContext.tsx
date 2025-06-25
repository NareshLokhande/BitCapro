import React, { createContext, useContext, useState, ReactNode } from 'react';
import { InvestmentRequest, ApprovalLog, ApprovalMatrix, KPI, SystemKPI } from '../types';
import { mockInvestmentRequests, mockApprovalLogs, mockApprovalMatrix, mockKPIs, mockSystemKPIs } from '../data/mockData';

interface InvestmentContextType {
  investmentRequests: InvestmentRequest[];
  approvalLogs: ApprovalLog[];
  approvalMatrix: ApprovalMatrix[];
  kpis: KPI[];
  systemKPIs: SystemKPI[];
  addInvestmentRequest: (request: Omit<InvestmentRequest, 'id' | 'lastUpdated'>) => void;
  updateInvestmentRequest: (id: string, updates: Partial<InvestmentRequest>) => void;
  addApprovalLog: (log: Omit<ApprovalLog, 'id' | 'timestamp'>) => void;
  updateApprovalMatrix: (matrix: ApprovalMatrix[]) => void;
  addKPI: (kpi: Omit<KPI, 'id'>) => void;
  updateKPI: (id: string, updates: Partial<KPI>) => void;
  updateSystemKPIs: () => void;
}

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export const useInvestment = () => {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
};

interface InvestmentProviderProps {
  children: ReactNode;
}

export const InvestmentProvider: React.FC<InvestmentProviderProps> = ({ children }) => {
  const [investmentRequests, setInvestmentRequests] = useState<InvestmentRequest[]>(mockInvestmentRequests);
  const [approvalLogs, setApprovalLogs] = useState<ApprovalLog[]>(mockApprovalLogs);
  const [approvalMatrix, setApprovalMatrix] = useState<ApprovalMatrix[]>(mockApprovalMatrix);
  const [kpis, setKpis] = useState<KPI[]>(mockKPIs);
  const [systemKPIs, setSystemKPIs] = useState<SystemKPI[]>(mockSystemKPIs);

  const generateId = (prefix: string) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}-${timestamp}-${random}`;
  };

  const addInvestmentRequest = (request: Omit<InvestmentRequest, 'id' | 'lastUpdated'>) => {
    const newRequest: InvestmentRequest = {
      ...request,
      id: generateId('INV'),
      lastUpdated: new Date().toISOString(),
    };
    
    setInvestmentRequests(prev => [newRequest, ...prev]);
    updateSystemKPIs();
  };

  const updateInvestmentRequest = (id: string, updates: Partial<InvestmentRequest>) => {
    setInvestmentRequests(prev => 
      prev.map(request => 
        request.id === id 
          ? { ...request, ...updates, lastUpdated: new Date().toISOString() }
          : request
      )
    );
    updateSystemKPIs();
  };

  const addApprovalLog = (log: Omit<ApprovalLog, 'id' | 'timestamp'>) => {
    const newLog: ApprovalLog = {
      ...log,
      id: generateId('LOG'),
      timestamp: new Date().toISOString(),
    };
    
    setApprovalLogs(prev => [newLog, ...prev]);
  };

  const updateApprovalMatrix = (matrix: ApprovalMatrix[]) => {
    setApprovalMatrix(matrix);
  };

  const addKPI = (kpi: Omit<KPI, 'id'>) => {
    const newKPI: KPI = {
      ...kpi,
      id: generateId('KPI'),
    };
    
    setKpis(prev => [newKPI, ...prev]);
  };

  const updateKPI = (id: string, updates: Partial<KPI>) => {
    setKpis(prev => 
      prev.map(kpi => 
        kpi.id === id ? { ...kpi, ...updates } : kpi
      )
    );
  };

  const updateSystemKPIs = () => {
    const totalInvestment = investmentRequests.reduce((sum, req) => sum + (req.capEx + req.opEx), 0);
    const approvedRequests = investmentRequests.filter(req => req.status === 'Approved');
    const approvalRate = investmentRequests.length > 0 ? (approvedRequests.length / investmentRequests.length) * 100 : 0;
    
    // Calculate average ROI from KPI table
    const avgROI = kpis.length > 0 ? 
      kpis.reduce((sum, kpi) => sum + kpi.roi, 0) / kpis.length : 0;

    setSystemKPIs(prev => prev.map(kpi => {
      switch (kpi.id) {
        case 'SKPI-001':
          return { ...kpi, value: totalInvestment };
        case 'SKPI-002':
          return { ...kpi, value: Math.round(approvalRate * 10) / 10 };
        case 'SKPI-003':
          return { ...kpi, value: Math.round(avgROI * 10) / 10 };
        default:
          return kpi;
      }
    }));
  };

  return (
    <InvestmentContext.Provider value={{
      investmentRequests,
      approvalLogs,
      approvalMatrix,
      kpis,
      systemKPIs,
      addInvestmentRequest,
      updateInvestmentRequest,
      addApprovalLog,
      updateApprovalMatrix,
      addKPI,
      updateKPI,
      updateSystemKPIs,
    }}>
      {children}
    </InvestmentContext.Provider>
  );
};