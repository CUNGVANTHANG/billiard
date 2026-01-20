import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Customer } from "@/lib/db";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSave: (customer: Customer) => Promise<void>;
}

export function CustomerForm({ open, onOpenChange, customer, onSave }: CustomerFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
    } else {
      setName("");
      setPhone("");
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        ...customer,
        name,
        phone,
        points: customer?.points || 0
      });
      toast.success(customer ? "Cập nhật khách hàng thành công" : "Thêm khách hàng thành công");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save customer:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveModal 
        open={open} 
        onOpenChange={onOpenChange}
        title={customer ? "Sửa thông tin khách hàng" : "Thêm khách hàng mới"}
        description="Nhập thông tin chi tiết của khách hàng bên dưới."
    >
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                SĐT
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="col-span-3"
                required
                type="tel"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
    </ResponsiveModal>
  );
}
