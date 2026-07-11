import React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"; // Assuming these are from your shadcn/ui setup
import { Button } from "./button"; // Assuming you have a Button component

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, cancel, ...props }) {
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
                  action.onClick();
                  props.onOpenChange(false);
                }}
                className="bg-green-500 text-white hover:bg-green-600"
              >
                {action.label}
              </Button>
            )}
            {cancel && (
              <Button
                variant="secondary"
                onClick={() => {
                  cancel.onClick();
                  props.onOpenChange(false);
                }}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {cancel.label}
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
