
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, className, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className={`w-[90vw] max-w-[500px] bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-gray-800 border border-purple-100 dark:border-purple-900 shadow-lg rounded-xl p-5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full ${className || ''}`}
          >
            <div className="grid gap-2">
              {title && (
                <ToastTitle className="text-lg font-semibold text-primary dark:text-primary-foreground">
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>
            <ToastClose className="absolute right-2 top-2 rounded-full p-2 text-neutral-600 dark:text-neutral-400 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50 border border-neutral-200 dark:border-neutral-700">
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </ToastClose>
            {action}
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:right-0 sm:top-auto sm:bottom-0 sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
