import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, User, Mail, Lock } from "lucide-react";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", form);

      localStorage.setItem("sweety_token", response.data.token);
      localStorage.setItem("sweety_user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center mb-5">
          <div className="bg-emerald-100 p-4 rounded-2xl">
            <Activity size={34} className="text-emerald-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-800">
          Create your account
        </h1>
        <p className="text-center text-slate-500 mt-2 mb-8">
          Start tracking your glucose levels
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Full name</label>
            <div className="flex items-center border rounded-xl px-3">
              <User size={18} className="text-slate-400" />
              <input
                required
                minLength={2}
                maxLength={100}
                className="w-full p-3 outline-none"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email address</label>
            <div className="flex items-center border rounded-xl px-3">
              <Mail size={18} className="text-slate-400" />
              <input
                type="email"
                required
                className="w-full p-3 outline-none"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="flex items-center border rounded-xl px-3">
              <Lock size={18} className="text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                className="w-full p-3 outline-none"
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold p-3 rounded-xl"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already registered?{" "}
          <Link to="/login" className="text-emerald-600 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
