import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import MainLayout from "@/layouts/MainLayout";
import POSLayout from "@/layouts/POSLayout";
import DashboardPage from "@/features/dashboard/DashboardPage";
import POSPage from "@/features/pos/POSPage";
import ProductsPage from "@/features/products/ProductsPage";
import LoginPage from "@/features/auth/LoginPage";
import TablesPage from "@/features/management/TablesPage";
import OrdersPage from "@/features/orders/OrdersPage";
import CustomersPage from "@/features/customers/CustomersPage";
import SettingsPage from "@/features/settings/SettingsPage";
import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles?: string[] }) => {
    const { isAuthenticated, user } = useAuthStore();
    
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    
    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized for specific route
        return <Navigate to={user.role === 'admin' ? "/dashboard" : "/pos"} replace />;
    }

    return <Outlet />;
};

export default function App() {
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<ProtectedRoute />}>
             <Route path="/" element={<Navigate to="/dashboard" replace />} />
             
             {/* Management Routes - Admin Only generally, but some might be shared. For now strict separation based on Sidebar req. */} 
             <Route element={<MainLayout />}>
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="tables" element={<TablesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>
                {/* Shared or Staff allowed routes in Main Layout? Usually Staff just does POS. */}
                <Route path="products" element={<ProductsPage />} />
                <Route path="orders" element={<OrdersPage />} />
             </Route>

             {/* POS Route - All authenticated */}
             <Route element={<POSLayout />}>
                <Route path="pos" element={<POSPage />} />
             </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
