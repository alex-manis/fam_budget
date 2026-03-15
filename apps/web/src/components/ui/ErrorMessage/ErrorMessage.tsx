import styles from './ErrorMessage.module.css';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorMessage = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorMessageProps) => (
  <div className={styles.error} role="alert">
    <span className={styles.error__icon} aria-hidden="true">⚠️</span>
    <p className={styles.error__message}>{message}</p>
    {onRetry && (
      <button className={styles.error__retry} onClick={onRetry} type="button">
        Retry
      </button>
    )}
  </div>
);
