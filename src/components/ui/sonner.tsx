import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--foreground)",
          "--normal-text": "var(--background)",
          "--normal-border": "transparent",
          "--border-radius": "var(--radius-xl)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // Buttons go on their own row below the text, so the text keeps its width on phones (#156).
          toast: "cn-toast !flex-wrap",
          content: "!basis-full",
          actionButton: "!ml-auto",
          // Full-strength text: the default grey description is too faint on the dark toast (WCAG 1.4.3).
          description: "!text-[var(--normal-text)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

