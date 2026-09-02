import React from "react";
import { useToast } from "@/hooks/use-toast";
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
      {toasts.map(function ({ id, title, description, action, ...props }: any) {
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
                  if (typeof action.onClick === "function") {
                    action.onClick();
                  }
                  if (typeof props.onOpenChange === "function") {
                    props.onOpenChange(false);
                  }
                }}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {action.label || action}
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
