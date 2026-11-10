import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, Mail, Lock } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
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
      const response = await api.post("/auth/login", form);

      localStorage.setItem("sweety_token", response.data.token);
      localStorage.setItem("sweety_user", JSON.stringify(response.data.user));

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        <div className="flex justify-center mb-5">
          <div className="bg-emerald-100 p-4 rounded-2xl">
            <Activity size={34} className="text-emerald-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center text-slate-800">
          Welcome to Sweety
        </h1>
        <p className="text-center text-slate-500 mt-2 mb-8">
          Sign in to manage your glucose readings
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full p-3 outline-none"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold p-3 rounded-xl"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-emerald-600 font-semibold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
