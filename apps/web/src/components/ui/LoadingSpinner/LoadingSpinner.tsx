import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner = ({ size = 'md', label = 'Loading…' }: LoadingSpinnerProps) => (
  <div className={`${styles.spinner__wrapper} ${styles[`spinner__wrapper--${size}`]}`} role="status" aria-label={label}>
    <div className={`${styles.spinner} ${styles[`spinner--${size}`]}`} />
    <span className={styles.spinner__label}>{label}</span>
  </div>
);
