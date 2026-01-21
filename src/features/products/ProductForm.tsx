import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
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
import { type Product } from "@/types";

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

  /* ... inside ProductForm function ... */
  const [isLoading, setIsLoading] = useState(false);

  /* ... */

  const onSubmit = async (data: Product) => {
      setIsLoading(true);
      try {
          await onSave({ ...data, id: product?.id });
          toast.success(product ? "Cập nhật sản phẩm thành công" : "Thêm sản phẩm thành công");
          onOpenChange(false);
      } catch (error) {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
      } finally {
          setIsLoading(false);
      }
  };

  /* ... in DialogFooter ... */
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Hủy</Button>
          <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>

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
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="image" className="text-right">
                Hình ảnh
             </Label>
             <div className="col-span-3 relative">
                <Input
                  id="image"
                  placeholder="Link ảnh hoặc upload..."
                  className="pr-10"
                  {...register("image")}
                />
                <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   id="image-upload"
                   onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => {
                               setValue("image", reader.result as string);
                           };
                           reader.readAsDataURL(file);
                       }
                   }}
                />
                <Button
                   type="button"
                   variant="ghost"
                   size="icon"
                   className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                   onClick={() => document.getElementById('image-upload')?.click()}
                >
                    <Upload className="h-4 w-4" />
                </Button>
             </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Hủy</Button>
          <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
