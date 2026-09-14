"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { addDays, isIsoDate, toIsoDate, todayIso } from "@/shared/lib/dates";
import { floatingStyle, useDismiss, useFloating } from "./floating";

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const parse = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const triggerFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** Six Monday-first weeks covering the month: the grid never changes height. */
function monthGrid(year: number, month: number): string[] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => toIsoDate(new Date(year, month, 1 - offset + index)));
}

function addMonths(iso: string, months: number): string {
  const date = parse(iso);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return toIsoDate(target);
}

export type DatePreset = { label: string; value: () => string };

type Props = {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  /** Earliest selectable day, ISO. */
  min?: string;
  invalid?: boolean;
  presets?: DatePreset[];
  onBlur?: () => void;
  "aria-label"?: string;
};

/**
 * Calendar date picker: the trigger shows the date in words, the popover holds a
 * month grid and preset buttons ("Today" first). Keyboard: arrows move by day and
 * week, PageUp/PageDown by month, Home/End to the week's ends, Enter picks, Esc closes.
 */
export function DatePicker({ value, onChange, id, min, invalid, presets = [], onBlur, ...aria }: Props) {
  const [open, setOpen] = React.useState(false);
  const [focus, setFocus] = React.useState(() => (isIsoDate(value) ? value : todayIso()));
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  // The whole calendar, presets included, should be visible: flip up rather than scroll.
  const position = useFloating(open, triggerRef, { width: 296, preferredHeight: 360, flipBelow: 340 });
  const today = todayIso();

  const view = parse(focus);
  const days = monthGrid(view.getFullYear(), view.getMonth());
  const allPresets: DatePreset[] = [{ label: "Today", value: todayIso }, ...presets];

  const openPanel = () => {
    setFocus(isIsoDate(value) ? value : today);
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const pick = (iso: string) => {
    if (min && iso < min) return;
    onChange(iso);
    close();
  };

  useDismiss(open, [triggerRef, panelRef], () => close(false));

  const positioned = Boolean(position);
  React.useEffect(() => {
    if (!open || !positioned) return;
    panelRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focus}"]`)?.focus({ preventScroll: true });
  }, [open, positioned, focus]);

  const onGridKeyDown = (event: React.KeyboardEvent) => {
    const weekday = (parse(focus).getDay() + 6) % 7;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
      Home: () => addDays(focus, -weekday),
      End: () => addDays(focus, 6 - weekday),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setFocus(moves[event.key]());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(focus);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-invalid={invalid || undefined}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openPanel();
          }
        }}
        onBlur={onBlur}
        className="tnum flex h-10 w-full items-center gap-2 border border-rule bg-panel px-3 text-left text-sm text-ink transition-colors hover:border-ink-faint aria-expanded:border-ink data-[invalid=true]:border-signal"
      >
        <span className="min-w-0 flex-1 truncate">
          {isIsoDate(value) ? triggerFormat.format(parse(value)) : "Pick a date"}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
      </button>

      {open && position
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Choose a date"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  close();
                }
              }}
              style={floatingStyle(position, true)}
              className="overflow-y-auto border border-ink bg-panel p-3 text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,.5)]"
            >
              <div className="flex items-center justify-between gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => setFocus(addMonths(focus, -1))}
                  aria-label="Previous month"
                  className="grid h-8 w-8 place-items-center text-ink-soft hover:bg-panel-sunken hover:text-ink"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-sm font-semibold tracking-tight" aria-live="polite">
                  {monthFormat.format(view)}
                </p>
                <button
                  type="button"
                  onClick={() => setFocus(addMonths(focus, 1))}
                  aria-label="Next month"
                  className="grid h-8 w-8 place-items-center text-ink-soft hover:bg-panel-sunken hover:text-ink"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div role="grid" aria-label={monthFormat.format(view)} onKeyDown={onGridKeyDown}>
                <div role="row" className="grid grid-cols-7 border-b border-rule pb-1">
                  {WEEKDAYS.map((day) => (
                    <span key={day} role="columnheader" className="text-center text-micro text-ink-faint">
                      {day}
                    </span>
                  ))}
                </div>
                {[0, 1, 2, 3, 4, 5].map((week) => (
                  <div key={week} role="row" className="grid grid-cols-7">
                    {days.slice(week * 7, week * 7 + 7).map((iso) => {
                      const date = parse(iso);
                      const outside = date.getMonth() !== view.getMonth();
                      const selected = iso === value;
                      const disabled = Boolean(min && iso < min);
                      return (
                        <button
                          key={iso}
                          type="button"
                          role="gridcell"
                          data-date={iso}
                          tabIndex={iso === focus ? 0 : -1}
                          disabled={disabled}
                          aria-selected={selected}
                          aria-current={iso === today ? "date" : undefined}
                          aria-label={dayFormat.format(date)}
                          onClick={() => pick(iso)}
                          className={cn(
                            "tnum relative h-8 text-[0.8125rem] transition-colors focus-visible:z-10",
                            selected
                              ? "bg-ink font-semibold text-panel"
                              : "hover:bg-panel-sunken",
                            !selected && outside && "text-ink-faint",
                            disabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                          )}
                        >
                          {date.getDate()}
                          {iso === today ? (
                            <span
                              className={cn(
                                "absolute inset-x-3 bottom-1 h-0.5",
                                selected ? "bg-panel" : "bg-signal",
                              )}
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 border-t border-rule pt-3">
                {allPresets.map((preset) => {
                  const target = preset.value();
                  const blocked = Boolean(min && target < min);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => pick(target)}
                      disabled={blocked}
                      title={blocked ? "Earlier than allowed" : triggerFormat.format(parse(target))}
                      className={cn(
                        "border px-2 py-1 text-[0.8125rem] transition-colors disabled:opacity-30",
                        target === value
                          ? "border-ink bg-ink text-panel"
                          : "border-rule text-ink-soft hover:border-ink hover:text-ink",
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>,
            position.container,
          )
        : null}
    </>
  );
}
