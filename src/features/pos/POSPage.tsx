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
import { Textarea } from "@/components/ui/textarea";
import { Users, UserMinus, StickyNote, Plus } from "lucide-react";
import { CustomerSelectionDialog } from "./CustomerSelectionDialog";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

export default function POSPage() {
  const [view, setView] = useState<'tables' | 'order'>('tables');
  const { setActiveTable, activeTableId, isTableOccupied, items, customerId, setCustomer, notes, setNotes } = useCartStore();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  /* Logic for Editable Notes List */
  const notesList = notes.length > 0 ? notes : [""];

  const handleUpdateNote = (index: number, value: string) => {
    // If we are updating the "ghost" empty note, initialize array
    const newNotes = notes.length > 0 ? [...notes] : [""];
    newNotes[index] = value;
    // Filter out empty strings only if removing? No, keep them while editing. 
    // Ideally we might want to filter before saving, but for UI stability keep them.
    setNotes(newNotes);
  };

  const handleAddNoteField = () => {
    const newNotes = notes.length > 0 ? [...notes] : [""];
    setNotes([...newNotes, ""]);
  };

  const handleRemoveNote = (index: number) => {
    if (notesList.length <= 1) {
        // If it's the last one, just clear it (effectively empty list)
        setNotes([]);
        return;
    }
    const newNotes = [...notes];
    newNotes.splice(index, 1);
    setNotes(newNotes);
  };
  
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

                {/* Actions Column */}
                 <div className="flex flex-col items-end gap-1">
                    <div className="flex flex-col border rounded-lg overflow-hidden bg-background shadow-sm min-w-[40px] sm:min-w-[130px]">
                        {/* Customer Section (Top) */}
                        {selectedCustomer ? (
                            <div className="h-9 flex items-center justify-between gap-2 px-2 bg-primary/5 border-b w-full">
                                <div className="flex flex-col leading-none overflow-hidden text-left max-w-[80px] sm:max-w-[100px]">
                                     <span className="text-[10px] sm:text-xs font-bold text-primary truncate">{selectedCustomer.name}</span>
                                     <span className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{selectedCustomer.phone}</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 -mr-1 text-muted-foreground hover:text-destructive rounded-full"
                                    onClick={() => setCustomer(null)}
                                    title="Bỏ chọn"
                                >
                                    <UserMinus className="h-3 w-3" />
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsCustomerDialogOpen(true)} 
                                className="h-9 w-full justify-start gap-2 rounded-none border-b font-normal px-2.5 hover:bg-muted/50"
                            >
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="hidden sm:inline text-xs">Khách hàng</span>
                            </Button>
                        )}

                        {/* Note Section (Bottom) */}
                        <ResponsiveModal
                            trigger={
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-9 w-full justify-start gap-2 rounded-none font-normal px-2.5 hover:bg-muted/50 relative"
                                >
                                     <StickyNote className="h-4 w-4 text-muted-foreground" />
                                     <span className="hidden sm:inline text-xs">Ghi chú</span>
                                     {notes.length > 0 && notes.some(n => n.trim() !== "") && (
                                         <span className="absolute top-2 right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                            {notes.filter(n => n.trim() !== "").length}
                                         </span>
                                     )}
                                </Button>
                            }
                            open={isNoteOpen}
                            onOpenChange={setIsNoteOpen}
                            title="Ghi chú đơn hàng"
                            description="Thêm ghi chú cho nhà bếp hoặc quầy thu ngân."
                        >
                            <div className="py-4 space-y-4">
                                <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-hidden px-1">
                                    {notesList.map((noteText, index) => (
                                        <div key={index} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Ghi chú {index + 1}:
                                                </label>
                                                {notesList.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10 -mr-2"
                                                        onClick={() => handleRemoveNote(index)}
                                                    >
                                                        Xóa
                                                    </Button>
                                                )}
                                            </div>
                                            <Textarea 
                                                placeholder={`Nhập nội dung ghi chú ${index + 1}...`}
                                                value={noteText}
                                                onChange={(e) => handleUpdateNote(index, e.target.value)}
                                                className="min-h-[80px]" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsNoteOpen(false)}
                                        className="flex-1"
                                    >
                                        Hủy
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={handleAddNoteField} 
                                        className="flex-[2] gap-2 border-dashed"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Thêm ghi chú {notesList.length + 1}
                                    </Button>
                                </div>
                            </div>
                        </ResponsiveModal>
                    </div>
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
              <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-[20px] overflow-hidden">
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


