import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, CalendarDays, Activity, RefreshCw } from "lucide-react";
import api from "../services/api";

const slots = [
  { value: "MORNING", label: "Morning (fasting)" },
  { value: "AFTER_BREAKFAST", label: "After breakfast" },
  { value: "AFTER_LUNCH", label: "After lunch" },
  { value: "AFTER_DINNER", label: "After dinner" },
];

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata",
});

const emptyForm = {
  readingDate: today,
  timeSlot: "MORNING",
  glucoseValue: "",
};

export default function Readings() {
  const [readings, setReadings] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadReadings();
  }, []);

  const loadReadings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/readings?limit=100");
      setReadings(response.data.readings);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load readings.");
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (reading) => {
    setEditingId(reading.id);
    setForm({
      readingDate: reading.readingDate,
      timeSlot: reading.timeSlot,
      glucoseValue: String(reading.glucoseValue),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const value = Number(form.glucoseValue);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError("Glucose value must be an integer between 40 and 600 mg/dl.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        glucoseValue: value,
      };

      if (editingId) {
        await api.put(`/readings/${editingId}`, payload);
        setSuccess("Reading updated successfully.");
      } else {
        await api.post("/readings", payload);
        setSuccess("Reading added successfully.");
      }

      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadReadings();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save reading.");
    } finally {
      setSaving(false);
    }
  };

  const deleteReading = async (id) => {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.delete(`/readings/${id}`);
      setSuccess("Reading deleted successfully.");
      await loadReadings();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete reading.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Activity size={20} />
              <span className="text-sm font-semibold">SWEETY TRACKER</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Glucose Readings</h1>
            <p className="text-slate-500 mt-2">Manage your daily glucose measurements.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadReadings}
              className="flex items-center gap-2 border bg-white px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <RefreshCw size={18} /> Refresh
            </button>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold"
            >
              <Plus size={19} /> Add Reading
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-5">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl mb-5">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-white border rounded-2xl shadow-sm p-6 mb-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Reading" : "Add New Reading"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-2">Reading date</label>
                <input
                  type="date"
                  required
                  max={today}
                  value={form.readingDate}
                  onChange={(e) => setForm({ ...form, readingDate: e.target.value })}
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Time slot</label>
                <select
                  required
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {slots.map((slot) => (
                    <option key={slot.value} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Glucose (mg/dl)</label>
                <input
                  type="number"
                  required
                  min="40"
                  max="600"
                  step="1"
                  value={form.glucoseValue}
                  onChange={(e) => setForm({ ...form, glucoseValue: e.target.value })}
                  placeholder="Example: 120"
                  className="w-full border rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-semibold"
                >
                  {saving ? "Saving..." : editingId ? "Update Reading" : "Save Reading"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="border px-6 py-3 rounded-xl text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b flex items-center justify-between">
            <div>
              <h2 className="font-bold text-lg text-slate-800">Reading History</h2>
              <p className="text-sm text-slate-400 mt-1">{readings.length} readings loaded</p>
            </div>
            <CalendarDays className="text-emerald-600" />
          </div>

          {loading ? (
            <p className="p-10 text-center text-slate-400">Loading readings...</p>
          ) : readings.length === 0 ? (
            <div className="p-12 text-center">
              <Activity size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-600">No readings yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your first glucose reading.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-sm">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Time slot</th>
                    <th className="p-4">Glucose value</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {readings.map((reading) => (
                    <tr key={reading.id} className="hover:bg-slate-50">
                      <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{reading.readingDate}</td>
                      <td className="p-4 text-sm font-medium text-slate-700">{reading.slotLabel}</td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">{reading.glucoseValue}</span>
                        <span className="text-xs text-slate-400 ml-1">mg/dl</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditForm(reading)}
                            title="Edit reading"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            onClick={() => deleteReading(reading.id)}
                            title="Delete reading"
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 mt-4">
          Readings are personal records. The application accepts values from 40 to 600 mg/dl and allows up to four readings per day.
        </p>
      </div>
    </div>
  );
}
