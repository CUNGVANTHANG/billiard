import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/stores/cartStore";
import { useState } from "react";
import { Check, CreditCard, Banknote } from "lucide-react";

export function PaymentDialog({ total, onPaymentSuccess }: { total: number; onPaymentSuccess?: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [received, setReceived] = useState<string>(total.toString());
    const [method, setMethod] = useState<'cash'|'transfer'>('cash');
    const { checkout } = useCartStore();
    
    const handlePayment = async () => {
        // Implement payment logic here (save order to DB)
        console.log("Payment processed", { method, total, received });
        await checkout(total);
        setIsOpen(false);
        onPaymentSuccess?.();
    };

    const change = Math.max(0, parseInt(received || "0") - total);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" size="lg" disabled={total === 0}>
                    Thanh toán {total.toLocaleString()}đ
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Chi tiết thanh toán</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Tổng tiền</p>
                        <p className="text-4xl font-bold text-primary">{total.toLocaleString()}đ</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={method === 'cash' ? "default" : "outline"} onClick={() => setMethod('cash')} className="flex flex-col h-20 gap-1">
                            <Banknote className="h-6 w-6" />
                            Tiền mặt
                        </Button>
                        <Button variant={method === 'transfer' ? "default" : "outline"} onClick={() => setMethod('transfer')} className="flex flex-col h-20 gap-1">
                            <CreditCard className="h-6 w-6" />
                            Chuyển khoản / QR
                        </Button>
                    </div>

                    {method === 'transfer' && (
                        <div className="flex justify-center py-2">
                             <div className="p-4 bg-white rounded-lg shadow-sm border">
                                <img 
                                    src={`https://img.vietqr.io/image/MB-0000000000-compact.jpg?amount=${total}&addInfo=Thanh toan don hang`} 
                                    alt="VietQR" 
                                    className="h-40 w-40 object-contain" 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/150x150/png?text=QR+Code';
                                    }}
                                />
                                <p className="text-xs text-center mt-2 text-muted-foreground">Quét mã để thanh toán</p>
                             </div>
                        </div>
                    )}

                    {method === 'cash' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Khách đưa</label>
                                <Input 
                                    type="number" 
                                    value={received} 
                                    onChange={(e) => setReceived(e.target.value)} 
                                    className="text-right text-lg"
                                />
                            </div>
                            
                            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                                <span className="font-medium">Tiền thừa:</span>
                                <span className="font-bold text-xl text-green-600">{change.toLocaleString()}đ</span>
                            </div>
                        </>
                    )}
                </div>
                <Button onClick={handlePayment} size="lg" className="w-full gap-2">
                     <Check className="h-4 w-4" />
                     Thanh toán & Trả bàn
                </Button>
            </DialogContent>
        </Dialog>
    );
}
