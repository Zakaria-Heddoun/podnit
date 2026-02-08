"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            style={{ zIndex: 999999999 }}
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-900 group-[.toaster]:text-gray-900 group-[.toaster]:dark:text-white group-[.toaster]:border-gray-200 group-[.toaster]:dark:border-gray-700 group-[.toaster]:shadow-xl group-[.toaster]:rounded-lg",
                    description: "group-[.toast]:text-gray-600 group-[.toast]:dark:text-gray-400",
                    success: "group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-900 group-[.toaster]:border-l-4 group-[.toaster]:border-l-gray-900 group-[.toaster]:dark:border-l-white",
                    error: "group-[.toaster]:bg-white group-[.toaster]:dark:bg-gray-900 group-[.toaster]:border-l-4 group-[.toaster]:border-l-gray-500 group-[.toaster]:dark:border-l-gray-400",
                    actionButton:
                        "group-[.toast]:bg-gray-900 group-[.toast]:dark:bg-white group-[.toast]:text-white group-[.toast]:dark:text-gray-900",
                    cancelButton:
                        "group-[.toast]:bg-gray-100 group-[.toast]:dark:bg-gray-800 group-[.toast]:text-gray-700 group-[.toast]:dark:text-gray-300",
                },
            }}
            position="top-center"
            offset="80px"
            richColors={false}
            {...props}
        />
    )
}

export { Toaster }
