import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TransitionContext } from "@/customtypes/transition";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { useContext } from "react";

export function Header({ routes }) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const router = useRouter();
  const pathname = usePathname();
  const { transition, setTransition } = useContext(TransitionContext);

  React.useEffect(() => {
    setValue(pathname);
  }, [pathname]);

  return (
    <div className="fixed top-0 z-10 w-full flex items-center justify-center p-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between">
            {value
              ? routes.find((route) => route.value === value)?.label
              : "Select route..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search route..." className="h-9" />
            <CommandList>
              <CommandEmpty>No route found.</CommandEmpty>
              <CommandGroup>
                {routes.map((route) => (
                  <CommandItem
                    key={route.value}
                    value={route.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setTransition({
                        transition: true,
                        uid: currentValue,
                      });
                    }}>
                    {route.label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === route.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
