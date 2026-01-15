import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db, type Customer } from "@/lib/db";
import { Search, UserPlus, User } from "lucide-react";

interface CustomerSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
}

export function CustomerSelectionDialog({ open, onOpenChange, onSelect }: CustomerSelectionDialogProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  console.log(isSearching)
  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhone("");
      setName("");
      setFoundCustomer(null);
    }
  }, [open]);

  // Auto-search when phone changes (could be debounced, but simple for now)
  useEffect(() => {
    const search = async () => {
        if (phone.length >= 3) {
            setIsSearching(true);
            try {
                // Simple search by phone
                const customer = await db.customers.where('phone').equals(phone).first();
                setFoundCustomer(customer || null);
            } finally {
                setIsSearching(false);
            }
        } else {
            setFoundCustomer(null);
        }
    };
    
    // Debounce slightly
    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [phone]);

  const handleCreateAndSelect = async () => {
      if (!name || !phone) return;
      
      try {
          const id = await db.customers.add({
              name,
              phone,
              points: 0
          });
          const newCustomer = { id: id as number, name, phone, points: 0 };
          onSelect(newCustomer);
          onOpenChange(false);
      } catch (error) {
          console.error("Failed to create customer", error);
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chọn khách hàng</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
            {/* Phone Input Search */}
            <div className="space-y-2">
                <Label>Số điện thoại</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Nhập số điện thoại..." 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>
            </div>

            {/* Result Area */}
            {phone.length >= 3 && (
                <div className="space-y-4">
                    {foundCustomer ? (
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
                             <div className="flex items-center gap-3">
                                 <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                     <User className="h-5 w-5" />
                                 </div>
                                 <div>
                                     <p className="font-semibold">{foundCustomer.name}</p>
                                     <p className="text-sm text-muted-foreground">Điểm tích lũy: <span className="font-bold text-primary">{foundCustomer.points || 0}</span></p>
                                 </div>
                             </div>
                             <Button onClick={() => { onSelect(foundCustomer); onOpenChange(false); }}>
                                 Chọn
                             </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <UserPlus className="h-4 w-4" />
                                <span>Khách hàng chưa tồn tại. Tạo mới bên dưới:</span>
                            </div>
                            <div className="space-y-2">
                                <Label>Tên khách hàng</Label>
                                <Input 
                                    placeholder="Nhập tên khách hàng..." 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={handleCreateAndSelect} disabled={!name}>
                                Tạo và Chọn
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
