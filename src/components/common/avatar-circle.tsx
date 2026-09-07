import { cn } from '@/lib/utils';

interface AvatarCircleProps {
  name: string;
  photoUrl?: string | null;
  className?: string;
}

export function AvatarCircle({ name, photoUrl, className }: AvatarCircleProps) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        className={cn('h-10 w-10 rounded-full object-cover shrink-0', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0',
        className
      )}
    >
      {name.charAt(0)}
    </div>
  );
}
