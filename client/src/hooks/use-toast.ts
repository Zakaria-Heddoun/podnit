import { toast as sonnerToast, externalToast } from "sonner"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

function toast({ title, description, variant, ...props }: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description: description,
      action: props.action as any,
      ...props as any,
    })
  }

  return sonnerToast(title, {
    description: description,
    action: props.action as any,
    ...props as any,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }
