import { useEffect, useState } from "react";
import { Activity, CalendarDays, TrendingUp, TrendingDown, BarChart3, RefreshCw } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import api from "../services/api";

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata",
});

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white border rounded-2xl p-5 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-3">
            {value ?? "--"}
          </h3>
          <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
        </div>
        <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ReportCards({ report }) {
  if (!report) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total readings" value={report.count ?? 0} subtitle="Recorded measurements" icon={Activity} />
      <StatCard title="Average glucose" value={report.average != null ? `${report.average} mg/dl` : "--"} subtitle="Average measurement" icon={BarChart3} />
      <StatCard title="Highest reading" value={report.high != null ? `${report.high} mg/dl` : "--"} subtitle="Maximum measurement" icon={TrendingUp} />
      <StatCard title="Lowest reading" value={report.low != null ? `${report.low} mg/dl` : "--"} subtitle="Minimum measurement" icon={TrendingDown} />
    </div>
  );
}

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [dailyReport, setDailyReport] = useState(null);
  const [monthReport, setMonthReport] = useState(null);
  const [previousReport, setPreviousReport] = useState(null);
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const [daily, month, previous, readingList] = await Promise.all([
        api.get(`/readings/reports/daily?date=${selectedDate}`),
        api.get("/readings/reports/month-to-date"),
        api.get("/readings/reports/previous-month"),
        api.get(`/readings?date=${selectedDate}`),
      ]);

      setDailyReport(daily.data);
      setMonthReport(month.data);
      setPreviousReport(previous.data);
      setReadings(readingList.data.readings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [selectedDate]);

  const chartData = readings.map((reading) => ({
    slot: reading.slotLabel,
    glucose: reading.glucoseValue,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <BarChart3 size={20} />
              <span className="text-sm font-semibold">SWEETY TRACKER</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Reports & Analytics</h1>
            <p className="text-slate-500 mt-2">Review your glucose measurements and trends.</p>
          </div>

          <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2">
            <CalendarDays size={18} className="text-emerald-600" />
            <input
              type="date"
              max={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="outline-none text-sm text-slate-700"
            />
            <button
              onClick={loadReports}
              title="Refresh reports"
              className="p-2 text-slate-500 hover:text-emerald-600"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-slate-400">
            Loading reports...
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-slate-800">Daily Report</h2>
                <p className="text-sm text-slate-500 mt-1">{selectedDate}</p>
              </div>
              <ReportCards report={dailyReport?.report} />
            </section>

            <section className="bg-white border rounded-2xl p-5 sm:p-6 shadow-sm mb-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Daily Glucose Chart</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Glucose readings for the selected date
                </p>
              </div>

              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  No readings available for this date.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 15, left: 0, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="slot" angle={-15} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="glucose" name="Glucose (mg/dl)" fill="#059669" radius={[7, 7, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Month-to-Date Report</h2>
              <ReportCards report={monthReport?.report} />
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Previous Month Report</h2>
              <ReportCards report={previousReport?.report} />
            </section>
          </>
        )}

        <p className="text-xs text-slate-400 mt-6">
          These reports summarize recorded measurements. They are not a medical diagnosis or a substitute for advice from a healthcare professional.
        </p>
      </div>
    </div>
  );
}

