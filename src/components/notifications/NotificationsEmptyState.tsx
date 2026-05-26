import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationsEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const NotificationsEmptyState = ({ title, description, actionLabel, onAction }: NotificationsEmptyStateProps) => (
  <section className="panel-muted rounded-[1.8rem] border-dashed p-8 text-center">
    <div className="panel-strong mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[hsl(var(--surface-1))]">
      <BellRing className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="font-display mt-4 text-base font-semibold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">{description}</p>
    {actionLabel && onAction ? (
      <Button onClick={onAction} variant="outline" className="mt-5 rounded-full px-5">
        {actionLabel}
      </Button>
    ) : null}
  </section>
);

export default NotificationsEmptyState;
