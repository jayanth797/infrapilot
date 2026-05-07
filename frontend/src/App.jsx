import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Cpu, HardDrive, Activity, LayoutDashboard, Box, 
  ChevronRight, Bell, Clock, RefreshCw, CheckCircle, 
  XCircle, AlertCircle, Settings, Terminal, Shield, 
  Cpu as CpuIcon, Database, Zap
} from 'lucide-react';

// --- MOCK DATA ---
const mockMetrics = {
  cpu_usage: 67.4,
  ram_usage: 54.2,
  disk_usage: 38.7,
  network_in: 23.5,
  network_out: 12.8,
  cpu_history: [
    { time: "10:30", value: 45 }, { time: "10:31", value: 52 },
    { time: "10:32", value: 61 }, { time: "10:33", value: 58 },
    { time: "10:34", value: 67 }, { time: "10:35", value: 71 },
    { time: "10:36", value: 65 }, { time: "10:37", value: 70 },
    { time: "10:38", value: 67 }, { time: "10:39", value: 74 }
  ],
  ram_history: [
    { time: "10:30", value: 48 }, { time: "10:31", value: 50 },
    { time: "10:32", value: 53 }, { time: "10:33", value: 55 },
    { time: "10:34", value: 54 }, { time: "10:35", value: 56 },
    { time: "10:36", value: 52 }, { time: "10:37", value: 54 },
    { time: "10:38", value: 57 }, { time: "10:39", value: 54 }
  ]
};

const mockContainers = [
  { id: "a1b2c3d4e5f6", name: "nginx-proxy", image: "nginx:1.25-alpine", status: "running", cpu: 2.1, memory: "128 MB" },
  { id: "b2c3d4e5f6g7", name: "api-server", image: "python:3.11-slim", status: "running", cpu: 8.4, memory: "512 MB" },
  { id: "c3d4e5f6g7h8", name: "postgres-db", image: "postgres:15", status: "running", cpu: 3.2, memory: "256 MB" },
  { id: "d4e5f6g7h8i9", name: "redis-cache", image: "redis:7-alpine", status: "paused", cpu: 0.1, memory: "64 MB" },
  { id: "e5f6g7h8i9j0", name: "worker-queue", image: "celery:5.3", status: "stopped", cpu: 0.0, memory: "0 MB" },
  { id: "f6g7h8i9j0k1", name: "grafana-monitor", image: "grafana:10.2", status: "running", cpu: 1.5, memory: "192 MB" }
];

const mockDeployments = [
  { id: 1, version: "v2.4.1", service: "api-server", status: "SUCCESS", deployed_at: "2025-05-07T10:32:00Z", duration: "1m 24s", logs: "> Build started...\n> Tests passed (47/47)\n> Docker image built\n> Pushed to registry\n> Deployed to production\n> Health check passed ✓\n> Deployment complete" },
  { id: 2, version: "v2.4.0", service: "nginx-proxy", status: "FAILED", deployed_at: "2025-05-07T09:15:00Z", duration: "0m 47s", logs: "> Build started...\n> Tests passed (47/47)\n> Docker image built\n> ERROR: Port 80 already in use\n> Rolling back to v2.3.9\n> Rollback complete\n> Manual intervention required" },
  { id: 3, version: "v2.3.9", service: "worker-queue", status: "SUCCESS", deployed_at: "2025-05-06T22:00:00Z", duration: "2m 10s", logs: "> Build started...\n> All 62 tests passed\n> Image pushed to registry\n> Zero-downtime deploy started\n> Old containers drained\n> New containers healthy\n> Deployment complete" },
  { id: 4, version: "v2.3.8", service: "postgres-db", status: "RUNNING", deployed_at: "2025-05-07T11:00:00Z", duration: "ongoing", logs: "> Migration started...\n> Step 1/7: Schema backup ✓\n> Step 2/7: Adding columns ✓\n> Step 3/7: Index rebuild... (in progress)\n> Estimated time remaining: 3 minutes" },
  { id: 5, version: "v2.3.7", service: "redis-cache", status: "SUCCESS", deployed_at: "2025-05-06T18:45:00Z", duration: "0m 38s", logs: "> Build started...\n> Cache configuration updated\n> Flushing old cache\n> Applying new config\n> Restarting service\n> Health check passed ✓\n> Deployment complete" },
  { id: 6, version: "v2.3.6", service: "grafana-monitor", status: "FAILED", deployed_at: "2025-05-06T14:20:00Z", duration: "1m 02s", logs: "> Build started...\n> Dependency conflict: grafana-plugin@3.1 vs @3.2\n> Build failed\n> Rolling back...\n> Rollback to v2.3.5 complete\n> Please resolve dependency conflict manually" }
];

const BASE_URL = "http://52.91.238.70:8000/api";

// --- SUB-COMPONENTS ---

const Loader = () => (
  <div className="fixed inset-0 bg-[#0a0d14] z-[100] flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
    <div className="text-2xl font-bold text-cyan tracking-wider animate-pulse">INFRAPILOT</div>
    <div className="text-gray-500 text-sm font-mono">Initializing systems...</div>
  </div>
);

const DemoBanner = ({ show }) => {
  if (!show) return null;
  return (
    <div className="bg-amber-900/20 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-lg mb-6 flex items-center space-x-2 animate-in fade-in slide-in-from-top-4 duration-500">
      <AlertCircle size={18} />
      <span className="text-sm font-medium">Running in demo mode — backend offline</span>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`group flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 ${
      active 
      ? 'bg-[#0f1f2f] border-cyan text-cyan' 
      : 'border-transparent text-gray-400 hover:bg-[#1f2937] hover:text-gray-200'
    }`}
  >
    <Icon size={20} className={active ? 'text-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]' : ''} />
    <span className="font-medium">{label}</span>
  </div>
);

const Sidebar = ({ activeNav, setActiveNav }) => (
  <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#0d1117] border-r border-[#1f2937] flex flex-col z-40">
    <div className="p-6 flex items-center space-x-3">
      <div className="w-8 h-8 bg-cyan/10 rounded-lg flex items-center justify-center border border-cyan/20">
        <Zap className="text-cyan" size={20} />
      </div>
      <h1 className="text-xl font-bold text-cyan tracking-tight">InfraPilot</h1>
    </div>
    
    <nav className="flex-1 mt-4">
      <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeNav === 'dashboard'} onClick={() => setActiveNav('dashboard')} />
      <SidebarItem icon={Box} label="Containers" active={activeNav === 'containers'} onClick={() => setActiveNav('containers')} />
      <SidebarItem icon={Activity} label="Deployments" active={activeNav === 'deployments'} onClick={() => setActiveNav('deployments')} />
      <SidebarItem icon={Cpu} label="Metrics" active={activeNav === 'metrics'} onClick={() => setActiveNav('metrics')} />
      <SidebarItem icon={Bell} label="Alerts" active={activeNav === 'alerts'} onClick={() => setActiveNav('alerts')} />
      <SidebarItem icon={Settings} label="Settings" active={activeNav === 'settings'} onClick={() => setActiveNav('settings')} />
    </nav>

    <div className="p-4 border-t border-[#1f2937]">
      <div className="flex items-center space-x-2 px-2 py-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-blink"></div>
        <span className="text-xs text-gray-400 font-medium">All Systems Operational</span>
      </div>
      <div className="text-[10px] text-gray-600 px-2 font-mono uppercase tracking-widest">v2.4.1 Build 2026</div>
    </div>
  </aside>
);

const Navbar = ({ currentTime, countdown, lastUpdated }) => (
  <header className="sticky top-0 h-16 bg-[#0d1117]/80 backdrop-blur-md border-bottom border-[#1f2937] px-6 flex items-center justify-between z-30">
    <div>
      <h2 className="text-lg font-semibold text-gray-100">Dashboard Overview</h2>
    </div>
    
    <div className="flex items-center space-x-8">
      <div className="flex items-center space-x-2 bg-[#1f2937] px-3 py-1.5 rounded-full border border-[#374151]">
        <Clock size={16} className="text-cyan" />
        <span className="text-sm font-mono text-cyan">{currentTime}</span>
      </div>

      <div className="flex items-center space-x-6 text-sm text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="16" cy="16" r="14" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-gray-800" />
              <circle 
                cx="16" 
                cy="16" 
                r="14" 
                fill="transparent" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeDasharray="88" 
                strokeDashoffset={88 - (countdown * 17.6)} 
                className="text-cyan transition-all duration-1000"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-cyan">{countdown}s</span>
          </div>
          <span className="hidden lg:inline">Auto-refresh</span>
        </div>
        
        <span className="hidden md:inline">Last updated: {lastUpdated}</span>
      </div>

      <div className="flex items-center space-x-4 border-l border-[#1f2937] pl-6">
        <div className="relative cursor-pointer hover:text-cyan transition-colors">
          <Bell size={20} />
          <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d1117]"></div>
        </div>
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer border-2 border-[#1f2937]">
          AD
        </div>
      </div>
    </div>
  </header>
);

const MetricCard = ({ icon: Icon, label, value, trend, color, refreshKey }) => {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [refreshKey]);

  return (
    <div className={`bg-[#111827] border border-[#1f2937] rounded-xl p-5 group hover:border-${color}-500/50 transition-all duration-300 transform ${pulse ? 'scale-[1.02]' : 'scale-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}>
          <Icon className={`text-${color}-500`} size={20} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-[#0a0d14] ${trend.includes('↑') ? 'text-red-500' : trend.includes('↓') ? 'text-green-500' : 'text-gray-500'}`}>
          {trend}
        </span>
      </div>
      <div>
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold font-mono text-gray-100">
          {typeof value === 'number' ? value.toFixed(1) : value}
          {label.includes('Usage') ? '%' : ''}
        </div>
      </div>
    </div>
  );
};

const SystemMetricBar = ({ label, value, color, icon: Icon }) => {
  const isHigh = value > 80;
  const isCritical = value > 90;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <Icon size={14} className={isCritical ? 'text-red-500' : `text-${color}-400`} />
          <span className={`font-medium ${isCritical ? 'text-red-500' : 'text-gray-300'}`}>{label}</span>
          {isCritical && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
        </div>
        <span className="font-mono text-gray-400">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out`}
          style={{ 
            width: `${value}%`, 
            backgroundColor: isCritical ? '#ef4444' : color,
            boxShadow: isHigh ? `0 0 10px ${color}80` : 'none'
          }}
        ></div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-[#374151] rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1 font-mono">{label}</p>
        <p className="text-cyan font-bold font-mono text-sm">{payload[0].value.toFixed(1)}% Usage</p>
      </div>
    );
  }
  return null;
};

const Charts = ({ metrics }) => {
  const pieData = [
    { name: 'SUCCESS', value: 4, color: '#22c55e' },
    { name: 'FAILED', value: 2, color: '#ef4444' },
    { name: 'RUNNING', value: 1, color: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
          <div className="w-1 h-4 bg-cyan rounded-full"></div>
          <span>CPU Usage Over Time</span>
        </h3>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.cpu_history}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#00f5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
          <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
          <span>RAM Usage Over Time</span>
        </h3>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.ram_history}>
              <defs>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorRam)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center space-x-2">
          <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
          <span>Deployment Status</span>
        </h3>
        <div className="flex flex-col items-center">
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex space-x-6 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-xs text-gray-400 font-mono">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContainersTable = ({ containers }) => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden mt-8">
    <div className="px-6 py-4 border-b border-[#1f2937] flex justify-between items-center bg-[#0d1117]">
      <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider flex items-center space-x-2">
        <Box size={18} className="text-cyan" />
        <span>Docker Containers</span>
      </h3>
      <span className="bg-[#1f2937] text-cyan text-[10px] px-2 py-1 rounded-full font-bold">{containers.length} TOTAL</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[#0a0d14]/50 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
          <tr>
            <th className="px-6 py-4">ID</th>
            <th className="px-6 py-4">Container Name</th>
            <th className="px-6 py-4">Image Tag</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">CPU Usage</th>
            <th className="px-6 py-4">Memory</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2937]">
          {containers.map((c, i) => (
            <tr key={c.id} className={`hover:bg-[#1f2937]/50 transition-colors ${i % 2 === 0 ? '' : 'bg-[#111827]/30'}`}>
              <td className="px-6 py-4 font-mono text-xs text-gray-500 group relative">
                {c.id.substring(0, 12)}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#000] text-cyan text-[10px] p-2 rounded border border-cyan/20 z-50">{c.id}</div>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-200">{c.name}</td>
              <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.image}</td>
              <td className="px-6 py-4">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${
                  c.status === 'running' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                  c.status === 'paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {c.status === 'running' && <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-blink"></div>}
                  {c.status.toUpperCase()}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono text-gray-400">{c.cpu}%</span>
                  <div className="w-16 h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                    <div className="h-full bg-cyan" style={{ width: `${Math.min(c.cpu * 5, 100)}%` }}></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-gray-400 font-mono">{c.memory}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const LogViewer = ({ logs }) => {
  const [visibleLogs, setVisibleLogs] = useState([]);
  const lines = logs.split('\n');

  useEffect(() => {
    setVisibleLogs([]);
    lines.forEach((line, i) => {
      setTimeout(() => {
        setVisibleLogs(prev => [...prev, line]);
      }, i * 300);
    });
  }, [logs]);

  return (
    <div className="bg-black text-cyan font-mono text-[13px] p-4 rounded-lg border border-cyan/10 leading-relaxed shadow-inner max-h-[250px] overflow-y-auto">
      {visibleLogs.map((line, i) => (
        <div key={i} className="flex space-x-2">
          <span className="opacity-50 select-none">{'>'}</span>
          <span>{line.replace('>', '').trim()}</span>
        </div>
      ))}
      <div className="w-2 h-4 bg-cyan/50 inline-block ml-1 animate-blink"></div>
    </div>
  );
};

const DeploymentsTable = ({ deployments, expandedLog, setExpandedLog }) => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden mt-8 mb-12">
    <div className="px-6 py-4 border-b border-[#1f2937] flex justify-between items-center bg-[#0d1117]">
      <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider flex items-center space-x-2">
        <Activity size={18} className="text-purple-500" />
        <span>Deployment History</span>
      </h3>
      <span className="bg-[#1f2937] text-purple-400 text-[10px] px-2 py-1 rounded-full font-bold">{deployments.length} RECORDS</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-[#0a0d14]/50 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
          <tr>
            <th className="px-6 py-4">Version</th>
            <th className="px-6 py-4">Service</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Deployed At</th>
            <th className="px-6 py-4">Duration</th>
            <th className="px-6 py-4">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1f2937]">
          {deployments.map((d, i) => (
            <React.Fragment key={d.id}>
              <tr className={`hover:bg-[#1f2937]/50 transition-colors ${d.status === 'RUNNING' ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''}`}>
                <td className="px-6 py-4 font-mono text-xs text-cyan">{d.version}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-200">{d.service}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${
                    d.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                    d.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' : 
                    'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {d.status === 'RUNNING' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-blink"></div>}
                    {d.status}
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  {new Date(d.deployed_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-xs text-gray-500 font-mono italic">{d.duration}</td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setExpandedLog(expandedLog === d.id ? null : d.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      expandedLog === d.id ? 'bg-cyan text-black' : 'bg-[#1f2937] text-gray-400 hover:text-cyan'
                    }`}
                  >
                    <Terminal size={12} />
                    <span>{expandedLog === d.id ? 'Hide Logs' : 'View Logs'}</span>
                  </button>
                </td>
              </tr>
              {expandedLog === d.id && (
                <tr className="bg-black/20">
                  <td colSpan="6" className="px-6 py-4">
                    <LogViewer logs={d.logs} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(mockMetrics);
  const [containers, setContainers] = useState(mockContainers);
  const [deployments, setDeployments] = useState(mockDeployments);
  const [lastUpdated, setLastUpdated] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [currentTime, setCurrentTime] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [demoMode, setDemoMode] = useState(false);

  // Initial Load & Refresh Logic
  useEffect(() => {
    // Initial 1.5s loader
    const loaderTimer = setTimeout(() => setLoading(false), 1500);

    const fetchAll = async () => {
      try {
        const [m, c, d] = await Promise.all([
          axios.get(`${BASE_URL}/metrics/`),
          axios.get(`${BASE_URL}/containers/`),
          axios.get(`${BASE_URL}/deployments/`)
        ]);
        
        // Transform the backend metrics if needed to match chart structure
        const formattedMetrics = {
          ...mockMetrics,
          cpu_usage: m.data.cpu_usage_percent || mockMetrics.cpu_usage,
          ram_usage: m.data.memory_usage_percent || mockMetrics.ram_usage,
          cpu_history: [...metrics.cpu_history.slice(1), { time: new Date().toLocaleTimeString().slice(0, 5), value: m.data.cpu_usage_percent }],
          ram_history: [...metrics.ram_history.slice(1), { time: new Date().toLocaleTimeString().slice(0, 5), value: m.data.memory_usage_percent }]
        };

        setMetrics(formattedMetrics);
        setContainers(c.data || mockContainers);
        setDeployments(d.data || mockDeployments);
        setDemoMode(false);
      } catch (err) {
        // Backend offline — use mock data with slight random variation
        setDemoMode(true);
        setTimeout(() => setDemoMode(false), 4000);
        
        setMetrics(prev => ({
          ...prev,
          cpu_usage: parseFloat((prev.cpu_usage + (Math.random() * 10 - 5)).toFixed(1)),
          ram_usage: parseFloat((prev.ram_usage + (Math.random() * 6 - 3)).toFixed(1)),
          network_in: parseFloat((prev.network_in + (Math.random() * 4 - 2)).toFixed(1)),
          network_out: parseFloat((prev.network_out + (Math.random() * 4 - 2)).toFixed(1)),
          cpu_history: [...prev.cpu_history.slice(1), { time: new Date().toLocaleTimeString().slice(0, 5), value: parseFloat((prev.cpu_usage + Math.random() * 10 - 5).toFixed(1)) }],
          ram_history: [...prev.ram_history.slice(1), { time: new Date().toLocaleTimeString().slice(0, 5), value: parseFloat((prev.ram_usage + Math.random() * 6 - 3).toFixed(1)) }]
        }));
      }
      setLastUpdated(new Date().toLocaleTimeString());
      setRefreshKey(k => k + 1);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    
    return () => {
      clearTimeout(loaderTimer);
      clearInterval(interval);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => (c <= 1 ? 5 : c - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live clock
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(clock);
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="flex bg-[#0a0d14] min-h-screen dot-grid selection:bg-cyan/30 selection:text-cyan">
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />
      
      <div className="flex-1 flex flex-col ml-[240px]">
        <Navbar currentTime={currentTime} countdown={countdown} lastUpdated={lastUpdated} />
        
        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <DemoBanner show={demoMode} />
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <MetricCard icon={Cpu} label="CPU Usage" value={metrics.cpu_usage} trend="↑ 4.2%" color="cyan" refreshKey={refreshKey} />
            <MetricCard icon={Database} label="RAM Usage" value={metrics.ram_usage} trend="↓ 1.8%" color="purple" refreshKey={refreshKey} />
            <MetricCard icon={HardDrive} label="Disk Usage" value={metrics.disk_usage} trend="→ Stable" color="amber" refreshKey={refreshKey} />
            <MetricCard icon={Box} label="Containers" value={containers.length} trend={`${containers.filter(c => c.status === 'running').length} active`} color="blue" refreshKey={refreshKey} />
            <MetricCard icon={CheckCircle} label="Success" value={deployments.filter(d => d.status === 'SUCCESS').length} trend="Last: 10m ago" color="green" refreshKey={refreshKey} />
            <MetricCard icon={XCircle} label="Failures" value={deployments.filter(d => d.status === 'FAILED').length} trend="Last: 2h ago" color="red" refreshKey={refreshKey} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 mt-8">
            {/* System Metrics Panel */}
            <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold text-gray-100 uppercase tracking-widest flex items-center space-x-2">
                  <Activity size={18} className="text-cyan" />
                  <span>System Health</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-blink"></div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Live</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <SystemMetricBar label="CPU Core Cluster" value={metrics.cpu_usage} color="#00f5ff" icon={CpuIcon} />
                <SystemMetricBar label="Physical Memory" value={metrics.ram_usage} color="#a855f7" icon={Database} />
                <SystemMetricBar label="NVMe Storage" value={metrics.disk_usage} color="#f59e0b" icon={HardDrive} />
                <SystemMetricBar label="Network Inbound" value={metrics.network_in} color="#22c55e" icon={Activity} />
                <SystemMetricBar label="Network Outbound" value={metrics.network_out} color="#ef4444" icon={Shield} />
              </div>

              <div className="mt-8 p-4 bg-[#0a0d14]/50 border border-[#1f2937] rounded-lg">
                <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Network Throughput</div>
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-100 font-mono">{(metrics.network_in + metrics.network_out).toFixed(1)}</span>
                    <span className="text-[10px] text-gray-500">MB/s TOTAL</span>
                  </div>
                  <div className="flex space-x-1 items-end h-8">
                    {[3, 5, 8, 4, 9, 6, 12, 7, 10, 5].map((h, i) => (
                      <div key={i} className="w-1 bg-cyan/40 rounded-t" style={{ height: `${h * 2}px` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Panel */}
            <Charts metrics={metrics} />
          </div>

          <ContainersTable containers={containers} />
          <DeploymentsTable deployments={deployments} expandedLog={expandedLog} setExpandedLog={setExpandedLog} />
        </main>
      </div>
    </div>
  );
}
