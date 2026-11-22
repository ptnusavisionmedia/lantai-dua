import Link from 'next/link';
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { ArrowUpRight } from './icons';

export type ButtonVariant = 'primary' | 'demo' | 'secondary' | 'text';
export type ButtonSize = 'md' | 'sm';

const BASE =
  'group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-[1.5px] font-semibold ' +
  'transition-[background-color,border-color,color,transform] duration-(--dur-fast) ease-out ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ' +
  'motion-reduce:transition-none motion-reduce:active:scale-100';

const SIZE: Record<ButtonSize, string> = {
  md: 'min-h-11 px-[18px] text-[15px]',
  sm: 'min-h-9 px-3 text-sm',
};

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-on-primary enabled:hover:bg-primary-hover',
  demo: 'border-accent text-accent-ink hover:bg-accent-soft',
  secondary: 'border-border-input bg-surface text-ink hover:bg-surface-sunken',
  text: 'min-h-11 border-transparent px-1 text-primary underline-offset-4 hover:underline',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md') {
  return `${BASE} ${variant === 'text' ? '' : SIZE[size]} ${VARIANT[variant]}`;
}

function DemoArrow() {
  return (
    <ArrowUpRight className="text-accent transition-transform duration-(--dur-fast) ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-focus-visible:translate-x-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transition-none" />
  );
}

type Common = { variant?: ButtonVariant; size?: ButtonSize; children: ReactNode };

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type={type} className={`${buttonClasses(variant, size)} ${className}`} {...rest}>
      {variant === 'demo' && <DemoArrow />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={`${buttonClasses(variant, size)} ${className}`} {...rest}>
      {variant === 'demo' && <DemoArrow />}
      {children}
    </Link>
  );
}
