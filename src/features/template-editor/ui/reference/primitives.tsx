"use client";

import * as React from "react";
import { X } from "lucide-react";

import { useHexDraft } from "@/shared/lib/use-hex-draft";
import type { ListboxSkin } from "@/shared/ui/listbox";
import { useModalDialog } from "@/shared/ui/use-modal-dialog";
import styles from "./reference.module.css";

/** The shared listbox, dressed as a Blueprint-style select and menu. */
export const referenceSkin: ListboxSkin = {
  trigger: `${styles.select} ${styles.selectTrigger}`,
  menu: styles.menu,
  option: styles.menuOption,
  optionActive: styles.menuOptionActive,
  optionSelected: styles.menuOptionSelected,
  group: styles.menuGroup,
  description: styles.menuDescription,
  showCheck: false,
};

/** Blueprint-style switch. `hideLabel` keeps the name for screen readers only. */
export function RefSwitch({
  checked,
  onChange,
  label,
  hideLabel,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={styles.switchRow}
    >
      <span className={styles.track} aria-hidden />
      {hideLabel ? null : <span>{label}</span>}
    </button>
  );
}

export function RefDialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const ref = useModalDialog(open);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      className={styles.dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open ? (
        <>
          <div className={styles.dialogHead}>
            <h3 className={styles.dialogTitle}>{title}</h3>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          </div>
          <div className={styles.dialogBody}>{children}</div>
          {footer ? <div className={styles.dialogFoot}>{footer}</div> : null}
        </>
      ) : null}
    </dialog>
  );
}

/** Label on the left, swatch + hex on the right, as in the reference. */
export function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = React.useId();
  const hex = useHexDraft(value, onChange);

  return (
    <div className={styles.colorRow}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.colorInput}>
        <label className={styles.swatch} style={{ background: value }}>
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label={`${label} picker`}
          />
        </label>
        <input id={id} className={styles.hex} spellCheck={false} {...hex} />
      </div>
    </div>
  );
}
