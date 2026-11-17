import { useId, type ReactNode } from 'react';

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  hint?: ReactNode;
  step?: number;
  min?: number;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-medium text-white/90">
        {label}
      </label>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/60">{prefix}</span>}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={`field num ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-10' : ''}`}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-white/60">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-mist">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; sub?: string }[];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const name = useId();
  return (
    <fieldset>
      <legend className="mb-2 text-[14px] font-medium text-white/90">{label}</legend>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(options.length, 3)}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <label
              key={o.value}
              className={`flex min-h-[48px] cursor-pointer flex-col justify-center rounded-[6px] border px-3.5 py-2.5 transition-colors ${
                on ? 'border-signal bg-signal/15' : 'border-rule bg-panel-2 hover:border-slate'
              }`}
            >
              <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
              <span className="text-[14px] font-medium">{o.label}</span>
              {o.sub && <span className="mt-0.5 text-[12px] text-mist">{o.sub}</span>}
            </label>
          );
        })}
      </div>
      {hint && <p className="mt-1.5 text-[13px] text-mist">{hint}</p>}
    </fieldset>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  hint?: ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[14px] font-medium text-white/90">
        {label}
      </label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className="field appearance-none">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-[13px] text-mist">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: 'pass' | 'action' | 'check' }) {
  const map = {
    pass: 'bg-ok text-black',
    action: 'bg-risk text-black',
    check: 'bg-warn text-black',
  } as const;
  const text = { pass: 'Pass', action: 'Action', check: 'Check' }[status];
  return <span className={`eyebrow inline-block w-[66px] shrink-0 rounded-[3px] py-1 text-center !text-[10px] font-semibold ${map[status]}`}>{text}</span>;
}
