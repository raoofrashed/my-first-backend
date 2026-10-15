
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  RefreshCw,
  CircleDollarSign,
  CalendarClock,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  CheckCircle2,
  Clock3,
  LogOut,
  UserRound,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import './App.css';

const COLORS = ['#635bff', '#21b8a9', '#f5a623', '#ef6488', '#5795f7'];

const money = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${Number(amount || 0).toFixed(2)} ${currency || 'USD'}`;
  }
};

const getInitials = (name) =>
  String(name || '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateLabel = (value) => {
  const date = parseDate(value);
  return date
    ? date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—';
};

const getStatus = (endDate) => {
  if (!endDate) return 'Active';

  const end = parseDate(endDate);
  if (!end) return 'Active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const days = Math.ceil((end - today) / 86400000);

  if (days < 0) return 'Expired';
  if (days <= 30) return 'Renew soon';
  return 'Active';
};

const serviceColor = (name) => {
  const value = String(name || '').toLowerCase();

  if (value.includes('chatgpt')) return 'purple';
  if (value.includes('claude')) return 'orange';
  if (value.includes('gemini')) return 'blue';
  if (value.includes('canva')) return 'teal';

  return 'gray';
};

function App() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All departments');
  const [service, setService] = useState('All services');

  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('Overview');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Load data from the existing authenticated API.
  const loadSubscriptions = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const token = await getToken();

      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await fetch('/api/subscriptions', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Could not load subscriptions (HTTP ${response.status}).`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('The server returned an unexpected response.');
      }

      setSubscriptions(data);
    } catch (err) {
      setError(
        err.message || 'Could not load subscriptions. Please try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Close dropdown menus when the user presses Escape.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
        setNotificationsOpen(false);
        setMobileMenu(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const departments = useMemo(
    () =>
      [...new Set(
        subscriptions.map((item) => item.department).filter(Boolean)
      )].sort(),
    [subscriptions]
  );

  const services = useMemo(
    () =>
      [...new Set(
        subscriptions.map((item) => item.service).filter(Boolean)
      )].sort(),
    [subscriptions]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return subscriptions.filter((item) => {
      const matchesSearch = [
        item.employee,
        item.service,
        item.department,
      ].some((value) =>
        String(value || '').toLowerCase().includes(query)
      );

      const matchesDepartment =
        department === 'All departments' ||
        item.department === department;

      const matchesService =
        service === 'All services' || item.service === service;

      return matchesSearch && matchesDepartment && matchesService;
    });
  }, [subscriptions, search, department, service]);

  const totalUSD = subscriptions
    .filter((item) => String(item.currency || 'USD').toUpperCase() === 'USD')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalLYD = subscriptions
    .filter((item) => String(item.currency || '').toUpperCase() === 'LYD')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const uniqueEmployees = new Set(
    subscriptions.map((item) => item.employee).filter(Boolean)
  ).size;

  const renewalItems = useMemo(
    () =>
      subscriptions.filter((item) => getStatus(item.end_date) === 'Renew soon'),
    [subscriptions]
  );

  const expiredItems = useMemo(
    () =>
      subscriptions.filter((item) => getStatus(item.end_date) === 'Expired'),
    [subscriptions]
  );

  const departmentData = useMemo(
    () =>
      departments.map((name) => {
        const items = subscriptions.filter(
          (item) => item.department === name
        );

        return {
          name,
          count: items.length,
          totalUSD: items
            .filter(
              (item) =>
                String(item.currency || 'USD').toUpperCase() === 'USD'
            )
            .reduce((sum, item) => sum + Number(item.amount || 0), 0),
          totalLYD: items
            .filter(
              (item) => String(item.currency || '').toUpperCase() === 'LYD'
            )
            .reduce((sum, item) => sum + Number(item.amount || 0), 0),
        };
      }),
    [departments, subscriptions]
  );

  const serviceData = useMemo(
    () =>
      services.map((name) => ({
        name,
        value: subscriptions.filter((item) => item.service === name).length,
      })),
    [services, subscriptions]
  );

  // Display the previous six calendar months, including the current month.
  const monthlyData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1
      );

      const year = date.getFullYear();
      const month = date.getMonth();

      const spending = subscriptions
        .filter(
          (item) =>
            String(item.currency || 'USD').toUpperCase() === 'USD' &&
            parseDate(item.start_date)
        )
        .filter((item) => {
          const start = parseDate(item.start_date);

          return (
            start.getFullYear() === year &&
            start.getMonth() === month
          );
        })
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        spending,
      };
    });
  }, [subscriptions]);

  const navigateTo = (section, elementId) => {
    setActiveSection(section);
    setMobileMenu(false);
    setProfileMenuOpen(false);
    setNotificationsOpen(false);

    document.getElementById(elementId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const clearFilters = () => {
    setDepartment('All departments');
    setService('All services');
    setSearch('');
  };

  const adminName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress ||
    'Admin';

  const initials = getInitials(adminName);

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="mobile-overlay"
          onClick={() => setMobileMenu(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={22} />
          </div>

          <div>
            <strong>subly</strong>
            <span>WORKSPACE</span>
          </div>

          <button
            className="close-menu"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          >
            <X />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-list">
          <button
            className={`nav-item ${activeSection === 'Overview' ? 'active' : ''}`}
            onClick={() => navigateTo('Overview', 'overview')}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>

          <button
            className={`nav-item ${activeSection === 'Subscriptions' ? 'active' : ''}`}
            onClick={() => navigateTo('Subscriptions', 'subscriptions')}
          >
            <CreditCard size={18} />
            Subscriptions
            <span className="nav-count">{subscriptions.length}</span>
          </button>

          <button
            className={`nav-item ${activeSection === 'Departments' ? 'active' : ''}`}
            onClick={() => navigateTo('Departments', 'departments')}
          >
            <Users size={18} />
            Departments
          </button>

          <button
            className={`nav-item ${activeSection === 'Analytics' ? 'active' : ''}`}
            onClick={() => navigateTo('Analytics', 'analytics')}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </nav>

        <div className="workspace-label tools-label">PREFERENCES</div>

        <nav className="nav-list">
          <button
            className="nav-item"
            onClick={() => {
              setMobileMenu(false);
              setProfileMenuOpen(false);
              openUserProfile();
            }}
          >
            <Settings size={18} />
            Account settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Sparkles size={17} />
            </div>
            <strong>Your workspace</strong>
            <p>Your subscriptions, all in one place.</p>
          </div>

          <div className="profile">
            <div className="avatar">{initials}</div>

            <div className="profile-text">
              <strong>{adminName}</strong>
              <span>Workspace owner</span>
            </div>

            <button
              className="icon-button"
              aria-label="Open account menu"
              aria-expanded={profileMenuOpen}
              onClick={() => {
                setProfileMenuOpen((open) => !open);
                setNotificationsOpen(false);
              }}
            >
              <ChevronDown size={16} />
            </button>

            {profileMenuOpen && (
              <div className="subly-dropdown profile-dropdown">
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    openUserProfile();
                  }}
                >
                  <UserRound size={16} /> Account profile
                </button>

                <button
                  onClick={() => signOut({ redirectUrl: '/' })}
                >
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setMobileMenu(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activeSection}</strong>
          </div>

          <div className="topbar-actions">
            <span className="live-status">
              <span /> Database connected
            </span>

            <div className="dropdown-anchor">
              <button
                className="icon-button"
                aria-label="Notifications"
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setProfileMenuOpen(false);
                }}
              >
                <Bell size={19} />
                {(renewalItems.length > 0 || expiredItems.length > 0) && (
                  <i />
                )}
              </button>

              {notificationsOpen && (
                <div className="subly-dropdown notifications-dropdown">
                  <div className="dropdown-heading">
                    <strong>Notifications</strong>
                    <span>
                      {renewalItems.length + expiredItems.length}
                    </span>
                  </div>

                  {renewalItems.length === 0 && expiredItems.length === 0 ? (
                    <div className="dropdown-empty">
                      <CheckCircle2 size={20} />
                      <p>You're all caught up!</p>
                      <span>No upcoming renewals or expired subscriptions.</span>
                    </div>
                  ) : (
                    <>
                      {renewalItems.slice(0, 5).map((item) => (
                        <button
                          className="notification-item"
                          key={`renewal-${item.id}`}
                          onClick={() =>
                            navigateTo('Subscriptions', 'subscriptions')
                          }
                        >
                          <Clock3 size={17} />
                          <span>
                            <strong>{item.service || 'Subscription'}</strong>
                            <small>
                              {item.employee || 'Employee'} · Renewal soon
                            </small>
                          </span>
                        </button>
                      ))}

                      {expiredItems.slice(0, 5).map((item) => (
                        <button
                          className="notification-item"
                          key={`expired-${item.id}`}
                          onClick={() =>
                            navigateTo('Subscriptions', 'subscriptions')
                          }
                        >
                          <AlertCircle size={17} />
                          <span>
                            <strong>{item.service || 'Subscription'}</strong>
                            <small>
                              {item.employee || 'Employee'} · Expired
                            </small>
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  <button
                    className="dropdown-footer"
                    onClick={() =>
                      navigateTo('Subscriptions', 'subscriptions')
                    }
                  >
                    View all subscriptions <ExternalLink size={14} />
                  </button>
                </div>
              )}
            </div>

            <button
              className="top-avatar"
              aria-label="Open account profile"
              onClick={openUserProfile}
            >
              {initials}
            </button>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row" id="overview">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dot" />
                SUBSCRIPTION MANAGEMENT
              </div>

              <h1>
                Good to see you, {user?.firstName || 'Admin'} <span>✦</span>
              </h1>

              <p className="subtitle">
                Here's what's happening with your team's AI subscriptions.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={() => loadSubscriptions(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'refresh-spinning' : ''}
              />
              {refreshing ? 'Refreshing...' : 'Refresh data'}
            </button>
          </section>

          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button onClick={() => loadSubscriptions(true)}>
                Try again
              </button>
            </div>
          )}

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon violet">
                  <CreditCard size={20} />
                </span>
                <span className="stat-caption">ALL RECORDS</span>
              </div>

              <div className="stat-value">
                {loading ? '—' : subscriptions.length}
              </div>

              <div className="stat-bottom">
                <span className="stat-neutral">Subscriptions</span>
                <span className="stat-foot-icon violet-text">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon mint">
                  <CircleDollarSign size={20} />
                </span>
                <span className="stat-caption">USD ONLY</span>
              </div>

              <div className="stat-value">
                {loading ? '—' : money(totalUSD)}
              </div>

              <div className="stat-bottom">
                <span className="stat-neutral">Combined listed amounts</span>
                <span className="stat-foot-icon mint-text">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon amber">
                  <Users size={20} />
                </span>
                <span className="stat-caption">TEAM MEMBERS</span>
              </div>

              <div className="stat-value">
                {loading ? '—' : uniqueEmployees}
              </div>

              <div className="stat-bottom">
                <span className="stat-neutral">Unique employees</span>
                <span className="stat-foot-icon amber-text">
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </article>

            <article className="stat-card">
              <div className="stat-top">
                <span className="stat-icon rose">
                  <CalendarClock size={20} />
                </span>
                <span className="stat-caption">RENEWALS SOON</span>
              </div>

              <div className="stat-value">
                {loading ? '—' : renewalItems.length}
              </div>

              <div className="stat-bottom">
                <span className="stat-neutral">Within the next 30 days</span>
                <span className="stat-foot-icon rose-text">
                  <Clock3 size={16} />
                </span>
              </div>
            </article>
          </section>

          <section className="charts-grid" id="analytics">
            <article className="panel spending-panel">
              <div className="panel-heading">
                <div>
                  <h2>Subscription spending</h2>
                  <p>USD amounts by subscription start month</p>
                </div>
                <span className="period-chip">Last 6 months</span>
              </div>

              <div className="chart-total">
                {money(totalUSD)} <span>USD listed</span>
              </div>

              <div className="area-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyData}
                    margin={{ top: 12, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="spendingGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#7167f8"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#7167f8"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="#edf0f6"
                      strokeDasharray="4 5"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9299ab', fontSize: 12 }}
                      dy={10}
                    />

                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: '#9299ab', fontSize: 11 }}
                    />

                    <Tooltip
                      formatter={(value) => [money(value), 'USD listed']}
                    />

                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke="#7167f8"
                      strokeWidth={3}
                      fill="url(#spendingGradient)"
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <p className="chart-note">
                Monthly totals are grouped by subscription start date. These
                represent listed amounts, not necessarily actual payments made
                in each month.
              </p>
            </article>

            <article className="panel service-panel">
              <div className="panel-heading">
                <div>
                  <h2>Service distribution</h2>
                  <p>Subscriptions by platform</p>
                </div>
                <span className="round-icon">
                  <BarChart3 size={18} />
                </span>
              </div>

              <div className="donut-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {serviceData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <strong>{subscriptions.length}</strong>
                  <span>Total records</span>
                </div>
              </div>

              <div className="legend-list">
                {serviceData.map((entry, index) => (
                  <button
                    className="legend-row"
                    key={entry.name}
                    onClick={() => {
                      setService(entry.name);
                      navigateTo('Subscriptions', 'subscriptions');
                    }}
                  >
                    <span className="legend-name">
                      <i
                        style={{
                          background: COLORS[index % COLORS.length],
                        }}
                      />
                      {entry.name}
                    </span>
                    <strong>{entry.value}</strong>
                  </button>
                ))}

                {serviceData.length === 0 && !loading && (
                  <p className="empty-note">No service data yet.</p>
                )}
              </div>
            </article>
          </section>

          <section className="panel departments-panel" id="departments">
            <div className="panel-heading">
              <div>
                <h2>Department overview</h2>
                <p>How subscriptions are distributed across your team</p>
              </div>

              <button
                className="text-link"
                onClick={() => {
                  setDepartment('All departments');
                  navigateTo('Subscriptions', 'subscriptions');
                }}
              >
                View subscriptions <ExternalLink size={14} />
              </button>
            </div>

            <div className="department-grid">
              {departmentData.map((dept, index) => (
                <button
                  className="department-card"
                  key={dept.name}
                  onClick={() => {
                    setDepartment(dept.name);
                    navigateTo('Subscriptions', 'subscriptions');
                  }}
                >
                  <div className="department-card-top">
                    <span
                      className="department-dot"
                      style={{
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                    <span>
                      {dept.count}{' '}
                      {dept.count === 1 ? 'subscription' : 'subscriptions'}
                    </span>
                  </div>

                  <h3>{dept.name}</h3>

                  <div className="department-spend">
                    {money(dept.totalUSD)} <span>USD</span>
                  </div>

                  {dept.totalLYD > 0 && (
                    <div className="department-lyd">
                      {money(dept.totalLYD, 'LYD')}
                    </div>
                  )}

                  <div className="department-progress">
                    <span
                      style={{
                        width: `${
                          subscriptions.length
                            ? (dept.count / subscriptions.length) * 100
                            : 0
                        }%`,
                        background: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </button>
              ))}

              {departmentData.length === 0 && !loading && (
                <p className="empty-note">
                  Departments will appear here when data is available.
                </p>
              )}
            </div>

            {totalLYD > 0 && (
              <p className="chart-note">
                Listed LYD amounts across all departments: {money(totalLYD, 'LYD')}.
                USD and LYD totals are kept separate and are not converted.
              </p>
            )}
          </section>

          <section className="panel table-panel" id="subscriptions">
            <div className="table-heading">
              <div>
                <h2>All subscriptions</h2>
                <p>Manage and review your team's services</p>
              </div>
              <span className="record-count">{filtered.length} records</span>
            </div>

            <div className="table-toolbar">
              <div className="search-box">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee, service..."
                  aria-label="Search subscriptions"
                />
              </div>

              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                aria-label="Filter by department"
              >
                <option>All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={service}
                onChange={(event) => setService(event.target.value)}
                aria-label="Filter by service"
              >
                <option>All services</option>
                {services.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              {(department !== 'All departments' ||
                service !== 'All services' ||
                search) && (
                <button className="clear-filters" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>EMPLOYEE</th>
                    <th>SERVICE</th>
                    <th>DEPARTMENT</th>
                    <th>AMOUNT</th>
                    <th>START DATE</th>
                    <th>END DATE</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan="7" className="table-message">
                        Loading subscriptions...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filtered.map((item) => {
                      const status = getStatus(item.end_date);

                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="employee-cell">
                              <div className="employee-avatar">
                                {getInitials(item.employee)}
                              </div>
                              <div>
                                <strong>{item.employee || 'Unknown'}</strong>
                                <span>Employee</span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span
                              className={`service-badge ${serviceColor(item.service)}`}
                            >
                              <span />
                              {item.service || 'Unknown'}
                            </span>
                          </td>

                          <td>
                            <span className="department-label">
                              {item.department || 'Unassigned'}
                            </span>
                          </td>

                          <td>
                            <strong className="amount-cell">
                              {money(item.amount, item.currency || 'USD')}
                            </strong>
                          </td>

                          <td className="date-cell">
                            {dateLabel(item.start_date)}
                          </td>

                          <td className="date-cell">
                            {dateLabel(item.end_date)}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                status === 'Active'
                                  ? 'status-active'
                                  : status === 'Expired'
                                    ? 'status-expired'
                                    : 'status-renew'
                              }`}
                            >
                              <span />
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan="7" className="table-message">
                        No subscriptions match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filtered.length}</strong> of{' '}
                <strong>{subscriptions.length}</strong> subscriptions
              </span>

              <span className="database-note">
                <CheckCircle2 size={14} /> Synced with database
              </span>
            </div>
          </section>

          <footer className="footer">
            <span>© {new Date().getFullYear()} Subly Workspace</span>
            <span>Made for smarter subscription management ✦</span>
          </footer>
        </div>
      </main>

      <style>{`
        .subly-dropdown {
          position: absolute;
          z-index: 100;
          min-width: 220px;
          padding: 8px;
          border: 1px solid #e8eaf2;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 12px 36px rgba(28, 35, 60, 0.14);
          color: #25283a;
        }

        .subly-dropdown button {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: inherit;
          text-align: left;
          cursor: pointer;
          font: inherit;
        }

        .subly-dropdown button:hover {
          background: #f4f5fb;
        }

        .profile {
          position: relative;
        }

        .profile-dropdown {
          bottom: calc(100% + 8px);
          left: 0;
        }

        .dropdown-anchor {
          position: relative;
        }

        .notifications-dropdown {
          top: calc(100% + 12px);
          right: 0;
          width: 310px;
          max-width: calc(100vw - 32px);
        }

        .dropdown-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px;
          border-bottom: 1px solid #edf0f6;
        }

        .dropdown-heading span {
          display: grid;
          place-items: center;
          min-width: 24px;
          height: 24px;
          border-radius: 20px;
          background: #f0efff;
          color: #635bff;
          font-size: 12px;
        }

        .subly-dropdown .notification-item {
          align-items: flex-start;
          padding: 12px 10px;
        }

        .notification-item > svg {
          flex-shrink: 0;
          margin-top: 2px;
          color: #7770e8;
        }

        .notification-item span {
          display: grid;
          gap: 4px;
        }

        .notification-item small {
          color: #777d90;
          line-height: 1.4;
        }

        .dropdown-empty {
          display: grid;
          justify-items: center;
          gap: 7px;
          padding: 22px 12px;
          text-align: center;
        }

        .dropdown-empty svg {
          color: #21b8a9;
        }

        .dropdown-empty p {
          margin: 0;
          font-weight: 600;
        }

        .dropdown-empty span {
          color: #777d90;
          font-size: 12px;
          line-height: 1.5;
        }

        .subly-dropdown .dropdown-footer {
          justify-content: center;
          margin-top: 5px;
          border-top: 1px solid #edf0f6;
          color: #635bff;
          font-size: 13px;
        }

        .legend-row {
          width: 100%;
          border: 0;
          background: transparent;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        .legend-row:hover {
          background: #f7f7fc;
        }

        .error-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .error-banner button {
          padding: 6px 10px;
          border: 1px solid currentColor;
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
        }

        .refresh-spinning {
          animation: subly-spin 1s linear infinite;
        }

        @keyframes subly-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .refresh-spinning {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
