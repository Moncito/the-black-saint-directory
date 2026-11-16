"use client";

import { useId, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { carePlans, formatPhp } from "@/content/pricing";
import { levels, quote, serviceLines, type Selection } from "@/lib/quote";
import { tick } from "@/lib/sound";

type Status = "idle" | "sending" | "sent" | "invalid" | "not_configured" | "failed";

const errors: Partial<Record<Status, string>> = {
  invalid: "Please add your name and a valid email.",
  not_configured: "The inquiry inbox is not connected yet, so this was not sent.",
  failed: "That did not go through. Please try again in a moment.",
};

function Choice<T extends string>({
  legend,
  value,
  options,
  onChange,
  disabled,
}: {
  legend: string;
  value: T;
  options: { id: T; label: ReactNode; disabled?: boolean }[];
  onChange: (id: T) => void;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset className="quote-field" disabled={disabled}>
      <legend className="t-label text-fog">{legend}</legend>
      <div className="quote-options">
        {options.map((o) => (
          <label key={o.id} className="quote-option t-label">
            <input
              type="radio"
              name={name}
              checked={value === o.id}
              disabled={o.disabled}
              onChange={() => {
                onChange(o.id);
                tick("click");
              }}
            />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * The quote builder. Pick a service, a size, 3D or not and a timeline: the
 * range updates as you go, straight from the price book. It always shows a
 * range, never a fixed number.
 */
export function QuoteBuilder() {
  const id = useId();
  const [sel, setSel] = useState<Selection>({
    service: "editorial",
    pages: 5,
    level: "none",
    rush: false,
    care: "none",
    currency: "PHP",
  });
  const [status, setStatus] = useState<Status>("idle");
  const q = useMemo(() => quote(sel), [sel]);
  const set = (patch: Partial<Selection>) => setSel((s) => ({ ...s, ...patch }));
  const site = sel.service === "editorial" || sel.service === "immersive";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setStatus("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, selection: sel }),
      });
      if (res.ok) return setStatus("sent");
      const body = (await res.json().catch(() => ({}))) as { error?: Status };
      setStatus(body.error && body.error in errors ? body.error : "failed");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <div className="quote">
      <div className="quote__inputs">
        <Choice
          legend="Service"
          value={sel.service}
          options={serviceLines}
          onChange={(service) =>
            set({ service, level: service === "immersive" && sel.level === "none" ? "scene" : sel.level })
          }
        />

        <div className="quote-field" data-off={!site || undefined}>
          <label htmlFor={`${id}-pages`} className="t-label text-fog">
            Pages
          </label>
          <div className="flex items-center gap-5">
            <input
              id={`${id}-pages`}
              type="range"
              className="demo-range"
              min={1}
              max={12}
              step={1}
              value={sel.pages}
              disabled={!site}
              onChange={(e) => set({ pages: Number(e.target.value) })}
            />
            <output htmlFor={`${id}-pages`} className="t-h3 w-10 text-right tabular-nums">
              {sel.pages}
            </output>
          </div>
        </div>

        <div data-off={!site || undefined}>
          <Choice
            legend="3D"
            value={sel.level}
            disabled={!site}
            options={levels.map((l) => ({
              ...l,
              disabled: sel.service === "immersive" && l.id === "none",
            }))}
            onChange={(level) => set({ level })}
          />
        </div>

        <Choice
          legend="Timeline"
          value={sel.rush ? "rush" : "standard"}
          options={[
            { id: "standard", label: "Standard" },
            { id: "rush", label: "Rush" },
          ]}
          onChange={(v) => set({ rush: v === "rush" })}
        />

        <Choice
          legend="Care plan"
          value={sel.care}
          options={[
            { id: "none", label: "None" },
            ...carePlans.map((c) => ({
              id: c.id,
              label: (
                <>
                  {c.name} <span className="text-fog">{formatPhp(c.phpMonthly)}/mo</span>
                </>
              ),
            })),
          ]}
          onChange={(care) => set({ care })}
        />
      </div>

      <div className="quote__result">
        <div className="flex items-start justify-between gap-6">
          <p className="t-label text-fog">{q.package.name}</p>
          <Choice
            legend="Currency"
            value={sel.currency}
            options={[
              { id: "PHP", label: "PHP" },
              { id: "USD", label: "USD" },
            ]}
            onChange={(currency) => set({ currency })}
          />
        </div>

        <p className="quote__range tabular-nums" aria-live="polite">
          {q.range}
        </p>
        {q.currencyNote && <p className="t-label text-fog">{q.currencyNote}</p>}
        <p className="t-body mt-4 max-w-[44ch] text-fog">{q.package.scope}</p>

        <dl className="quote__facts">
          <div>
            <dt className="t-label text-fog">Timeline</dt>
            <dd className="t-h3">
              {q.timeline}
              {q.rush && <span className="t-label ml-3 text-fog">Rush</span>}
            </dd>
          </div>
          <div>
            <dt className="t-label text-fog">Payment terms</dt>
            <dd className="t-h3">{q.terms}</dd>
          </div>
          <div>
            <dt className="t-label text-fog">Recommended care plan</dt>
            <dd className="t-h3">
              {q.recommendedCare.name}
              <span className="t-label ml-3 text-fog">
                {formatPhp(q.recommendedCare.phpMonthly)}/mo
              </span>
            </dd>
          </div>
          {q.followUp && (
            <div>
              <dt className="t-label text-fog">Then — {q.followUp.name}</dt>
              <dd className="t-h3 tabular-nums">
                {q.followUp.range}
                <span className="t-label ml-3 text-fog">{q.followUp.timeline}</span>
              </dd>
            </div>
          )}
        </dl>
        <p className="t-label mt-8 text-fog">{q.note}</p>

        {status === "sent" ? (
          <div className="quote__sent" role="status">
            {/* The serpent draws the checkmark. */}
            <svg viewBox="0 0 140 80" aria-hidden="true" className="quote__check" fill="none">
              <path d="M4 44 C 16 24, 28 58, 42 40 S 58 30, 64 46 L 78 62 L 132 12" pathLength={1} />
            </svg>
            <p className="t-h3">Sent.</p>
            <p className="t-body mt-2 text-fog">{q.note}</p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="quote__form">
            <p className="t-label">Send this to us</p>
            <div className="quote__grid">
              <label className="quote-input">
                <span className="t-label text-fog">Name</span>
                <input name="name" autoComplete="name" required maxLength={120} />
              </label>
              <label className="quote-input">
                <span className="t-label text-fog">Email</span>
                <input name="email" type="email" autoComplete="email" required maxLength={200} />
              </label>
              <label className="quote-input">
                <span className="t-label text-fog">Company</span>
                <input name="company" autoComplete="organization" maxLength={160} />
              </label>
              <label className="quote-input quote-input--wide">
                <span className="t-label text-fog">Message</span>
                <textarea name="message" rows={3} maxLength={4000} />
              </label>
              {/* Honeypot: hidden from people, irresistible to bots. */}
              <label className="quote-trap" aria-hidden="true">
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {errors[status] && (
              <p role="alert" className="t-small mt-4 text-error">
                {errors[status]}
              </p>
            )}
            <button type="submit" disabled={status === "sending"} className="quote__submit t-label">
              {status === "sending" ? "Sending" : "Send this to us"} <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
