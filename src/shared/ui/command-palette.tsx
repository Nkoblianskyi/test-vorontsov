"use client";

import * as React from "react";
import { CornerDownLeft, Search } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useModalDialog } from "./use-modal-dialog";

export type Command = {
  id: string;
  label: string;
  group: string;
  hint?: string;
  /** Extra words that should find this command. */
  keywords?: string;
  run: () => void;
};

/** Every word of the query must appear somewhere in the command's text. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return commands;
  return commands.filter((command) => {
    const text =
      `${command.label} ${command.group} ${command.keywords ?? ""}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/**
 * ⌘K palette: type to filter, arrows to move, Enter to run, Esc to close.
 * Native <dialog>, so focus is trapped and the page behind is inert.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
  placeholder = "Search or run a command…",
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  placeholder?: string;
}) {
  const ref = useModalDialog(open);

  return (
    <dialog
      ref={ref}
      aria-label="Command palette"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="mx-auto mt-[12vh] mb-auto w-[min(92vw,560px)] border border-ink bg-panel p-0 text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,.6)] backdrop:bg-black/45"
    >
      {open ? (
        <PaletteBody commands={commands} onClose={onClose} placeholder={placeholder} />
      ) : null}
    </dialog>
  );
}

function PaletteBody({
  commands,
  onClose,
  placeholder,
}: {
  commands: Command[];
  onClose: () => void;
  placeholder: string;
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLUListElement>(null);
  const listId = React.useId();
  const results = React.useMemo(() => filterCommands(commands, query), [commands, query]);

  React.useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = results.length - 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index >= last ? 0 : index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? last : index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
    }
  };

  return (
    <div className="flex max-h-[70dvh] flex-col">
      <div className="flex items-center gap-3 border-b border-rule px-4">
        <Search className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden />
        <input
          autoFocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
          className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
        />
      </div>

      {results.length ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Commands"
          className="min-h-0 overflow-y-auto py-1"
        >
          {results.map((command, index) => {
            const heading =
              command.group !== results[index - 1]?.group ? command.group : null;
            return (
              <React.Fragment key={command.id}>
                {heading ? (
                  <li
                    role="presentation"
                    className="px-4 pt-3 pb-1 text-micro tracking-[0.08em] text-ink-faint uppercase"
                  >
                    {heading}
                  </li>
                ) : null}
                <li
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  onMouseMove={() => active !== index && setActive(index)}
                  onClick={() => run(command)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 px-4 py-2 text-sm",
                    index === active && "bg-panel-sunken",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{command.label}</span>
                  {command.hint ? (
                    <span className="hidden max-w-[45%] truncate text-micro text-ink-faint sm:inline">
                      {command.hint}
                    </span>
                  ) : null}
                  {index === active ? (
                    <CornerDownLeft
                      className="h-3.5 w-3.5 shrink-0 text-ink-faint"
                      aria-hidden
                    />
                  ) : null}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-6 text-sm text-ink-soft">Nothing matches “{query}”.</p>
      )}

      <p className="border-t border-rule bg-panel-sunken px-4 py-2 text-micro text-ink-faint">
        ↑ ↓ to move · Enter to run · Esc to close
      </p>
    </div>
  );
}
