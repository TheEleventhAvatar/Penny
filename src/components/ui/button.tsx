import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ className, variant = 'primary', size = 'md', href, ...props }: ButtonProps) {
  const sharedClassName = cn(
    'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b267]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111f] disabled:pointer-events-none disabled:opacity-50',
    variant === 'primary' && 'bg-[#f7b267] text-slate-950 shadow-[0_12px_40px_rgba(247,178,103,0.28)] hover:-translate-y-0.5 hover:bg-[#ffd08a]',
    variant === 'secondary' && 'border border-white/10 bg-white/8 text-white hover:bg-white/12',
    variant === 'ghost' && 'text-white/80 hover:bg-white/8 hover:text-white',
    variant === 'outline' && 'border border-white/12 bg-transparent text-white hover:bg-white/8',
    size === 'sm' && 'h-9 px-3 text-sm',
    size === 'md' && 'h-11 px-5 text-sm',
    size === 'lg' && 'h-12 px-6 text-base',
    className,
  );

  if (href) {
    return (
      <Link className={sharedClassName} href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      className={sharedClassName}
      {...props}
    />
  );
}
