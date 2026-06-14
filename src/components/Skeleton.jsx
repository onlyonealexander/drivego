import styles from './Skeleton.module.css';

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.img} />
      <div className={styles.info}>
        <div className={`${styles.line} ${styles.title}`} />
        <div className={`${styles.line} ${styles.sub}`} />
        <div className={styles.footer}>
          <div className={`${styles.line} ${styles.price}`} />
          <div className={`${styles.line} ${styles.btn}`} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className={styles.listItem}>
      <div className={styles.avatar} />
      <div className={styles.listInfo}>
        <div className={`${styles.line} ${styles.listTitle}`} />
        <div className={`${styles.line} ${styles.listSub}`} />
      </div>
    </div>
  );
}

export function SkeletonText({ width = '100%', height = 14 }) {
  return (
    <div
      className={styles.line}
      style={{ width, height, borderRadius: 4 }}
    />
  );
}