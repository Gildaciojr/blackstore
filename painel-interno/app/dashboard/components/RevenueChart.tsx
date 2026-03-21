"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  name: string;
  value: number;
};

const data: RevenuePoint[] = [
  { name: "Jan", value: 400 },
  { name: "Fev", value: 800 },
  { name: "Mar", value: 600 },
  { name: "Abr", value: 1200 },
  { name: "Mai", value: 900 },
  { name: "Jun", value: 1500 },
];

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
  label?: string;
};

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111114]/95 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.25em] text-white/45">{label}</p>
      <p className="mt-2 text-sm text-white">
        Receita:{" "}
        <span className="text-[var(--gold)] font-medium">
          R$ {payload[0].value}
        </span>
      </p>
    </div>
  );
}

export default function RevenueChart() {
  return (
    <div className="bs-glass border border-white/10 rounded-[28px] p-6 md:p-7 shadow-[0_20px_80px_rgba(0,0,0,0.30)]">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Receita
          </p>

          <h3 className="text-2xl font-light mt-2">
            Evolução de <span className="bs-title">vendas</span>
          </h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
          Últimos 6 meses
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="blackstoreRevenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(212,175,55,0.35)" />
                <stop offset="100%" stopColor="rgba(212,175,55,0)" />
              </linearGradient>
            </defs>

            <CartesianGrid
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />

            <YAxis
              stroke="rgba(255,255,255,0.35)"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--gold)"
              strokeWidth={2.5}
              fill="url(#blackstoreRevenueFill)"
              dot={false}
              activeDot={{
                r: 5,
                stroke: "var(--gold)",
                strokeWidth: 2,
                fill: "#0b0b0d",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}