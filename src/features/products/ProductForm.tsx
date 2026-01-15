import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Product } from "@/lib/db";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Omit<Product, 'id'> & { id?: number }) => void;
}

export function ProductForm({ open, onOpenChange, product, onSave }: ProductFormProps) {
  const { register, handleSubmit, reset, setValue } = useForm<Product>({
      defaultValues: {
          name: '',
          price: 0,
          stock: 0,
          category: 'Bia',
          barcode: '',
          image: ''
      }
  });

  useEffect(() => {
    if (product) {
        reset(product);
    } else {
        reset({
            name: '',
            price: 0,
            stock: 0,
            category: 'Bia',
            barcode: '',
            image: ''
        });
    }
  }, [product, reset, open]);

  const onSubmit = (data: Product) => {
      onSave({ ...data, id: product?.id });
      onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? "Sửa sản phẩm" : "Thêm sản phẩm"}</DialogTitle>
          <DialogDescription>
            {product ? "Cập nhật thông tin sản phẩm." : "Thêm sản phẩm mới vào menu."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input
              id="name"
              className="col-span-3"
              {...register("name", { required: true })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Danh mục
            </Label>
            <div className="col-span-3">
                <Select 
                    onValueChange={(val: string) => setValue("category", val)} 
                    defaultValue={product?.category || "Bia"}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Bia">Bia</SelectItem>
                        <SelectItem value="Đồ ăn vặt">Đồ ăn vặt</SelectItem>
                        <SelectItem value="Nước ngọt">Nước ngọt</SelectItem>
                        <SelectItem value="Thuốc lá">Thuốc lá</SelectItem>
                        <SelectItem value="Khác">Khác</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Giá bán
            </Label>
            <Input
              id="price"
              type="number"
              className="col-span-3"
              {...register("price", { valueAsNumber: true, required: true })}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Tồn kho
            </Label>
            <Input
              id="stock"
              type="number"
              className="col-span-3"
              {...register("stock", { valueAsNumber: true })}
            />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit(onSubmit)}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
