"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
  CartesianGrid, Legend,
} from "recharts";

interface RecentExpense {
  id: string;
  amount: number;
  description: string;
  date: string;
  receipt: string | null;
  category: { name: string; color: string };
}

interface Stats {
  total: number;
  prevTotal: number;
  count: number;
  byCategory: { name: string; color: string; total: number; count: number }[];
  dailyTotals: { date: string; amount: number; cumulative: number }[];
  weeklyTotals: { week: string; amount: number }[];
  alerts: { category: string; budget: number; spent: number; percentage: number }[];
  recentExpenses: RecentExpense[];
  topExpense: { amount: number; description: string; category: string } | null;
  allTimeRecent: RecentExpense[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    fetch(`/api/expenses/stats?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then(setStats);
  }, [month, year]);

  if (!stats) return <div className="animate-pulse text-gray-400 p-8">Cargando estadisticas...</div>;

  const monthDiff = stats.prevTotal > 0
    ? Math.round(((stats.total - stats.prevTotal) / stats.prevTotal) * 100)
    : null;

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return (
    <div className="space-y-6">
      {/* Header with month selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (month === 1) { setMonth(12); setYear(year - 1); }
              else setMonth(month - 1);
            }}
            className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 text-sm"
          >
            &larr;
          </button>
          <span className="text-sm font-medium px-3 py-1.5 bg-white border rounded-lg min-w-[120px] text-center">
            {monthNames[month - 1]} {year}
          </span>
          <button
            onClick={() => {
              if (month === 12) { setMonth(1); setYear(year + 1); }
              else setMonth(month + 1);
            }}
            className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-50 text-sm"
          >
            &rarr;
          </button>
        </div>
      </div>

      {/* Budget alerts */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((a) => (
            <div
              key={a.category}
              className={`p-3 rounded-lg text-sm font-medium ${
                a.percentage >= 100
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-yellow-50 text-yellow-700 border border-yellow-200"
              }`}
            >
              {a.percentage >= 100 ? "Excedido" : "Alerta"}: {a.category} - Gastado ${a.spent.toFixed(2)} de ${a.budget.toFixed(2)} ({a.percentage}%)
            </div>
          ))}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total del Mes</p>
          <p className="text-3xl font-bold text-indigo-600">${stats.total.toFixed(2)}</p>
          {monthDiff !== null && (
            <p className={`text-xs mt-1 font-medium ${monthDiff > 0 ? "text-red-500" : "text-green-500"}`}>
              {monthDiff > 0 ? "+" : ""}{monthDiff}% vs mes anterior
            </p>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Transacciones</p>
          <p className="text-3xl font-bold">{stats.count}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.byCategory.length} categorias</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Promedio por Gasto</p>
          <p className="text-3xl font-bold">${stats.count ? (stats.total / stats.count).toFixed(2) : "0.00"}</p>
          <p className="text-xs text-gray-400 mt-1">por transaccion</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Mayor Gasto</p>
          {stats.topExpense ? (
            <>
              <p className="text-3xl font-bold text-orange-500">${stats.topExpense.amount.toFixed(2)}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{stats.topExpense.description}</p>
            </>
          ) : (
            <p className="text-3xl font-bold text-gray-300">-</p>
          )}
        </div>
      </div>

      {/* Charts row 1: Cumulative area + Daily bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-4">Gasto Acumulado del Mes</h2>
          {stats.dailyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={stats.dailyTotals}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name === "cumulative" ? "Acumulado" : "Dia"]}
                  labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                />
                <Area type="monotone" dataKey="cumulative" stroke="#6366f1" strokeWidth={2} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No hay datos este mes</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-4">Gastos por Dia</h2>
          {stats.dailyTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.dailyTotals}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, "Monto"]}
                  labelFormatter={(l) => `Dia ${String(l).slice(8)}`}
                />
                <Bar dataKey="amount" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No hay datos este mes</p>
          )}
        </div>
      </div>

      {/* Charts row 2: Pie + Horizontal bars by category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-4">Distribucion por Categoria</h2>
          {stats.byCategory.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.byCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    strokeWidth={2}
                  >
                    {stats.byCategory.map((c) => (
                      <Cell key={c.name} fill={c.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm flex-1">
                {stats.byCategory.map((c) => {
                  const pct = stats.total > 0 ? Math.round((c.total / stats.total) * 100) : 0;
                  return (
                    <div key={c.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="flex-1">{c.name}</span>
                      <span className="text-gray-500 tabular-nums">${c.total.toFixed(2)}</span>
                      <span className="text-gray-400 text-xs w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No hay datos este mes</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-4">Comparativa por Categoria</h2>
          {stats.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.byCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                  {stats.byCategory.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm">No hay datos este mes</p>
          )}
        </div>
      </div>

      {/* Weekly comparison */}
      {stats.weeklyTotals.some((w) => w.amount > 0) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="font-semibold mb-4">Gastos por Semana</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weeklyTotals}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Total"]} />
              <Legend />
              <Bar dataKey="amount" name="Gasto semanal" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent expenses */}
      {(() => {
        const expensesToShow = stats.recentExpenses.length > 0
          ? stats.recentExpenses
          : stats.allTimeRecent;
        const isAllTime = stats.recentExpenses.length === 0 && stats.allTimeRecent.length > 0;

        return (
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold">
                {isAllTime ? "Ultimos Gastos (todos los meses)" : "Gastos del Mes"}
              </h2>
              {isAllTime && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  No hay gastos en {monthNames[month - 1]} {year}
                </span>
              )}
            </div>
            {expensesToShow.length === 0 ? (
              <p className="p-6 text-gray-400 text-sm">No hay gastos registrados. Ve a Gastos o Escanear para agregar.</p>
            ) : (
              <div className="divide-y">
                {expensesToShow.map((exp) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      {exp.receipt ? (
                        <a href={exp.receipt} target="_blank" rel="noopener noreferrer">
                          <img src={exp.receipt} alt="Recibo" className="w-9 h-9 rounded object-cover border" />
                        </a>
                      ) : (
                        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ backgroundColor: exp.category.color + "20" }}>
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: exp.category.color }} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{exp.description}</p>
                        <p className="text-xs text-gray-500">
                          {exp.category.name} - {new Date(exp.date).toLocaleDateString("es")}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">${exp.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
