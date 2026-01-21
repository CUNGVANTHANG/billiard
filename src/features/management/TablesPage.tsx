import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type BilliardTable } from "@/types";
import { tableService } from "@/services/tableService";
import { TableFormDialog } from "./TableFormDialog";
import { cn } from "@/lib/utils";
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

// Visual Components copied from TableGrid for consistency
const Pockets = () => (
    <>
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
    </>
);

export default function TablesPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<BilliardTable | null>(null);
  const [deletingTable, setDeletingTable] = useState<BilliardTable | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: allTables } = useQuery({
      queryKey: ['tables'],
      queryFn: tableService.getAll
  });

  const deleteMutation = useMutation({
      mutationFn: tableService.delete,
      onSuccess: () => {
          toast.success("Xóa bàn thành công");
          queryClient.invalidateQueries({ queryKey:['tables'] });
          setDeletingTable(null);
      },
      onError: () => toast.error("Có lỗi xảy ra khi xóa bàn")
  });

  const createMutation = useMutation({
      mutationFn: tableService.create,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey:['tables'] });
      }
  });

  const updateMutation = useMutation({
      mutationFn: (data: {id: number, table: Partial<BilliardTable>}) => tableService.update(data.id, data.table),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey:['tables'] });
      }
  });

  const tables = useMemo(() => {
    if (!allTables) return [];
    if (!searchQuery.trim()) return allTables;
    const query = searchQuery.toLowerCase();
    return allTables.filter(table => 
        table.name.toLowerCase().includes(query)
    );
  }, [allTables, searchQuery]);

  const handleAdd = () => {
      setEditingTable(null);
      setIsFormOpen(true);
  };

  const handleEdit = (table: BilliardTable) => {
      setEditingTable(table);
      setIsFormOpen(true);
  };

  const handleDelete = async () => {
      if (deletingTable?.id) {
          deleteMutation.mutate(deletingTable.id);
      }
  };

  const handleSave = async (data: BilliardTable) => {
      if (data.id) {
          await updateMutation.mutateAsync({ id: data.id, table: data });
      } else {
          await createMutation.mutateAsync(data);
      }
  };

  return (
    <div className="h-full flex flex-col gap-4 bg-background">
      <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm bàn..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" /> Thêm bàn mới
            </Button>
          </div>
          
          {/* Table Grid - Matching POS Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 p-4">
            {tables?.map((table) => (
                <div 
                    key={table.id} 
                    className="relative group"
                >
                    {/* Table Frame */}
                    <div className={cn(
                        "h-56 rounded-lg border-[14px] shadow-2xl transition-transform transform group-hover:scale-105 relative border-amber-800 bg-green-700"
                    )}>
                         <Pockets />
                         
                         {/* Table Surface */}
                         <div className={cn(
                             "w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-green-600/10"
                         )}>
                             
                            {/* Edit/Delete Actions - Overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-100">
                                 <Button variant="secondary" size="icon" className="h-8 w-8 shadow-md" onClick={(e) => { e.stopPropagation(); handleEdit(table); }}>
                                    <Edit className="h-4 w-4" />
                                 </Button>
                                 <Button variant="destructive" size="icon" className="h-8 w-8 shadow-md" onClick={(e) => { e.stopPropagation(); setDeletingTable(table); }}>
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                             </div>

                             {/* Center Info */}
                             <div className="text-center z-20 pointer-events-none">
                                 <h3 className="font-bold text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">{table.name}</h3>
                                 <div className="flex flex-col gap-1 items-center">
                                     <span className="text-white/90 text-sm font-bold bg-black/40 px-3 py-1 rounded-full border border-white/10 shadow-sm mt-1">
                                         {table.pricePerHour?.toLocaleString()}đ / giờ
                                     </span>
                                 </div>
                             </div>
                         </div>
                    </div>
                </div>
            ))}
             {tables?.length === 0 && (
                 <div className="col-span-full w-full text-center py-10 text-muted-foreground">
                     Chưa có bàn nào. Hãy thêm bàn mới.
                 </div>
             )}
          </div>
      </div>

      {/* Form Dialog */}
      <TableFormDialog 
          open={isFormOpen} 
          onOpenChange={setIsFormOpen} 
          table={editingTable} 
          onSave={handleSave} 
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTable} onOpenChange={(open: boolean) => !open && setDeletingTable(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bàn này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Dữ liệu của "{deletingTable?.name}" sẽ bị xóa vĩnh viễn.
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
