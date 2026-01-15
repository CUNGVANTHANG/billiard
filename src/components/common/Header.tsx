import { Bell, Menu, User, LayoutDashboard, ShoppingCart, Package, Users, FileText, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/stores/authStore";
import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/pos", icon: ShoppingCart, label: "Đặt bàn" },
  { href: "/products", icon: Package, label: "Sản phẩm" },
  { href: "/orders", icon: FileText, label: "Đơn hàng" },
  { href: "/customers", icon: Users, label: "Khách hàng" },
  { href: "/settings", icon: Settings, label: "Thiết lập" },
];

interface HeaderProps {
  title?: string;
}

export function Header({ title = "Tổng quan" }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  const filteredNavItems = navItems.filter(item => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      // Staff restrictions
      if (user.role === 'staff') {
          return !['/dashboard', '/customers', '/settings'].includes(item.href);
      }
      return false;
  });

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="xl:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
           <div className="flex flex-col h-full">
               <div className="p-4"><h1 className="text-xl font-bold text-primary">POS365</h1></div>
               <nav className="flex-1 space-y-2 px-2">
                 {filteredNavItems.map((item) => (
                   <NavLink
                     key={item.href}
                     to={item.href}
                     className={({ isActive }) =>
                       cn(
                         "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                         isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground"
                       )
                     }
                   >
                     <item.icon className="h-4 w-4" />
                     {item.label}
                   </NavLink>
                 ))}
               </nav>
               <div className="p-4 border-t">
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                  </button>
               </div>
           </div>
        </SheetContent>
      </Sheet>
      <div className="flex-1">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Hồ sơ</DropdownMenuItem>
            <DropdownMenuItem>Cài đặt</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
