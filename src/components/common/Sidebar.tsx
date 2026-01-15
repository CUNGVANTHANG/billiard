import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/pos", icon: ShoppingCart, label: "Đặt bàn" },
  { href: "/tables", icon: LayoutDashboard, label: "Quản lý bàn" },
  { href: "/products", icon: Package, label: "Quản lý sản phẩm" },
  { href: "/orders", icon: FileText, label: "Quản lý đơn hàng" },
  { href: "/customers", icon: Users, label: "Quản lý khách hàng" },
  // { href: "/settings", icon: Settings, label: "Cài đặt" },
];

export function Sidebar() {
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
          return !['/dashboard', '/tables', '/customers', '/settings'].includes(item.href);
      }
      return false;
  });

  return (
    <aside className="hidden w-64 flex-col border-r bg-card xl:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">POS365</h1>
        <p className="text-xs text-muted-foreground mt-1">Xin chào, {user?.fullName}</p>
      </div>
      <nav className="flex-1 space-y-2 px-4">
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
    </aside>
  );
}
