import { useBoxExplorer } from '../BoxExplorerProvider';
import styles from '../styles/explorer.module.css';

export function Breadcrumbs() {
  const { navigation, goHome, navigateTo, entityName } = useBoxExplorer();

  // At root level (all folders merged)
  if (!navigation) {
    return (
      <nav className={styles.breadcrumbs}>
        <span className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}>
          <span>{entityName}</span>
        </span>
      </nav>
    );
  }

  return (
    <nav className={styles.breadcrumbs}>
      {navigation.breadcrumbs.map((crumb, i) => {
        const isLast = i === navigation.breadcrumbs.length - 1;
        const isRoot = crumb.id === 'root';

        return (
          <span key={crumb.id} className={styles.breadcrumbSegment}>
            {i > 0 && (
              <span className={styles.breadcrumbSeparator}>
                <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" opacity="0.4">
                  <path d="M1.5 0.5L6.5 6L1.5 11.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
            )}
            {isLast ? (
              <span className={`${styles.breadcrumbItem} ${styles.breadcrumbCurrent}`}>
                {isRoot ? entityName : crumb.name}
              </span>
            ) : (
              <button
                className={styles.breadcrumbItem}
                onClick={() => isRoot ? goHome() : navigateTo(i)}
              >
                {isRoot ? entityName : crumb.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
