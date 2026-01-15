import { useState } from "react";
import { Search, Plus, Trash2, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Product } from "@/lib/db";
import { ProductForm } from "./ProductForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const products = useLiveQuery(
    async () => {
        let collection = db.products.toCollection();
        if (selectedCategory) {
            collection = db.products.where('category').equals(selectedCategory);
        }
        let result = await collection.toArray();
        if (searchTerm) {
            const lowerString = searchTerm.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(lowerString) || p.barcode.includes(searchTerm));
        }
        return result;
    },
    [searchTerm, selectedCategory]
  );

  const handleAdd = () => {
      setEditingProduct(null);
      setIsFormOpen(true);
  };

  const handleEdit = (product: Product) => {
      setEditingProduct(product);
      setIsFormOpen(true);
  };

  const handleDelete = async () => {
      if (deletingProduct?.id) {
          await db.products.delete(deletingProduct.id);
          setDeletingProduct(null);
      }
  };

  const handleSave = async (data: Product) => {
      if (data.id) {
          await db.products.update(data.id, data);
      } else {
          await db.products.add(data);
      }
  };

  // Categories
  const categories = ["Tất cả", "Bia", "Đồ ăn vặt", "Nước ngọt", "Thuốc lá", "Khác"];

  return (
    <div className="h-full flex flex-col gap-4 bg-background">
      {/* Title moved to Header, Add Button moved to Filters */}
      
      <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Filters & Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Thêm mới
            </Button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 shrink-0">
             {categories.map(cat => (
                 <Button 
                    key={cat} 
                    variant={selectedCategory === cat || (cat === "Tất cả" && !selectedCategory) ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat === "Tất cả" ? null : cat)}
                 >
                     {cat}
                 </Button>
             ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 overflow-y-auto pr-2 pb-20">
            {products?.map((product) => (
                <Card 
                    key={product.id} 
                    className="group relative hover:border-primary transition-all flex flex-col h-full w-full"
                >
                    <CardHeader className="p-4 pb-2">
                       {/* Placeholder Image */}
                       <div className="relative aspect-square mb-2 bg-muted rounded-md overflow-hidden group-hover:shadow-sm transition-all">
                           <img 
                               src={`https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(product.name)}`} 
                               alt={product.name}
                               className="w-full h-full object-cover transition-transform group-hover:scale-105"
                           />
                           
                           {/* Hover Actions - Top Right */}
                           <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button variant="secondary" size="icon" className="h-8 w-8 shadow-sm" onClick={(e) => { e.stopPropagation(); handleEdit(product); }}>
                                   <Edit className="h-4 w-4" />
                               </Button>
                               <Button variant="destructive" size="icon" className="h-8 w-8 shadow-sm" onClick={(e) => { e.stopPropagation(); setDeletingProduct(product); }}>
                                   <Trash2 className="h-4 w-4" />
                               </Button>
                           </div>
                       </div>
                       <CardTitle className="text-sm font-medium leading-tight truncate" title={product.name}>
                           {product.name}
                       </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-bold text-primary">{product.price.toLocaleString()}đ</span>
                            <Badge variant="secondary" className="text-xs">
                                 {product.stock}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            ))}
             {products?.length === 0 && (
                 <div className="col-span-full w-full text-center py-10 text-muted-foreground">
                     Không tìm thấy sản phẩm.
                 </div>
             )}
          </div>
      </div>

      {/* Product Form Dialog */}
      <ProductForm 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          product={editingProduct} 
          onSave={handleSave} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open: boolean) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Sản phẩm "{deletingProduct?.name}" sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
