import { useAuth } from '@clerk/clerk-react';
import { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard, CreditCard, Users, BarChart3, Settings,
  Search, Bell, ChevronDown, ArrowUpRight, ArrowDownRight,
  RefreshCw, CircleDollarSign, CalendarClock, Sparkles,
  Menu, X, ExternalLink, CheckCircle2, Clock3
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell
} from 'recharts';
import './App.css';

const COLORS = ['#635bff', '#21b8a9', '#f5a623', '#ef6488', '#5795f7'];

const money = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [service, setService] = useState('All services');
  const [mobileMenu, setMobileMenu] = useState(false);

const { getToken } = useAuth();

useEffect(() => {
  async function loadSubscriptions() {
    try {
      const token = await getToken();

      const response = await fetch('/api/subscriptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Could not load subscriptions');
      }

      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      setError('Could not load subscriptions. Check your sign-in and backend.');
    } finally {
      setLoading(false);
    }
  }

  loadSubscriptions();
}, [getToken]);

  const departments = useMemo(
    () => [...new Set(subscriptions.map((s) => s.department).filter(Boolean))],
    [subscriptions]
  );

  const services = useMemo(
    () => [...new Set(subscriptions.map((s) => s.service).filter(Boolean))],
    [subscriptions]
  );

  const filtered = useMemo(() => subscriptions.filter((s) => {
    const query = search.toLowerCase();
    const matchesSearch = [s.employee, s.service, s.department]
      .some((value) => String(value || '').toLowerCase().includes(query));
    return matchesSearch
      && (department === 'All departments' || s.department === department)
      && (service === 'All services' || s.service === service);
  }), [subscriptions, search, department, service]);

  const totalUSD = subscriptions
    .filter((s) => s.currency === 'USD')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const totalLYD = subscriptions
    .filter((s) => s.currency === 'LYD')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const uniqueEmployees = new Set(subscriptions.map((s) => s.employee)).size;
  const uniqueServices = new Set(subscriptions.map((s) => s.service)).size;

  const departmentData = departments.map((name) => ({
    name,
    count: subscriptions.filter((s) => s.department === name).length,
    totalUSD: subscriptions
      .filter((s) => s.department === name && s.currency === 'USD')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0),
    totalLYD: subscriptions
      .filter((s) => s.department === name && s.currency === 'LYD')
      .reduce((sum, s) => sum + Number(s.amount || 0), 0),
  }));

  const serviceData = services.map((name) => ({
    name,
    value: subscriptions.filter((s) => s.service === name).length,
  }));



const monthlyData = (() => {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(2026, 4 + index, 1);

    const key = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}`;

    const label = date.toLocaleDateString('en-US', {
      month: 'short',
    });

    const amount = subscriptions
      .filter(
        (s) =>
          String(s.currency).trim().toUpperCase() === 'USD' &&
          s.start_date
      )
      .filter((s) => {
        const d = new Date(s.start_date);

        const subscriptionMonth = `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, '0')}`;

        return subscriptionMonth === key;
      })
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);

    return { month: label, spending: amount };
  });
})();
  


  const renewalCount = subscriptions.filter((s) => {
    if (!s.end_date) return false;
    const days = (new Date(s.end_date) - new Date()) / 86400000;
    return days >= 0 && days <= 30;
  }).length;

  const serviceColor = (name) => {
    const value = name.toLowerCase();
    if (value.includes('chatgpt')) return 'purple';
    if (value.includes('claude')) return 'orange';
    if (value.includes('gemini')) return 'blue';
    if (value.includes('canva')) return 'teal';
    return 'gray';
  };

  const dateLabel = (value) => {
    if (!value) return 'No end date';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'No end date'
      : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="app-shell">
      {mobileMenu && <button className="mobile-overlay" onClick={() => setMobileMenu(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Sparkles size={22} /></div>
          <div><strong>subly</strong><span>WORKSPACE</span></div>
          <button className="close-menu" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X /></button>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          <button className="nav-item active"><LayoutDashboard size={18} /> Overview</button>
          <button className="nav-item" onClick={() => document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' })}><CreditCard size={18} /> Subscriptions <span className="nav-count">{subscriptions.length}</span></button>
          <button className="nav-item" onClick={() => document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' })}><Users size={18} /> Departments</button>
          <button className="nav-item" onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })}><BarChart3 size={18} /> Analytics</button>
        </nav>

        <div className="workspace-label tools-label">PREFERENCES</div>
        <nav className="nav-list">
          <button className="nav-item" onClick={() => alert('Settings will be added in a later step.')}><Settings size={18} /> Settings</button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><Sparkles size={17} /></div>
            <strong>Your workspace</strong>
            <p>Your subscriptions, all in one place.</p>
          </div>
          <div className="profile">
            <div className="avatar">AD</div>
            <div className="profile-text"><strong>Admin</strong><span>Workspace owner</span></div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu /></button>
          <div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <span className="live-status"><span /> Database connected</span>
            <button className="icon-button" aria-label="Notifications"><Bell size={19} /><i /></button>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-dot" /> SUBSCRIPTION MANAGEMENT</div>
              <h1>Good to see you, Admin <span>✦</span></h1>
              <p className="subtitle">Here's what's happening with your team's AI subscriptions.</p>
            </div>
            <button className="refresh-button" onClick={() => window.location.reload()}><RefreshCw size={16} /> Refresh data</button>
          </section>

          {error && <div className="error-banner">{error}</div>}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon violet"><CreditCard size={20} /></span><span className="stat-caption">ALL RECORDS</span></div>
              <div className="stat-value">{loading ? '—' : subscriptions.length}</div>
              <div className="stat-bottom"><span className="stat-neutral">Subscriptions</span><span className="stat-foot-icon violet-text"><ArrowUpRight size={16} /></span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon mint"><CircleDollarSign size={20} /></span><span className="stat-caption">USD ONLY</span></div>
              <div className="stat-value">{loading ? '—' : money(totalUSD)}</div>
              <div className="stat-bottom"><span className="stat-neutral">Combined listed amounts</span><span className="stat-foot-icon mint-text"><ArrowUpRight size={16} /></span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon amber"><Users size={20} /></span><span className="stat-caption">TEAM MEMBERS</span></div>
              <div className="stat-value">{loading ? '—' : uniqueEmployees}</div>
              <div className="stat-bottom"><span className="stat-neutral">Unique employees</span><span className="stat-foot-icon amber-text"><ArrowUpRight size={16} /></span></div>
            </article>
            <article className="stat-card">
              <div className="stat-top"><span className="stat-icon rose"><CalendarClock size={20} /></span><span className="stat-caption">RENEWALS SOON</span></div>
              <div className="stat-value">{loading ? '—' : renewalCount}</div>
              <div className="stat-bottom"><span className="stat-neutral">Within the next 30 days</span><span className="stat-foot-icon rose-text"><Clock3 size={16} /></span></div>
            </article>
          </section>

          <section className="charts-grid" id="analytics">
            <article className="panel spending-panel">
              <div className="panel-heading">
                <div><h2>Subscription spending</h2><p>USD amounts by active month</p></div>
                <span className="period-chip">Last 6 months</span>
              </div>
              <div className="chart-total">{money(totalUSD)} <span>USD listed</span></div>
              <div className="area-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                    <defs><linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7167f8" stopOpacity={0.25} /><stop offset="95%" stopColor="#7167f8" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid stroke="#edf0f6" strokeDasharray="4 5" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#9299ab', fontSize: 12 }} dy={10} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#9299ab', fontSize: 11 }} />
                    <Tooltip formatter={(value) => [money(value), 'USD listed']} />
                    <Area type="monotone" dataKey="spending" stroke="#7167f8" strokeWidth={3} fill="url(#spendingGradient)" activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="chart-note">Historical values are estimated from subscription start and end dates in your database.</p>
            </article>

            <article className="panel service-panel">
              <div className="panel-heading">
                <div><h2>Service distribution</h2><p>Subscriptions by platform</p></div>
                <span className="round-icon"><BarChart3 size={18} /></span>
              </div>
              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={88} paddingAngle={4} stroke="none">
                      {serviceData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center"><strong>{subscriptions.length}</strong><span>Total records</span></div>
              </div>
              <div className="legend-list">
                {serviceData.map((entry, index) => (
                  <div className="legend-row" key={entry.name}>
                    <span className="legend-name"><i style={{ background: COLORS[index % COLORS.length] }} />{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
                {serviceData.length === 0 && !loading && <p className="empty-note">No service data yet.</p>}
              </div>
            </article>
          </section>

          <section className="panel departments-panel" id="departments">
            <div className="panel-heading">
              <div><h2>Department overview</h2><p>How subscriptions are distributed across your team</p></div>
              <button className="text-link" onClick={() => { setDepartment('All departments'); document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' }); }}>View subscriptions <ExternalLink size={14} /></button>
            </div>
            <div className="department-grid">
              {departmentData.map((dept, index) => (
                <button className="department-card" key={dept.name} onClick={() => { setDepartment(dept.name); document.getElementById('subscriptions')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  <div className="department-card-top"><span className="department-dot" style={{ background: COLORS[index % COLORS.length] }} /><span>{dept.count} {dept.count === 1 ? 'subscription' : 'subscriptions'}</span></div>
                  <h3>{dept.name}</h3>
                  <div className="department-spend">{money(dept.totalUSD)} <span>USD</span></div>
                  {dept.totalLYD > 0 && <div className="department-lyd">{money(dept.totalLYD, 'LYD')}</div>}
                  <div className="department-progress"><span style={{ width: `${subscriptions.length ? (dept.count / subscriptions.length) * 100 : 0}%`, background: COLORS[index % COLORS.length] }} /></div>
                </button>
              ))}
              {departmentData.length === 0 && !loading && <p className="empty-note">Departments will appear here when data is available.</p>}
            </div>
          </section>

          <section className="panel table-panel" id="subscriptions">
            <div className="table-heading">
              <div><h2>All subscriptions</h2><p>Manage and review your team's services</p></div>
              <span className="record-count">{filtered.length} records</span>
            </div>
            <div className="table-toolbar">
              <div className="search-box"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee, service..." /></div>
              <select value={department} onChange={(e) => setDepartment(e.target.value)} aria-label="Filter by department">
                <option>All departments</option>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Filter by service">
                <option>All services</option>
                {services.map((s) => <option key={s}>{s}</option>)}
              </select>
              {(department !== 'All departments' || service !== 'All services' || search) && <button className="clear-filters" onClick={() => { setDepartment('All departments'); setService('All services'); setSearch(''); }}>Clear</button>}
            </div>

            <div className="table-scroll">
              <table>
                <thead><tr><th>EMPLOYEE</th><th>SERVICE</th><th>DEPARTMENT</th><th>AMOUNT</th><th>START DATE</th><th>END DATE</th><th>STATUS</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan="7" className="table-message">Loading subscriptions...</td></tr>}
                  {!loading && filtered.map((s) => {
                    const days = s.end_date ? (new Date(s.end_date) - new Date()) / 86400000 : Infinity;
                    const status = days < 0 ? 'Expired' : days <= 30 ? 'Renew soon' : 'Active';
                    return (
                      <tr key={s.id}>
                        <td><div className="employee-cell"><div className="employee-avatar">{String(s.employee || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}</div><div><strong>{s.employee}</strong><span>Employee</span></div></div></td>
                        <td><span className={`service-badge ${serviceColor(s.service)}`}><span />{s.service}</span></td>
                        <td><span className="department-label">{s.department}</span></td>
                        <td><strong className="amount-cell">{money(s.amount, s.currency || 'USD')}</strong></td>
                        <td className="date-cell">{dateLabel(s.start_date)}</td>
                        <td className="date-cell">{dateLabel(s.end_date)}</td>
                        <td><span className={`status-badge ${status === 'Active' ? 'status-active' : status === 'Expired' ? 'status-expired' : 'status-renew'}`}><span />{status}</span></td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && <tr><td colSpan="7" className="table-message">No subscriptions match your filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{subscriptions.length}</strong> subscriptions</span><span className="database-note"><CheckCircle2 size={14} /> Synced with database</span></div>
          </section>

          <footer className="footer"><span>© {new Date().getFullYear()} Subly Workspace</span><span>Made for smarter subscription management ✦</span></footer>
        </div>
      </main>
    </div>
  );
}

export default App;
