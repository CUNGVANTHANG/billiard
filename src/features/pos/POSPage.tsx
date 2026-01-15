import { useState, useEffect } from "react";
import { ProductGrid } from "./ProductGrid";
import { Cart } from "./Cart";
import { TableGrid } from "./TableGrid";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Banknote, ShoppingCart } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Users, UserMinus } from "lucide-react";
import { CustomerSelectionDialog } from "./CustomerSelectionDialog";

export default function POSPage() {
  const [view, setView] = useState<'tables' | 'order'>('tables');
  const { setActiveTable, activeTableId, isTableOccupied, items, customerId, setCustomer } = useCartStore();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  
  const selectedCustomer = useLiveQuery(
      () => customerId ? db.customers.get(customerId) : undefined,
      [customerId]
  );

  const activeTable = useLiveQuery(
      () => activeTableId ? db.billiardTables.get(activeTableId) : undefined,
      [activeTableId]
  );

  const activeOrder = useLiveQuery(
      () => activeTable?.currentOrderId ? db.orders.get(activeTable.currentOrderId) : undefined,
      [activeTable?.currentOrderId]
  );

  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  useEffect(() => {
      if (!activeOrder?.date) {
          setElapsedMinutes(0);
          return;
      }
      
      const updateElapsed = () => {
          const start = new Date(activeOrder.date);
          const now = new Date();
          const diffMs = now.getTime() - start.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          setElapsedMinutes(diffMins);
      };
      
      updateElapsed();
      const interval = setInterval(updateElapsed, 60000);
      return () => clearInterval(interval);
  }, [activeOrder?.date]);

  const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}p`;
  };

  const handleSelectTable = async (tableId: number) => {
      await setActiveTable(tableId);
      setView('order');
  };

  const handleBackToTables = async () => {
      await setActiveTable(null); // Save current order logic is inside store
      setView('tables');
  };

  if (view === 'tables') {
      return (
          <div className="h-full overflow-y-auto bg-background">
              <TableGrid onSelectTable={handleSelectTable} />
          </div>
      );
  }

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full flex overflow-hidden bg-background">
      {/* Left Column: Header + Products */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with Table Info */}
        <div className="border-b bg-muted/40">
            <div className="flex items-center gap-4 px-4 py-3 flex-wrap justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={handleBackToTables} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> 
                        <span className="hidden sm:inline">Trở lại</span>
                    </Button>
                    
                    {/* Table Name & Status */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-lg sm:text-xl">{activeTable?.name || `Bàn ${activeTableId}`}</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${isTableOccupied ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                {isTableOccupied ? 'Đang sử dụng' : 'Trống'}
                            </span>
                        </div>

                        {/* Table Price Info */}
                        <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Banknote className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{activeTable?.pricePerHour?.toLocaleString()}đ/h</span>
                            </div>
                            {isTableOccupied && (
                                <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                                    <span className="font-medium text-foreground">{formatTime(elapsedMinutes)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                 {/* Customer Selection */}
                 <div className="flex items-center gap-2">
                    {selectedCustomer ? (
                        <div className="flex items-center gap-2 bg-primary/10 pl-3 pr-1 py-1 rounded-full border border-primary/20">
                            <div className="flex flex-col text-right gap-1 mr-1">
                                <span className="text-xs font-bold text-primary leading-none">{selectedCustomer.name}</span>
                                <span className="text-[10px] text-muted-foreground leading-none">{selectedCustomer.phone}</span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive scroll-m-2"
                                onClick={() => setCustomer(null)}
                                title="Bỏ chọn khách"
                            >
                                <UserMinus className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsCustomerDialogOpen(true)} className="gap-2 border-dashed">
                            <Users className="h-4 w-4" />
                            <span className="hidden sm:inline">Khách lẻ</span>
                            <span className="sm:hidden">Khách</span>
                        </Button>
                    )}
                 </div>
            </div>
        </div>

        <CustomerSelectionDialog 
            open={isCustomerDialogOpen} 
            onOpenChange={setIsCustomerDialogOpen} 
            onSelect={(c) => setCustomer(c.id!)} 
        />
        
        {/* Product Area */}
        <div className="flex-1 p-4 overflow-y-auto">
            <ProductGrid />
        </div>
      </div>
      
      {/* Right Column: Cart - Hidden on mobile */}
      <div className="hidden md:flex shadow-xl z-20 border-l w-[400px]">
          <Cart onCheckoutSuccess={handleBackToTables} />
      </div>

      {/* Mobile Cart Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50">
          <Sheet>
              <SheetTrigger asChild>
                  <Button size="lg" className="h-14 w-14 rounded-full shadow-lg relative">
                      <ShoppingCart className="h-6 w-6" />
                      {cartItemCount > 0 && (
                          <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                              {cartItemCount}
                          </span>
                      )}
                  </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] p-0">
                  <Cart onCheckoutSuccess={() => {
                      // Close sheet if open (optional, but good UX)
                       handleBackToTables();
                  }} />
              </SheetContent>
          </Sheet>
      </div>
    </div>
  )
}


