import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { formatAppDate } from './utils/date';

import { FleetSummary } from './components/pages/FleetSummary';
import { AssetHierarchy } from './components/pages/AssetHierarchy';
import { AlarmsEvents } from './components/pages/AlarmsEvents';
import { HistoricalTrends } from './components/pages/HistoricalTrends';
import { SystemTopology } from './components/pages/SystemTopology';
import { SystemSettings } from './components/pages/SystemSettings';
import { DashboardView } from './components/pages/DashboardView';
import { NotFound } from './components/pages/NotFound';

const API_BASE = 'http://localhost:8001';

function App() {
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('axion_auth') === 'true';
  });

  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000);

  const [summary, setSummary] = useState({
    onlineAssets: 0,
    lastUpdateRaw: ''
  });

  const [devices, setDevices] = useState<any[]>([]);
  const [throughput, setThroughput] = useState<any[]>([]);
  const [topAnomalous, setTopAnomalous] = useState<any[]>([]);
  const [regionSummary, setRegionSummary] = useState<any[]>([]);

  const handleLogin = () => {
    localStorage.setItem('axion_auth', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('axion_auth');
    setIsLoggedIn(false);
  };

  // Update browser tab title
  useEffect(() => {
    if (!isLoggedIn) {
      document.title = 'Axion | Login';
      return;
    }

    const path = location.pathname;

    if (path.startsWith('/device/')) {
      const parts = path.split('/');

      if (parts.length >= 4) {
        document.title = `Axion | ${parts[3]}`;
      } else if (parts.length === 3) {
        document.title = `Axion | ${parts[2].replace(/_/g, ' ')}`;
      } else {
        document.title = 'Axion | Device Dashboard';
      }
    } else if (path === '/fleet') {
      document.title = 'Axion | Fleet Summary';
    } else if (path === '/hierarchy') {
      document.title = 'Axion | Asset Hierarchy';
    } else if (path === '/alarms') {
      document.title = 'Axion | Alarms & Events';
    } else if (path === '/correlation') {
      document.title = 'Axion | Correlation Engine';
    } else if (path === '/topology') {
      document.title = 'Axion | Global Topology';
    } else if (path === '/settings') {
      document.title = 'Axion | Settings';
    } else {
      document.title = 'Axion Intelligence Platform';
    }
  }, [location, isLoggedIn]);

  // Convert supported API response formats into arrays
  const toArray = (
    value: any,
    keys: string[] = ['items', 'data', 'results']
  ): any[] => {
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === 'object') {
      for (const key of keys) {
        if (Array.isArray(value[key])) {
          return value[key];
        }
      }
    }

    console.error('Expected an array, received:', value);
    return [];
  };

  // Fetch dashboard data from backend
  const fetchDashboardData = async () => {
    if (!isLoggedIn) return;

    try {
      const endpoints = [
        '/dashboard/summary',
        '/devices',
        '/dashboard/throughput',
        '/devices/top-anomalous',
        '/dashboard/regions'
      ];

      const responses = await Promise.all(
        endpoints.map(async (endpoint) => {
          const response = await fetch(`${API_BASE}${endpoint}`);

          if (!response.ok) {
            throw new Error(
              `API ${endpoint} failed: ${response.status}`
            );
          }

          return response.json();
        })
      );

      const [sumData, devData, thruData, anomData, regData] = responses;

      setSummary({
        onlineAssets:
          sumData?.onlineAssets ??
          sumData?.online_assets ??
          0,
        lastUpdateRaw:
          sumData?.lastUpdate ??
          sumData?.last_update ??
          ''
      });

      setDevices(
        toArray(devData, ['devices', 'items', 'data', 'results'])
      );

      setThroughput(
        toArray(thruData, ['throughput', 'items', 'data', 'results'])
      );

      setTopAnomalous(
        toArray(anomData, ['devices', 'items', 'data', 'results'])
      );

      setRegionSummary(
        toArray(regData, ['regions', 'items', 'data', 'results'])
      );
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  // User interface settings
  const [theme, setTheme] = useState(
    () => localStorage.getItem('axion_theme') || 'blue'
  );

  const [density, setDensity] = useState(
    () => localStorage.getItem('axion_density') || 'premium'
  );

  const [animation, setAnimation] = useState(
    () => localStorage.getItem('axion_animation') || 'cinematic'
  );

  const [timezone, setTimezone] = useState(
    () => localStorage.getItem('axion_timezone') || 'local'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-density', density);
    document.documentElement.setAttribute('data-animation', animation);

    localStorage.setItem('axion_theme', theme);
    localStorage.setItem('axion_density', density);
    localStorage.setItem('axion_animation', animation);
    localStorage.setItem('axion_timezone', timezone);
  }, [theme, density, animation, timezone]);

  // Refresh dashboard data
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchDashboardData();

    if (refreshInterval !== null) {
      const intervalId = setInterval(
        fetchDashboardData,
        refreshInterval
      );

      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn, refreshInterval]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn
            ? <Navigate to="/fleet" replace />
            : <Login onLogin={handleLogin} />
        }
      />

      <Route
        path="*"
        element={
          !isLoggedIn ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="min-h-screen bg-[#09090b] text-slate-300 font-sans flex relative overflow-hidden noise-bg">

              {/* Background watermark */}
              <div className="fixed top-1/2 left-0 -translate-y-1/2 select-none pointer-events-none opacity-[0.02] z-0">
                <h1 className="text-[25rem] font-black whitespace-nowrap tracking-tighter">
                  AXION
                </h1>
              </div>

              {/* Ambient background effects */}
              <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-theme-deep/20 blur-[150px] rounded-full pointer-events-none z-0" />

              <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-theme-deep/20 blur-[150px] rounded-full pointer-events-none z-0" />

              {/* Decorative rings */}
              <div className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-theme-base/10 rounded-full animate-[spin_120s_linear_infinite] pointer-events-none z-0 opacity-40" />

              <div className="fixed top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border-2 border-dashed border-theme-base/10 rounded-full animate-[spin_90s_linear_infinite_reverse] pointer-events-none z-0 opacity-40" />

              {/* Dot grid */}
              <div
                className="fixed inset-0 opacity-[0.03] z-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at center, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />

              <div className="z-10 flex w-full relative">
                <Sidebar />

                <div className="flex-1 lg:ml-64 ml-16 min-w-0 flex flex-col h-screen overflow-hidden">
                  <TopBar
                    onlineAssets={summary.onlineAssets}
                    lastUpdate={formatAppDate(summary.lastUpdateRaw, timezone)}
                    onLogout={handleLogout}
                  />

                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/fleet" replace />}
                    />

                    <Route
                      path="/fleet"
                      element={<FleetSummary regionSummary={regionSummary} />}
                    />

                    <Route
                      path="/device/:region/:deviceId"
                      element={
                        <DashboardView
                          devices={devices}
                          throughput={throughput}
                          isLoggedIn={isLoggedIn}
                          refreshInterval={refreshInterval}
                          timezone={timezone}
                        />
                      }
                    />

                    <Route
                      path="/device/:region"
                      element={
                        <DashboardView
                          devices={devices}
                          throughput={throughput}
                          isLoggedIn={isLoggedIn}
                          refreshInterval={refreshInterval}
                          timezone={timezone}
                        />
                      }
                    />

                    <Route
                      path="/device"
                      element={
                        <DashboardView
                          devices={devices}
                          throughput={throughput}
                          isLoggedIn={isLoggedIn}
                          refreshInterval={refreshInterval}
                          timezone={timezone}
                        />
                      }
                    />

                    <Route
                      path="/hierarchy"
                      element={<AssetHierarchy devices={devices} />}
                    />

                    <Route
                      path="/topology"
                      element={<SystemTopology devices={devices} />}
                    />

                    <Route
                      path="/alarms"
                      element={
                        <AlarmsEvents
                          devices={topAnomalous}
                          timezone={timezone}
                        />
                      }
                    />

                    <Route
                      path="/correlation"
                      element={<HistoricalTrends devices={devices} />}
                    />

                    <Route
                      path="/settings"
                      element={
                        <SystemSettings
                          refreshInterval={refreshInterval}
                          onRefreshIntervalChange={setRefreshInterval}
                          theme={theme}
                          onThemeChange={setTheme}
                          density={density}
                          onDensityChange={setDensity}
                          animation={animation}
                          onAnimationChange={setAnimation}
                          timezone={timezone}
                          onTimezoneChange={setTimezone}
                        />
                      }
                    />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </div>
            </div>
          )
        }
      />
    </Routes>
  );
}

export default App;
