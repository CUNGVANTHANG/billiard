import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";

const getTitle = (pathname: string) => {
  if (pathname.startsWith('/dashboard')) return 'Tổng quan';
  if (pathname.startsWith('/tables')) return 'Quản lý bàn';
  if (pathname.startsWith('/products')) return 'Quản lý sản phẩm';
  if (pathname.startsWith('/orders')) return 'Quản lý đơn hàng';
  if (pathname.startsWith('/customers')) return 'Khách hàng';
  if (pathname.startsWith('/settings')) return 'Thiết lập';
  return 'Tổng quan';
};

export default function MainLayout() {
  const location = useLocation();
  const title = getTitle(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
           <Outlet />
        </main>
      </div>
    </div>
  )
}
