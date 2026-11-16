"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";

const STATUSES = ["New", "Paid", "Packed", "Shipped"] as const;
type Order = { id: number; amount: number; status: number };

const POINTS = 36;
const seedSeries = () =>
  Array.from({ length: POINTS }, (_, i) => 42 + Math.sin(i / 3.1) * 14 + Math.sin(i / 1.3) * 6);

const peso = (n: number) => `₱${Math.round(n).toLocaleString("en-PH")}`;

/**
 * Systems demo: a small live dashboard. Everything on it is simulated in the
 * browser — it says so — but it moves the way a real one would: orders arrive,
 * advance through their statuses, and the totals and chart follow.
 */
export function SystemsDashboard() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const root = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [series, setSeries] = useState(seedSeries);
  const [orders, setOrders] = useState<Order[]>(() =>
    [1046, 1045, 1044, 1043, 1042].map((id, i) => ({
      id,
      amount: [2450, 980, 5120, 1675, 3300][i],
      status: Math.min(i, 3),
    })),
  );
  const [revenue, setRevenue] = useState(84250);

  // Only run while on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!live || reducedMotion) return;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      setSeries((s) => {
        const last = s[s.length - 1];
        const next = Math.max(18, Math.min(78, last + (Math.random() - 0.48) * 12));
        return [...s.slice(1), next];
      });
      setOrders((list) => {
        let next = list.map((o) => ({ ...o }));
        // One order moves forward each tick…
        const movable = next.filter((o) => o.status < 3);
        if (movable.length) movable[Math.floor(Math.random() * movable.length)].status++;
        // …and every third tick a new one arrives.
        if (n % 3 === 0) {
          const amount = 600 + Math.round(Math.random() * 48) * 100;
          next = [{ id: next[0].id + 1, amount, status: 0 }, ...next].slice(0, 6);
          setRevenue((r) => r + amount);
        }
        return next;
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, [live, reducedMotion]);

  const max = 84;
  const path = series
    .map((v, i) => `${i === 0 ? "M" : "L"} ${((i / (POINTS - 1)) * 100).toFixed(2)} ${(100 - (v / max) * 100).toFixed(2)}`)
    .join(" ");
  const open = orders.filter((o) => o.status < 3).length;

  return (
    <div ref={root} className="demo demo--dash">
      <div className="dash__head">
        <span className="t-label">Operations</span>
        <span className="t-label text-fog">
          <i aria-hidden="true" className="dash__pulse" /> Demo data · simulated in your browser
        </span>
      </div>

      <dl className="dash__kpis">
        <div>
          <dt className="t-label text-fog">Revenue today</dt>
          <dd className="t-h2 tabular-nums">{peso(revenue)}</dd>
        </div>
        <div>
          <dt className="t-label text-fog">Open orders</dt>
          <dd className="t-h2 tabular-nums">{String(open).padStart(2, "0")}</dd>
        </div>
        <div>
          <dt className="t-label text-fog">Latest order</dt>
          <dd className="t-h2 tabular-nums">#{orders[0].id}</dd>
        </div>
      </dl>

      <div className="dash__body">
        <figure className="dash__chart">
          <figcaption className="t-label text-fog">Orders per minute</figcaption>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d={`${path} L 100 100 L 0 100 Z`} className="dash__area" />
            <path d={path} className="dash__line" vectorEffect="non-scaling-stroke" />
          </svg>
        </figure>

        <div className="dash__queue">
          <p className="t-label text-fog">Order queue</p>
          <ul>
            {orders.map((order) => (
              <li key={order.id} className="dash__row">
                <span className="t-label tabular-nums">#{order.id}</span>
                <span className="t-small tabular-nums text-fog">{peso(order.amount)}</span>
                <span className="dash__status t-label" data-status={order.status}>
                  {STATUSES[order.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
