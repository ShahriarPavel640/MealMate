import React from "react";
import { useToast, ToastProps } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { Button } from "./button";

export function Toaster(): React.JSX.Element {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }: ToastProps) {
        const actionObj = typeof action === "object" && action !== null ? (action as { onClick?: () => void; label?: React.ReactNode }) : null;
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action && (
              <Button
                variant="secondary"
                onClick={() => {
                  if (actionObj && typeof actionObj.onClick === "function") {
                    actionObj.onClick();
                  }
                  if (typeof props.onOpenChange === "function") {
                    props.onOpenChange(false);
                  }
                }}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {actionObj?.label || (typeof action === "string" ? action : null)}
              </Button>
            )}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
