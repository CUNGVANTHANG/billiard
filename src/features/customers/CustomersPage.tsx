import { useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Edit, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type Customer } from "@/lib/db";
import { CustomerForm } from "./CustomerForm";
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

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  const customers = useLiveQuery(
    async () => {
      let collection = db.customers.toCollection();
      let result = await collection.toArray();
      
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(c => 
          c.name.toLowerCase().includes(lowerSearch) || 
          c.phone.includes(searchTerm)
        );
      }
      return result.reverse(); // Newest first
    },
    [searchTerm]
  );

  const handleAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingCustomer?.id) {
      try {
        await db.customers.delete(deletingCustomer.id);
        toast.success("Xóa khách hàng thành công");
        setDeletingCustomer(null);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi xóa khách hàng");
      }
    }
  };

  const handleSave = async (data: Customer) => {
    if (data.id) {
      await db.customers.update(data.id, data);
    } else {
      await db.customers.add(data);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-auto sm:flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Add Button */}
        <Button onClick={handleAdd} className="w-full sm:w-auto gap-2">
            <Plus className="h-4 w-4" />
            Thêm khách hàng
        </Button>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-[600px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Số điện thoại</TableHead>
                            <TableHead className="text-right">Điểm tích lũy</TableHead>
                            <TableHead className="text-right w-[100px]">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy khách hàng nào user
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers?.map((customer, index) => (
                                <TableRow key={customer.id}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {customer.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{customer.phone}</TableCell>
                                    <TableCell className="text-right font-bold">{customer.points.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingCustomer(customer)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
             </div>
        </CardContent>
      </Card>

      <CustomerForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        customer={editingCustomer} 
        onSave={handleSave} 
      />

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa khách hàng "{deletingCustomer?.name}"? Hành động này không thể hoàn tác.
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
  );
}
