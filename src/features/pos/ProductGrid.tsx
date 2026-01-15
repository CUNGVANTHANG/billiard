import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCartStore } from "@/stores/cartStore";

export function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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

  const addToCart = useCartStore(state => state.addToCart);

  // Mock categories for now
  const categories = ["Tất cả", "Bia", "Đồ ăn vặt", "Nước ngọt"];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm sản phẩm..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 overflow-y-auto pr-2">
        {products?.map((product) => (
            <Card 
                key={product.id} 
                className="hover:border-primary transition-colors"
            >
                <CardHeader className="p-4 pb-2">
                   {/* Placeholder Image */}
                    <div className="relative aspect-square mb-2">
                        <img 
                            src={`https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(product.name)}`}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-md"
                        />
                        <Badge variant="secondary" className="absolute top-1 right-1 px-1.5 py-0.5 text-[10px] bg-white/90 shadow-sm backdrop-blur-sm">
                             {product.stock}
                        </Badge>
                    </div>
                   <CardTitle className="text-sm font-medium leading-tight truncate" title={product.name}>
                       {product.name}
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="flex justify-between items-center mt-2">
                        <span className="font-bold text-primary">{product.price.toLocaleString()}đ</span>
                        <Button size="icon" className="h-6 w-6 rounded-full" onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                        }}>
                             <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ))}
        {products?.length === 0 && (
             <div className="col-span-full text-center py-10 text-muted-foreground">
                 Không tìm thấy sản phẩm.
             </div>
        )}
      </div>
    </div>
  );
}
