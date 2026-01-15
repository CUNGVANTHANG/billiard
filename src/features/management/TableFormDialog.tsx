import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import type { BilliardTable } from "@/lib/db";

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

    const onSubmit = async (data: BilliardTable) => {
        await onSave({
            ...data,
            pricePerHour: Number(data.pricePerHour)
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{table ? "Cập nhật bàn" : "Thêm bàn mới"}</DialogTitle>
                    <DialogDescription>
                        Nhập thông tin bàn ở đây. Nhấn lưu khi hoàn tất.
                    </DialogDescription>
                </DialogHeader>
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
                    <DialogFooter>
                        <Button type="submit">Lưu thay đổi</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
