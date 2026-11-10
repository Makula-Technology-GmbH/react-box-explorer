import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import styles from '../styles/explorer.module.css';

/**
 * Renders floating UI (context menu, modals) into document.body.
 *
 * Our menus/overlays use `position: fixed` with viewport coordinates. When the
 * explorer is mounted inside an ancestor that has a `transform`, `filter`,
 * `perspective`, `contain` or `will-change: transform` (e.g. a slide-in
 * drawer/sheet animated with `translate-x-*`), that ancestor becomes the
 * containing block for fixed descendants. The menu then gets offset by the
 * ancestor's position and clipped by its overflow, so it looks like clicking
 * "..." does nothing. Portaling escapes that containing block.
 */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(<div className={styles.portalRoot}>{children}</div>, document.body);
}
