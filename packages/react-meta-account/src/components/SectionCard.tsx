import type {ReactNode} from 'react';

export interface SectionCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SectionCard({
  icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <div className="space-y-3 rounded-xl border px-6 py-5">
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
