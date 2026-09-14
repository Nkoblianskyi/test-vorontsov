"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { floatingStyle, useDismiss, useFloating } from "./floating";

export type ListboxOption<T extends string> = {
  value: T;
  label: string;
  description?: string;
  group?: string;
  swatch?: string;
};

/** Class names for a different visual system (the reference screen uses its own). */
export type ListboxSkin = {
  trigger: string;
  menu: string;
  option: string;
  optionActive: string;
  optionSelected: string;
  group: string;
  description: string;
  swatch?: string;
  showCheck?: boolean;
};

const sizes = {
  md: "h-10 px-3 text-sm",
  sm: "h-8 px-2 text-[0.8125rem]",
};

const studioSkin: ListboxSkin = {
  trigger:
    "flex w-full items-center gap-2 border border-rule bg-panel text-ink transition-colors hover:border-ink-faint aria-expanded:border-ink data-[invalid=true]:border-signal",
  menu: "overflow-y-auto border border-ink bg-panel py-1 text-sm text-ink shadow-[0_18px_40px_-18px_rgba(0,0,0,.5)] focus:outline-none",
  option: "flex cursor-pointer items-center gap-2 px-3 py-2",
  optionActive: "bg-panel-sunken",
  optionSelected: "font-medium",
  group: "px-3 pt-2.5 pb-1 text-micro uppercase tracking-[0.08em] text-ink-faint",
  description: "ml-auto pl-4 text-micro text-ink-faint",
  swatch: "h-3 w-3 shrink-0 border border-rule",
  showCheck: true,
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: ListboxOption<T>[];
  id?: string;
  "aria-label"?: string;
  invalid?: boolean;
  size?: keyof typeof sizes;
  className?: string;
  skin?: ListboxSkin;
  onBlur?: () => void;
};

/**
 * Select replacement: the native dropdown can't be styled, so the list is ours.
 * Keyboard follows the ARIA listbox pattern: arrows, Home/End, type-ahead, Enter, Esc.
 */
export function Listbox<T extends string>({
  value,
  onChange,
  options,
  id,
  invalid,
  size = "md",
  className,
  skin,
  onBlur,
  ...aria
}: Props<T>) {
  const theme = skin ?? studioSkin;
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();
  const position = useFloating(open, triggerRef, { preferredHeight: 300 });

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = options[selectedIndex];

  const openMenu = () => {
    setActive(Math.max(0, selectedIndex));
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };

  useDismiss(open, [triggerRef, listRef], () => close(false));

  const positioned = Boolean(position);
  React.useEffect(() => {
    if (open && positioned) listRef.current?.focus({ preventScroll: true });
  }, [open, positioned]);

  React.useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open, positioned]);

  const onTriggerKeyDown = (event: React.KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(last, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActive(0);
        break;
      case "End":
        event.preventDefault();
        setActive(last);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(active);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const letter = event.key.toLowerCase();
          const order = [...options.keys()].map((offset) => (active + 1 + offset) % options.length);
          const match = order.find((index) => options[index].label.toLowerCase().startsWith(letter));
          if (match !== undefined) setActive(match);
        }
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-invalid={invalid || undefined}
        aria-label={aria["aria-label"]}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onTriggerKeyDown}
        onBlur={onBlur}
        className={cn(theme.trigger, !skin && sizes[size], className)}
      >
        {selected?.swatch ? (
          <span className={theme.swatch} style={{ background: selected.swatch }} aria-hidden />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? "Choose…"}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && position
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={id}
              aria-label={id ? undefined : aria["aria-label"]}
              aria-activedescendant={`${listId}-${active}`}
              onKeyDown={onListKeyDown}
              style={floatingStyle(position)}
              className={theme.menu}
            >
              {options.map((option, index) => {
                const heading =
                  option.group && option.group !== options[index - 1]?.group ? option.group : null;
                const isSelected = option.value === value;
                return (
                  <React.Fragment key={option.value}>
                    {heading ? (
                      <li role="presentation" className={theme.group}>
                        {heading}
                      </li>
                    ) : null}
                    <li
                      id={`${listId}-${index}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onMouseMove={() => active !== index && setActive(index)}
                      onClick={() => choose(index)}
                      className={cn(
                        theme.option,
                        index === active && theme.optionActive,
                        isSelected && theme.optionSelected,
                      )}
                    >
                      {option.swatch ? (
                        <span className={theme.swatch} style={{ background: option.swatch }} aria-hidden />
                      ) : null}
                      <span className="min-w-0 truncate">{option.label}</span>
                      {option.description ? (
                        <span className={theme.description}>{option.description}</span>
                      ) : null}
                      {theme.showCheck ? (
                        <Check
                          className={cn(
                            "h-3.5 w-3.5 shrink-0",
                            option.description ? "ml-2" : "ml-auto",
                            !isSelected && "invisible",
                          )}
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>,
            position.container,
          )
        : null}
    </>
  );
}
