import { Construction } from 'lucide-react';

export function FeatureDisabled({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="bg-muted p-6 rounded-full text-muted-foreground">
        <Construction className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        현재 비활성화된 기능입니다. 필요 시 다시 활성화될 예정입니다.
      </p>
    </div>
  );
}
