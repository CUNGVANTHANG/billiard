import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings, LogOut, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/pos", icon: ShoppingCart, label: "POS" },
  { href: "/products", icon: Package, label: "Products" },
  { href: "/orders", icon: FileText, label: "Orders" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function POSSidebar() {
  return (
    <aside className="flex w-16 flex-col border-l bg-card sm:flex z-30">
        <div className="flex h-14 items-center justify-center border-b">
            <Home className="h-5 w-5" />
        </div>
      <nav className="flex-1 flex flex-col items-center gap-4 py-4">
        <TooltipProvider>
            {navItems.map((item) => (
            <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>
                    <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                        cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-10 md:w-10",
                            isActive ? "bg-primary text-primary-foreground hover:text-primary-foreground" : "hover:bg-accent"
                        )
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="sr-only">{item.label}</span>
                    </NavLink>
                </TooltipTrigger>
                <TooltipContent side="left">
                    {item.label}
                </TooltipContent>
            </Tooltip>
            ))}
        </TooltipProvider>
      </nav>
      <div className="p-4 mt-auto flex justify-center border-t">
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <LogOut className="h-5 w-5" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Logout</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
}
