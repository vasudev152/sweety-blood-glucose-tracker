import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity, LayoutDashboard, ClipboardList, ChartNoAxesCombined,
  LogOut, Menu, X, TrendingUp, TrendingDown, Droplet,
  Clock, CalendarDays
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";
import api from "../services/api";

const slots = [
  { key: "MORNING", label: "Morning fasting", time: "Before breakfast" },
  { key: "AFTER_BREAKFAST", label: "After breakfast", time: "Post meal" },
  { key: "AFTER_LUNCH", label: "After lunch", time: "Post meal" },
  { key: "AFTER_DINNER", label: "After dinner", time: "Post meal" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("sweety_user") || "{}");

  const [readings, setReadings] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [readingResponse, reportResponse] = await Promise.all([
        api.get("/readings", { params: { date: today } }),
        api.get("/readings/reports/daily", { params: { date: today } }),
      ]);

      setReadings(readingResponse.data.readings);
      setReport(reportResponse.data.report);
    } catch (error) {
      console.error("Dashboard loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("sweety_token");
    localStorage.removeItem("sweety_user");
    navigate("/login");
  };

  const chartData = readings.map((reading) => ({
    slot: reading.slotLabel,
    value: reading.glucoseValue,
  }));

  const stats = [
    {
      label: "Today's Average",
      value: report?.average ?? "--",
      unit: "mg/dl",
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Highest Reading",
      value: report?.high ?? "--",
      unit: "mg/dl",
      icon: TrendingUp,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Lowest Reading",
      value: report?.low ?? "--",
      unit: "mg/dl",
      icon: TrendingDown,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Readings",
      value: `${report?.count ?? 0}/4`,
      unit: "today",
      icon: Droplet,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Readings", icon: ClipboardList, path: "/readings" },
    { label: "Reports", icon: ChartNoAxesCombined, path: "/reports" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {mobileMenu && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileMenu(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 p-6 flex flex-col transform transition-transform lg:translate-x-0 ${
        mobileMenu ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex items-center gap-3 mb-12">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Activity className="text-emerald-600" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Sweety</h1>
            <p className="text-xs text-slate-500">Glucose Tracker</p>
          </div>
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase mb-4">
          Main menu
        </p>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path === "/dashboard";

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenu(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-left ${
                  active
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t pt-5">
          <div className="mb-4">
            <p className="font-semibold text-slate-700">{user.name || "User"}</p>
            <p className="text-xs text-slate-400 break-all">{user.email}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-3 text-red-500 hover:bg-red-50 p-3 rounded-xl w-full"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="lg:hidden p-2 rounded-lg bg-white border"
            >
              <Menu size={22} />
            </button>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
                Dashboard
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                Welcome back, {user.name || "there"}!
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-3 rounded-xl border">
            <CalendarDays size={17} />
            {today}
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                    <Icon size={21} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-800">
                  {loading ? "..." : stat.value}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    {stat.unit}
                  </span>
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Glucose trend</h3>
                <p className="text-sm text-slate-400">Today's readings</p>
              </div>
              <Activity className="text-emerald-600" />
            </div>

            <div className="h-72">
              {loading ? (
                <p className="text-center text-slate-400 pt-24">Loading chart...</p>
              ) : chartData.length === 0 ? (
                <p className="text-center text-slate-400 pt-24">No readings recorded today.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                    <YAxis domain={["auto", "auto"]} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#059669" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Today's readings</h3>
            <p className="text-sm text-slate-400 mb-6">Daily tracking progress</p>

            <div className="space-y-5">
              {slots.map((slot) => {
                const reading = readings.find((r) => r.timeSlot === slot.key);

                return (
                  <div key={slot.key} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${reading ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{slot.label}</p>
                        <p className="text-xs text-slate-400">{slot.time}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${reading ? "text-emerald-600" : "text-slate-300"}`}>
                      {reading ? `${reading.glucoseValue} mg/dl` : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => navigate("/readings")}
              className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold p-3 rounded-xl"
            >
              Manage Readings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
