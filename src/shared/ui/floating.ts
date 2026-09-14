"use client";

import * as React from "react";

export type FloatingPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  /** Opened above the anchor because there was no room below. */
  flip: boolean;
  /** Where to portal the menu: a modal <dialog> keeps it in the top layer. */
  container: HTMLElement;
};

const EDGE = 8;

/**
 * Positions a menu next to its trigger with `position: fixed`, so it is never
 * clipped by a scrolling panel. Follows scroll and resize, flips up near the bottom.
 */
export function useFloating(
  open: boolean,
  anchorRef: React.RefObject<HTMLElement | null>,
  {
    width,
    gap = 4,
    preferredHeight = 320,
    flipBelow,
  }: {
    width?: number;
    gap?: number;
    preferredHeight?: number;
    /** Open upwards when less than this fits below. Menus scroll, so they can be shorter. */
    flipBelow?: number;
  } = {},
): FloatingPosition | null {
  const [position, setPosition] = React.useState<FloatingPosition | null>(null);

  // Layout effect: measured before paint, so the menu never flashes at a stale spot
  // and does not depend on animation frames (which background windows throttle).
  React.useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const menuWidth = Math.max(width ?? 0, rect.width);
      const below = window.innerHeight - rect.bottom - gap - EDGE;
      const above = rect.top - gap - EDGE;
      const flip = below < (flipBelow ?? Math.min(preferredHeight, 220)) && above > below;
      const left = Math.max(
        EDGE,
        Math.min(rect.left, window.innerWidth - menuWidth - EDGE),
      );

      setPosition({
        top: flip ? rect.top - gap : rect.bottom + gap,
        left,
        width: menuWidth,
        maxHeight: Math.max(140, Math.min(preferredHeight, flip ? above : below)),
        flip,
        container: anchor.closest("dialog") ?? document.body,
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, width, gap, preferredHeight, flipBelow]);

  return open ? position : null;
}

export function floatingStyle(
  position: FloatingPosition,
  fixedWidth?: boolean,
): React.CSSProperties {
  return {
    position: "fixed",
    top: position.top,
    left: position.left,
    [fixedWidth ? "width" : "minWidth"]: position.width,
    maxHeight: position.maxHeight,
    transform: position.flip ? "translateY(-100%)" : undefined,
    zIndex: 90,
  };
}

/** Closes on a pointer press outside every given element. */
export function useDismiss(
  open: boolean,
  refs: React.RefObject<HTMLElement | null>[],
  onDismiss: () => void,
) {
  // Latest refs and callback, read at event time: the listener subscribes once per open.
  const latest = React.useRef({ refs, onDismiss });
  React.useEffect(() => {
    latest.current = { refs, onDismiss };
  });

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (latest.current.refs.some((ref) => ref.current?.contains(target))) return;
      latest.current.onDismiss();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);
}
