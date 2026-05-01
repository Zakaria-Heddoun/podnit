import { toast as sonnerToast, type Action, type ExternalToast } from "sonner"

type ToastProps = Omit<ExternalToast, "description" | "action"> & {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: Action | React.ReactNode
  variant?: "default" | "destructive"
}

function toast({ title, description, variant, ...props }: ToastProps) {
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description: description,
      action: props.action,
      ...props,
    })
  }

  return sonnerToast(title, {
    description: description,
    action: props.action,
    ...props,
  })
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => sonnerToast.dismiss(toastId),
  }
}

export { useToast, toast }
