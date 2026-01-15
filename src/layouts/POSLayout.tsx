import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";

export default function POSLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-row">
       <Sidebar />
       <div className="flex-1 flex flex-col overflow-hidden h-full">
            <Header title="Danh sách bàn" />
            <div className="flex-1 overflow-hidden p-0">
                <Outlet />
            </div>
       </div>
    </div>
  )
}
