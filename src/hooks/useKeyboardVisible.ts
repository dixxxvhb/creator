import { useState, useEffect } from 'react';

function isTextField(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  if (node.tagName === 'TEXTAREA' || node.isContentEditable) return true;
  if (node.tagName !== 'INPUT') return false;
  const type = (node as HTMLInputElement).type;
  return !['checkbox', 'radio', 'range', 'button', 'submit', 'file', 'color'].includes(type);
}

/**
 * True while the iOS soft keyboard is (almost certainly) on screen.
 *
 * Focus-based rather than visualViewport-based: visualViewport heuristics
 * misfire with floating/split keyboards and Stage Manager on iPadOS, while a
 * focused text field is exactly the condition under which the keyboard shows.
 * <select> is deliberately excluded (iPadOS shows a popover, not a keyboard).
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let blurTimer: number | undefined;
    const onFocusIn = (e: FocusEvent) => {
      if (isTextField(e.target)) {
        window.clearTimeout(blurTimer);
        setVisible(true);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (isTextField(e.target)) {
        // Debounce field-to-field hops so the bar doesn't flicker.
        blurTimer = window.setTimeout(() => setVisible(false), 80);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.clearTimeout(blurTimer);
    };
  }, []);

  return visible;
}
