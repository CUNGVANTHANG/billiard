import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { BilliardTable } from "@/lib/db";
import { ResponsiveModal } from "@/components/ui/responsive-modal";

interface TableFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    table: BilliardTable | null;
    onSave: (data: BilliardTable) => Promise<void>;
}

export function TableFormDialog({ open, onOpenChange, table, onSave }: TableFormProps) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BilliardTable>();

    useEffect(() => {
        if (open) {
            reset();
            if (table) {
                setValue('id', table.id);
                setValue('name', table.name);
                setValue('status', table.status);
                setValue('pricePerHour', table.pricePerHour || 50000);
            } else {
                setValue('status', 'available');
                setValue('pricePerHour', 50000);
            }
        }
    }, [open, table, reset, setValue]);

    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data: BilliardTable) => {
        setIsLoading(true);
        try {
            await onSave({
                ...data,
                pricePerHour: Number(data.pricePerHour)
            });
            toast.success(table ? "Cập nhật bàn thành công" : "Thêm bàn mới thành công");
            onOpenChange(false);
        } catch (error) {
            toast.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsiveModal 
            open={open} 
            onOpenChange={onOpenChange}
            title={table ? "Cập nhật bàn" : "Thêm bàn mới"}
            description="Nhập thông tin bàn ở đây. Nhấn lưu khi hoàn tất."
        >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Tên bàn
                            </Label>
                            <Input
                                id="name"
                                className="col-span-3"
                                {...register("name", { required: "Tên bàn không được để trống" })}
                            />
                        </div>
                        {errors.name && <span className="text-red-500 text-sm ml-[25%]">{errors.name.message}</span>}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pricePerHour" className="text-right">
                                Giá/Giờ
                            </Label>
                            <Input
                                id="pricePerHour"
                                type="number"
                                className="col-span-3"
                                min="0"
                                step="1000"
                                {...register("pricePerHour", { required: "Giá giờ là bắt buộc", min: 0 })}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Hủy</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </form>
        </ResponsiveModal>
    );
}
