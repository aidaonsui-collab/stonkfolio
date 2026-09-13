import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-paper text-ink hover:opacity-90",
        accent: "bg-accent text-accent-fg hover:opacity-90",
        outline:
          "bg-transparent text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
        secondary: "bg-elevated text-fg hover:opacity-90",
        ghost: "bg-transparent text-muted hover:bg-elevated hover:text-fg",
        destructive: "bg-down/15 text-down hover:bg-down/25",
        link: "text-fg underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 gap-2 rounded-md px-5 text-sm",
        xs: "h-8 gap-1 rounded-sm px-2.5 text-xs",
        sm: "h-9 gap-1.5 rounded-sm px-3 text-xs",
        lg: "h-12 gap-2 rounded-lg px-6 text-sm",
        icon: "size-11 rounded-md",
        "icon-xs": "size-8 rounded-sm",
        "icon-sm": "size-9 rounded-sm",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
