import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Cpu, HardDrive, Activity, LayoutDashboard, Box,
  Bell, Clock, CheckCircle,
  XCircle, AlertCircle, Settings, Terminal, Shield,
  Cpu as CpuIcon, Database, Zap, RefreshCcw
} from 'lucide-react';


const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

// --- UI COMPONENTS ---

const Loader = () => (
  <div className="fixed inset-0 bg-[#0a0d14] z-[100] flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-4 border-cyan/20 border-t-cyan rounded-full animate-spin"></div>
    <div className="text-2xl font-bold text-cyan tracking-wider animate-pulse font-mono">INFRAPILOT</div>
    <div className="text-gray-500 text-sm font-mono">Initializing navigation...</div>
  </div>
);


const SidebarItem = ({ icon: Icon, label, to }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      to={to}
      className={`group flex items-center space-x-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-4 ${active
        ? 'bg-[#0f1f2f] border-cyan text-cyan'
        : 'border-transparent text-gray-400 hover:bg-[#1f2937] hover:text-gray-200'
        }`}
    >
      <Icon size={20} className={active ? 'text-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]' : ''} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Sidebar = () => (
  <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#0d1117] border-r border-[#1f2937] flex flex-col z-40">
    <div className="p-6 flex items-center space-x-3">
      <div className="w-8 h-8 bg-cyan/10 rounded-lg flex items-center justify-center border border-cyan/20">
        <Zap className="text-cyan" size={20} />
      </div>
      <h1 className="text-xl font-bold text-cyan tracking-tight font-mono">InfraPilot</h1>
    </div>

    <nav className="flex-1 mt-4">
      <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
      <SidebarItem icon={Box} label="Containers" to="/containers" />
      <SidebarItem icon={Activity} label="Deployments" to="/deployments" />
      <SidebarItem icon={Cpu} label="Metrics" to="/metrics" />
      <SidebarItem icon={Bell} label="Alerts" to="/alerts" />
      <SidebarItem icon={Settings} label="Settings" to="/settings" />
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

const Navbar = ({ currentTime, countdown, lastUpdated }) => {
  const location = useLocation();
  const getTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/containers': return 'Docker Containers';
      case '/deployments': return 'Deployment History';
      case '/metrics': return 'System Metrics';
      case '/alerts': return 'System Alerts';
      case '/settings': return 'System Settings';
      default: return 'InfraPilot';
    }
  };

  return (
    <header className="sticky top-0 h-16 bg-[#0d1117]/80 backdrop-blur-md border-b border-[#1f2937] px-6 flex items-center justify-between z-30">
      <div>
        <h2 className="text-lg font-semibold text-gray-100">{getTitle()}</h2>
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
            <span className="hidden lg:inline">Refresh</span>
          </div>
          <span className="hidden md:inline">Synced: {lastUpdated}</span>
        </div>

        <div className="flex items-center space-x-4 border-l border-[#1f2937] pl-6">
          <div className="relative cursor-pointer hover:text-cyan transition-colors">
            <Bell size={20} />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0d1117]"></div>
          </div>
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer border-2 border-[#1f2937]">AD</div>
        </div>
      </div>
    </header>
  );
};

// --- DATA COMPONENTS ---

const MetricCard = ({ icon: Icon, label, value, trend, color, refreshKey }) => {
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(t);
  }, [refreshKey]);

  return (
    <div className={`bg-[#111827] border border-[#1f2937] rounded-xl p-5 group hover:border-${color === 'cyan' ? 'cyan' : color}-500/50 transition-all duration-300 transform ${pulse ? 'scale-[1.02]' : 'scale-100'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg bg-${color === 'cyan' ? 'cyan' : color}-500/10 border border-${color === 'cyan' ? 'cyan' : color}-500/20`}>
          <Icon className={color === 'cyan' ? 'text-cyan' : `text-${color}-500`} size={20} />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded bg-[#0a0d14] ${trend.includes('↑') ? 'text-red-500' : trend.includes('↓') ? 'text-green-500' : 'text-gray-500'}`}>
          {trend}
        </span>
      </div>
      <div>
        <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</div>
        <div className="text-2xl font-bold font-mono text-gray-100">
          {typeof value === 'number' ? value.toFixed(1) : value}
          <span className="text-sm ml-1 text-gray-500 font-normal">
            {label.includes('Usage') ? '%' : label.includes('Net') ? ' MB' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

const SystemMetricBar = ({ label, value, color, icon: Icon, unit = '%' }) => {
  const isHigh = unit === '%' && value > 80;
  const isCritical = unit === '%' && value > 90;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center space-x-2">
          <Icon size={14} className={isCritical ? 'text-red-500' : `text-${color}-400`} />
          <span className={`font-medium ${isCritical ? 'text-red-500' : 'text-gray-300'}`}>{label}</span>
          {isCritical && <AlertCircle size={14} className="text-red-500 animate-pulse" />}
        </div>
        <span className="font-mono text-gray-400">{value.toFixed(1)}{unit}</span>
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

// --- PAGES ---

const DashboardPage = ({ metrics, containers, deployments, refreshKey }) => (
  <div className="animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      <MetricCard icon={Cpu} label="CPU Usage" value={metrics.cpu_usage_percent} trend="LIVE" color="cyan" refreshKey={refreshKey} />
      <MetricCard icon={Database} label="RAM Usage" value={metrics.memory_usage_percent} trend="LIVE" color="purple" refreshKey={refreshKey} />
      <MetricCard icon={HardDrive} label="Disk Usage" value={metrics.disk_usage_percent} trend="LIVE" color="amber" refreshKey={refreshKey} />
      <MetricCard icon={Activity} label="Net In" value={metrics.network_in_mb} trend="MB/s" color="green" refreshKey={refreshKey} />
      <MetricCard icon={Shield} label="Net Out" value={metrics.network_out_mb} trend="MB/s" color="red" refreshKey={refreshKey} />
      <MetricCard icon={Box} label="Containers" value={containers.length} trend="Total" color="blue" refreshKey={refreshKey} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 mt-8">
      <SystemHealthPanel metrics={metrics} />
      <ChartsPanel metrics={metrics} />
    </div>
  </div>
);

const SystemHealthPanel = ({ metrics }) => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-6 h-full">
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
      <SystemMetricBar label="CPU Core Cluster" value={metrics.cpu_usage_percent} color="#00f5ff" icon={CpuIcon} />
      <SystemMetricBar label="Physical Memory" value={metrics.memory_usage_percent} color="#a855f7" icon={Database} />
      <SystemMetricBar label="NVMe Storage" value={metrics.disk_usage_percent} color="#f59e0b" icon={HardDrive} />
      <SystemMetricBar label="Network Inbound" value={metrics.network_in_mb} color="#22c55e" icon={Activity} unit=" MB" />
      <SystemMetricBar label="Network Outbound" value={metrics.network_out_mb} color="#ef4444" icon={Shield} unit=" MB" />
    </div>

    <div className="mt-8 p-4 bg-[#0a0d14]/50 border border-[#1f2937] rounded-lg">
      <div className="text-[10px] text-gray-500 uppercase font-bold mb-2">Throughput History</div>
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-100 font-mono">{(metrics.network_in_mb + metrics.network_out_mb).toFixed(1)}</span>
          <span className="text-[10px] text-gray-500">MB/s AVG</span>
        </div>
        <div className="flex space-x-1 items-end h-8">
          {[3, 5, 8, 4, 9, 6, 12, 7, 10, 5].map((h, i) => (
            <div key={i} className="w-1 bg-cyan/40 rounded-t" style={{ height: `${h * 2}px` }}></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ChartsPanel = ({ metrics }) => {
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
          <span>CPU Utilization History</span>
        </h3>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.cpu_history}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
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
          <span>Memory Usage Analytics</span>
        </h3>
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics.memory_history}>
              <defs>
                <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
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
          <span>Deployment Integrity</span>
        </h3>
        <div className="flex flex-col items-center">
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex space-x-4 mt-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ContainersPage = ({ containers }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f2937] flex justify-between items-center bg-[#0d1117]">
        <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider flex items-center space-x-2">
          <Box size={18} className="text-cyan" />
          <span>Active Containers</span>
        </h3>
        <span className="bg-[#1f2937] text-cyan text-[10px] px-2 py-1 rounded-full font-bold">{containers.length} INSTANCES</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-[#0a0d14]/50 text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Container Name</th>
              <th className="px-6 py-4">Image Tag</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">CPU %</th>
              <th className="px-6 py-4">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1f2937]">
            {containers.map((c, i) => (
              <tr key={c.id} className={`hover:bg-[#1f2937]/50 transition-colors ${i % 2 === 0 ? '' : 'bg-[#111827]/30'}`}>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.id.substring(0, 12)}</td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-200">{c.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500">{c.image}</td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${c.status === 'running' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
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
  </div>
);

const DeploymentsPage = ({ onDeploy, deploying }) => {
  const [deployments, setDeployments] = useState([]);
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchDeployments = () => {
    axios.get(`${BASE_URL}/deployments/`)
      .then((res) => setDeployments(res.data || []))
      .catch((err) => console.error("Deployments fetch error:", err));
  };

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTrigger = async () => {
    await onDeploy();
    fetchDeployments();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-[#1f2937] flex justify-between items-center bg-[#0d1117]">
          <h3 className="text-sm font-semibold text-gray-100 uppercase tracking-wider flex items-center space-x-2">
            <Activity size={18} className="text-purple-500" />
            <span>Infrastructure Updates</span>
          </h3>
          <div className="flex items-center space-x-4">
            <span className="bg-[#1f2937] text-purple-400 text-[10px] px-2 py-1 rounded-full font-bold">{deployments.length} UPDATES TRACKED</span>
            <button
              onClick={fetchDeployments}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all bg-[#1f2937] text-gray-400 hover:text-cyan border border-[#1f2937] hover:border-cyan/50 shadow-lg"
            >
              <RefreshCcw size={14} />
              <span>Refresh History</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0a0d14] text-[10px] uppercase tracking-widest text-gray-500 font-bold border-b border-[#1f2937]">
                <th className="px-6 py-4">Version & Commit</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Update Summary</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Deployed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937]">
              {deployments.map((d) => (
                <tr key={d.id} className={`hover:bg-[#1f2937]/50 transition-colors ${d.status === 'RUNNING' ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-cyan">{d.version}</span>
                      <span className="text-[10px] text-gray-500 font-mono">#{d.commit_hash || 'manual'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-200">{d.service}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs text-gray-300 max-w-xs overflow-hidden">
                      <Terminal size={12} className="text-gray-500 shrink-0" />
                      <span className="truncate">{d.logs}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold border ${d.status === 'SUCCESS' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      d.status === 'RUNNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse' :
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                      {d.status === 'RUNNING' && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 animate-blink"></div>}
                      {d.status}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">{new Date(d.deployed_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MetricsPage = ({ metrics }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
    <SystemHealthPanel metrics={metrics} />
  </div>
);

const AlertsPage = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 animate-in fade-in zoom-in duration-700">
    <Shield size={64} className="mb-4 opacity-20" />
    <h2 className="text-xl font-bold text-gray-300">System Shields Active</h2>
    <p className="text-sm mt-2">No critical alerts detected in the current cycle.</p>
  </div>
);

const SettingsPage = () => (
  <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
    <h3 className="text-lg font-bold text-gray-100 mb-6 flex items-center space-x-3">
      <Settings className="text-gray-400" />
      <span>System Configuration</span>
    </h3>
    <div className="space-y-6">
      <div className="flex justify-between items-center p-4 bg-[#0a0d14] rounded-lg border border-[#1f2937]">
        <div>
          <div className="text-sm font-bold text-gray-200">Auto-Scaling</div>
          <div className="text-xs text-gray-500">Automatically adjust cluster size based on load</div>
        </div>
        <div className="w-10 h-5 bg-cyan rounded-full flex items-center px-1">
          <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
        </div>
      </div>
      <div className="flex justify-between items-center p-4 bg-[#0a0d14] rounded-lg border border-[#1f2937]">
        <div>
          <div className="text-sm font-bold text-gray-200">Debug Logging</div>
          <div className="text-xs text-gray-500">Increase verbosity for development troubleshooting</div>
        </div>
        <div className="w-10 h-5 bg-gray-700 rounded-full flex items-center px-1">
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
      </div>
      <button className="w-full py-3 bg-[#1f2937] text-gray-200 text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-cyan hover:text-black transition-all">Save Changes</button>
    </div>
  </div>
);

// --- MAIN APP ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    cpu_usage_percent: 0,
    memory_usage_percent: 0,
    memory_available_gb: 0,
    disk_usage_percent: 0,
    network_in_mb: 0,
    network_out_mb: 0,
    cpu_history: Array(10).fill({ time: '--:--', value: 0 }),
    memory_history: Array(10).fill({ time: '--:--', value: 0 })
  });
  const [containers, setContainers] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [currentTime, setCurrentTime] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notification, setNotification] = useState(null);
  const [deploying, setDeploying] = useState(false);

  const fetchAll = async () => {
    // 1. Fetch System Metrics
    try {
      const m = await axios.get(`${BASE_URL}/metrics/`);
      const rawData = m.data;
      setMetrics(prev => ({
        ...prev,
        ...rawData,
        cpu_history: [...prev.cpu_history.slice(1), {
          time: new Date().toLocaleTimeString().slice(0, 5),
          value: rawData.cpu_usage_percent
        }],
        memory_history: [...prev.memory_history.slice(1), {
          time: new Date().toLocaleTimeString().slice(0, 5),
          value: rawData.memory_usage_percent
        }]
      }));
    } catch (err) {
      console.error("Metrics fetch error:", err);
    }

    // 2. Fetch Containers
    try {
      const c = await axios.get(`${BASE_URL}/containers/`);
      setContainers(c.data || []);
    } catch (err) {
      console.error("Containers fetch error:", err);
    }

    setLastUpdated(new Date().toLocaleTimeString());
    setRefreshKey(k => k + 1);
  };

  const handleDeploy = async () => {
    setDeploying(true);
    try {
      const res = await axios.post(`${BASE_URL}/deploy/`);
      setNotification({ type: 'success', message: res.data.message });
      // Parent doesn't fetch deployments anymore
    } catch (err) {
      setNotification({ type: 'error', message: "Deployment failed. Check logs." });
    } finally {
      setDeploying(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  useEffect(() => {
    const loaderTimer = setTimeout(() => setLoading(false), 1200);
    fetchAll();
    const interval = setInterval(fetchAll, 5000);
    return () => { clearTimeout(loaderTimer); clearInterval(interval); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCountdown(c => (c <= 1 ? 5 : c - 1)), 1000);
    const clock = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => { clearInterval(timer); clearInterval(clock); };
  }, []);

  if (loading) return <Loader />;

  return (
    <Router>
      <div className="flex bg-[#0a0d14] min-h-screen dot-grid selection:bg-cyan/30 selection:text-cyan">
        <Sidebar />

        <div className="flex-1 flex flex-col ml-[240px]">
          <Navbar currentTime={currentTime} countdown={countdown} lastUpdated={lastUpdated} />

          <main className="flex-1 p-8 max-w-7xl mx-auto w-full overflow-y-auto relative">
            {notification && (
              <div className={`fixed top-24 right-8 z-50 animate-in slide-in-from-right duration-500 flex items-center space-x-3 px-6 py-4 rounded-xl border shadow-2xl ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}>
                {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span className="font-bold text-sm">{notification.message}</span>
              </div>
            )}

            <Routes>
              <Route path="/" element={<DashboardPage metrics={metrics} containers={containers} deployments={[]} refreshKey={refreshKey} />} />
              <Route path="/containers" element={<ContainersPage containers={containers} />} />
              <Route path="/deployments" element={<DeploymentsPage onDeploy={handleDeploy} deploying={deploying} />} />
              <Route path="/metrics" element={<MetricsPage metrics={metrics} />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
