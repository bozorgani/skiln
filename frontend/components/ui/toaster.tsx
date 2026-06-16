'use client';

import { useToast } from '@/hooks/use-toast';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const getToastIcon = (variant?: string) => {
  switch (variant) {
    case 'success':
      return <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
    case 'destructive':
      return <AlertCircle className="h-5 w-5 text-white shrink-0" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-white shrink-0" />;
    case 'info':
      return <Info className="h-5 w-5 text-white shrink-0" />;
    default:
      return <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />;
  }
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(variant);
        const hasIcon = variant !== 'default';
        
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {hasIcon && (
                <div className="mt-0.5 flex-shrink-0">
                  {icon}
                </div>
              )}
              <div className="grid gap-1.5 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}


