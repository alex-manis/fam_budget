import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export const Card = ({ children, padding = 'md', className = '', ...rest }: CardProps) => (
  <div
    className={`${styles.card} ${styles[`card--padding-${padding}`]} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader = ({ title, subtitle, action }: CardHeaderProps) => (
  <div className={styles.card__header}>
    <div className={styles.card__header__text}>
      <h3 className={styles.card__title}>{title}</h3>
      {subtitle && <p className={styles.card__subtitle}>{subtitle}</p>}
    </div>
    {action && <div className={styles.card__header__action}>{action}</div>}
  </div>
);
