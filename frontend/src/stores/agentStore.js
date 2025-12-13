import { create } from 'zustand';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useAgentStore = create((set, get) => ({
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,
  syncing: false,

  // Sync agents from cloud to local DB
  syncCloudAgents: async () => {
    set({ syncing: true });
    try {
      await axios.post(`${API}/retell/sync-agents`);
      return true;
    } catch (error) {
      console.error('Failed to sync cloud agents:', error);
      return false;
    } finally {
      set({ syncing: false });
    }
  },

  // Fetch all agents (syncs with cloud first)
  fetchAgents: async (syncFirst = true) => {
    set({ loading: true, error: null });
    try {
      // Optionally sync from cloud first to get any new agents
      if (syncFirst) {
        try {
          await axios.post(`${API}/retell/sync-agents`);
        } catch (syncError) {
          console.warn('Cloud sync skipped:', syncError.message);
        }
      }
      
      // Then fetch all agents from local DB
      const response = await axios.get(`${API}/agents`);
      set({ agents: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single agent
  fetchAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API}/agents/${agentId}`);
      set({ currentAgent: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Create agent
  createAgent: async (agentData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API}/agents`, agentData);
      set((state) => ({
        agents: [...state.agents, response.data],
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Update agent
  updateAgent: async (agentId, agentData) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.put(`${API}/agents/${agentId}`, agentData);
      set((state) => ({
        agents: state.agents.map((a) => (a.id === agentId ? response.data : a)),
        currentAgent: response.data,
        loading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Delete agent
  deleteAgent: async (agentId) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API}/agents/${agentId}`);
      set((state) => ({
        agents: state.agents.filter((a) => a.id !== agentId),
        loading: false,
      }));
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  // Deploy agent
  deployAgent: async (agentId) => {
    try {
      const response = await axios.post(`${API}/agents/${agentId}/deploy`);
      set((state) => ({
        agents: state.agents.map((a) =>
          a.id === agentId ? { ...a, status: 'active' } : a
        ),
        currentAgent: state.currentAgent?.id === agentId 
          ? { ...state.currentAgent, status: 'active' } 
          : state.currentAgent,
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  },

  // Clear current agent
  clearCurrentAgent: () => set({ currentAgent: null }),

  // Cleanup deleted agents (remove agents that no longer exist in cloud)
  cleanupDeletedAgents: async () => {
    set({ syncing: true });
    try {
      const response = await axios.post(`${API}/agents/cleanup`);
      return response.data;
    } catch (error) {
      console.error('Failed to cleanup agents:', error);
      return null;
    } finally {
      set({ syncing: false });
    }
  },
}));

export const useFlowStore = create((set, get) => ({
  flows: [],
  currentFlow: null,
  nodes: [],
  edges: [],
  loading: false,

  // Fetch flows for an agent
  fetchFlows: async (agentId) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API}/agents/${agentId}/flows`);
      set({ flows: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  // Save flow
  saveFlow: async (agentId, flowData) => {
    try {
      const response = await axios.post(`${API}/agents/${agentId}/flows`, flowData);
      set((state) => ({ flows: [...state.flows, response.data] }));
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Update nodes and edges
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set((state) => {
      const updatedNodes = [...state.nodes];
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          const nodeIndex = updatedNodes.findIndex((n) => n.id === change.id);
          if (nodeIndex !== -1) {
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              position: change.position,
            };
          }
        }
      });
      return { nodes: updatedNodes };
    });
  },

  onEdgesChange: (changes) => {
    set((state) => {
      let updatedEdges = [...state.edges];
      changes.forEach((change) => {
        if (change.type === 'remove') {
          updatedEdges = updatedEdges.filter((e) => e.id !== change.id);
        }
      });
      return { edges: updatedEdges };
    });
  },

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
}));

export const useToolStore = create((set) => ({
  tools: [],
  builtinTools: [],
  loading: false,

  fetchTools: async () => {
    set({ loading: true });
    try {
      const [toolsRes, builtinRes] = await Promise.all([
        axios.get(`${API}/tools`),
        axios.get(`${API}/tools/builtin`),
      ]);
      set({ tools: toolsRes.data, builtinTools: builtinRes.data, loading: false });
    } catch (error) {
      set({ loading: false });
    }
  },

  createTool: async (toolData) => {
    try {
      const response = await axios.post(`${API}/tools`, toolData);
      set((state) => ({ tools: [...state.tools, response.data] }));
      return response.data;
    } catch (error) {
      return null;
    }
  },
}));

export const useAnalyticsStore = create((set) => ({
  analytics: null,
  chartData: null,
  recentCalls: [],
  insights: [],
  loading: false,

  fetchAnalytics: async (days = 7) => {
    set({ loading: true });
    try {
      const [analyticsRes, chartRes, recentRes] = await Promise.all([
        axios.get(`${API}/analytics/calls?days=${days}`),
        axios.get(`${API}/analytics/chart-data?days=${days}`),
        axios.get(`${API}/analytics/recent-calls?limit=10`)
      ]);
      set({ 
        analytics: analyticsRes.data, 
        chartData: chartRes.data,
        recentCalls: recentRes.data,
        loading: false 
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      set({ loading: false });
    }
  },

  fetchInsights: async () => {
    try {
      const response = await axios.get(`${API}/insights`);
      set({ insights: response.data });
    } catch (error) {}
  },

  createInsight: async (insightData) => {
    try {
      const response = await axios.post(`${API}/insights`, insightData);
      set((state) => ({ insights: [...state.insights, response.data] }));
      return response.data;
    } catch (error) {
      return null;
    }
  },
}));
