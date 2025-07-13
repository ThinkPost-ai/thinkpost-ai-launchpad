import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, disabled, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Pill-shaped track: always wider than tall
      "peer inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Custom checked/unchecked backgrounds for light/dark
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      "dark:data-[state=checked]:bg-green-500 dark:data-[state=unchecked]:bg-gray-400",
      // Disabled state: muted/gray track
      disabled
        ? "bg-gray-200 dark:bg-gray-800 opacity-60 cursor-not-allowed border-gray-300 dark:border-gray-700"
        : "",
      className
    )}
    disabled={disabled}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb styles
        "pointer-events-none block h-5 w-5 rounded-full bg-white dark:bg-gray-900 shadow-lg ring-0 border border-gray-300 dark:border-gray-600 transition-transform",
        // Add translation for checked/unchecked
        "data-[state=checked]:switch-translate-checked data-[state=unchecked]:switch-translate-unchecked",
        // Disabled state: less prominent thumb
        disabled ? "bg-gray-300 dark:bg-gray-700 border-gray-400 dark:border-gray-800 opacity-70" : ""
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
