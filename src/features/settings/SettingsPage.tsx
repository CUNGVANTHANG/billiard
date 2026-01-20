import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSettingsStore } from "@/stores/settingsStore";
import { Button } from "@/components/ui/button";
import { Save, Printer, GripVertical, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

// ... (SortableHeaderItem remains same)
function SortableHeaderItem(props: { id: string, children: React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("group/item relative", isDragging && "opacity-50")}>
             <div 
                {...attributes} 
                {...listeners} 
                className="absolute -left-8 top-1/2 -translate-y-1/2 p-1 text-muted-foreground opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded"
            >
                <GripVertical className="h-4 w-4" />
            </div>
            {props.children}
        </div>
    );
}

export default function SettingsPage() {
    const { 
        billingBlockDuration, 
        enableBlockBilling, 
        setBillingBlockDuration, 
        setEnableBlockBilling,
        shopName, shopAddress, shopPhone, receiptFooter,
        headerLayout, printStyle,
        setShopSettings, setHeaderLayout, setPrintStyle
    } = useSettingsStore();

    // Billing Local State
    const [localDuration, setLocalDuration] = useState(billingBlockDuration);
    const [localEnable, setLocalEnable] = useState(enableBlockBilling);
    
    // Printer Local State
    const [localShopName, setLocalShopName] = useState(shopName);
    const [localShopAddress, setLocalShopAddress] = useState(shopAddress);
    const [localShopPhone, setLocalShopPhone] = useState(shopPhone);
    const [localReceiptFooter, setLocalReceiptFooter] = useState(receiptFooter);
    
    const [localHeaderLayout, setLocalHeaderLayout] = useState(headerLayout);
    const [localPrintStyle, setLocalPrintStyle] = useState(printStyle);

    const [isSaved, setIsSaved] = useState(false);

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Sync from store
    useEffect(() => {
        setLocalDuration(billingBlockDuration);
        setLocalEnable(enableBlockBilling);
        setLocalShopName(shopName);
        setLocalShopAddress(shopAddress);
        setLocalShopPhone(shopPhone);
        setLocalReceiptFooter(receiptFooter);
        setLocalHeaderLayout(headerLayout);
        setLocalPrintStyle(printStyle);
    }, [billingBlockDuration, enableBlockBilling, shopName, shopAddress, shopPhone, receiptFooter, headerLayout, printStyle]);

    const handleSave = () => {
        setBillingBlockDuration(localDuration);
        setEnableBlockBilling(localEnable);
        setShopSettings({
            shopName: localShopName,
            shopAddress: localShopAddress,
            shopPhone: localShopPhone,
            receiptFooter: localReceiptFooter
        });
        setHeaderLayout(localHeaderLayout);
        setPrintStyle(localPrintStyle);
        
        toast.success("Lưu cài đặt thành công");
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setLocalHeaderLayout((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over!.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const getFontFamily = (font: string) => {
        switch(font) {
            case 'mono': return 'monospace';
            case 'serif': return 'serif';
            case 'sans': default: return 'system-ui, sans-serif';
        }
    }

    const receiptWidth = localPrintStyle.paperSize === '80' ? '80mm' : '58mm';
    const textAlignClass = localPrintStyle.alignment === 'left' ? 'text-left' : localPrintStyle.alignment === 'right' ? 'text-right' : 'text-center';

    // Render helper based on layout ID
    const renderHeaderItem = (id: string) => {
        const commonStyle = { 
            fontFamily: getFontFamily(localPrintStyle.fontFamily),
            textAlign: localPrintStyle.alignment as any
        };

        switch (id) {
            case 'shopName':
                return (
                    <div className="relative group/input">
                        <input 
                            className={cn(
                                "w-full font-bold uppercase border-none focus:ring-0 p-0 m-0 placeholder:text-gray-300 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors",
                                localPrintStyle.fontSize === 'sm' ? 'text-lg' : localPrintStyle.fontSize === 'lg' ? 'text-2xl' : 'text-xl',
                                textAlignClass
                            )}
                            value={localShopName}
                            onChange={(e) => setLocalShopName(e.target.value)}
                            placeholder="TÊN CỬA HÀNG"
                            style={commonStyle}
                        />
                    </div>
                );
            case 'shopAddress':
                return (
                    <div className="relative group/input">
                        <input 
                            className={cn(
                                "w-full border-none focus:ring-0 p-0 m-0 placeholder:text-gray-300 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors",
                                textAlignClass
                            )}
                            value={localShopAddress}
                            onChange={(e) => setLocalShopAddress(e.target.value)}
                            placeholder="Địa chỉ cửa hàng"
                            style={{ 
                                ...commonStyle,
                                fontSize: localPrintStyle.fontSize === 'sm' ? '0.75rem' : localPrintStyle.fontSize === 'lg' ? '1rem' : '0.875rem' 
                            }}
                        />
                    </div>
                );
            case 'shopPhone':
                 return (
                    <div className="relative group/input">
                        <input 
                            className={cn(
                                "w-full border-none focus:ring-0 p-0 m-0 placeholder:text-gray-300 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors",
                                textAlignClass
                            )}
                            value={localShopPhone}
                            onChange={(e) => setLocalShopPhone(e.target.value)}
                            placeholder="Số điện thoại"
                            style={{ 
                                ...commonStyle,
                                fontSize: localPrintStyle.fontSize === 'sm' ? '0.75rem' : localPrintStyle.fontSize === 'lg' ? '1rem' : '0.875rem' 
                            }}
                        />
                    </div>
                );
            default:
                return null;
        }
    };


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Cấu hình tính tiền bàn (Bida)</CardTitle>
                    <CardDescription>
                        Tùy chỉnh cách tính tiền giờ chơi theo block thời gian.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="block-billing" className="flex flex-col space-y-1">
                            <span>Tính tiền theo Block</span>
                            <span className="font-normal text-muted-foreground">
                                Nếu bật, tiền sẽ được làm tròn theo mỗi block thời gian thay vì tính theo giờ.
                            </span>
                        </Label>
                        <Switch
                            id="block-billing"
                            checked={localEnable}
                            onCheckedChange={setLocalEnable}
                        />
                    </div>
                    
                    {localEnable && (
                         <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="block-duration">Thời lượng Block (phút)</Label>
                            <Input
                                id="block-duration"
                                type="number"
                                min={1}
                                value={localDuration}
                                onChange={(e) => setLocalDuration(Number(e.target.value))}
                                className="max-w-[200px]"
                            />
                            <p className="text-sm text-muted-foreground">
                                Ví dụ: Nếu giá bàn là 60.000đ/giờ và block là 5 phút. <br/>
                                - Khách chơi 0-5 phút: Tính 1 block (5.000đ). <br/>
                                - Khách chơi 6-10 phút: Tính 2 block (10.000đ).
                            </p>
                        </div>
                    )}

                    <Separator />
                    <Separator />
                    
                    {/* Visual Receipt Editor */}
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-2">
                                <Printer className="h-5 w-5 text-primary" />
                                <h3 className="font-medium text-lg">Cấu hình mẫu hóa đơn</h3>
                            </div>
                            
                            {/* Paper & Visual Settings */}
                            <div className="flex flex-wrap items-center gap-4">
                                {/* Paper Size */}
                                <Tabs value={localPrintStyle.paperSize} onValueChange={(v: any) => setLocalPrintStyle({...localPrintStyle, paperSize: v})}>
                                    <TabsList>
                                        <TabsTrigger value="58">58mm</TabsTrigger>
                                        <TabsTrigger value="80">80mm</TabsTrigger>
                                    </TabsList>
                                </Tabs>

                                {/* Alignment */}
                                <div className="flex items-center border rounded-md bg-muted/20">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-8 w-8 rounded-none rounded-l-md", localPrintStyle.alignment === 'left' && "bg-white shadow-sm")}
                                        onClick={() => setLocalPrintStyle({...localPrintStyle, alignment: 'left'})}
                                    >
                                        <AlignLeft className="h-4 w-4" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-6" />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-8 w-8 rounded-none", localPrintStyle.alignment === 'center' && "bg-white shadow-sm")}
                                        onClick={() => setLocalPrintStyle({...localPrintStyle, alignment: 'center'})}
                                    >
                                        <AlignCenter className="h-4 w-4" />
                                    </Button>
                                    <Separator orientation="vertical" className="h-6" />
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className={cn("h-8 w-8 rounded-none rounded-r-md", localPrintStyle.alignment === 'right' && "bg-white shadow-sm")}
                                        onClick={() => setLocalPrintStyle({...localPrintStyle, alignment: 'right'})}
                                    >
                                        <AlignRight className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Select value={localPrintStyle.fontFamily} onValueChange={(v: any) => setLocalPrintStyle({...localPrintStyle, fontFamily: v})}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Font" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sans">Không chân</SelectItem>
                                        <SelectItem value="serif">Có chân</SelectItem>
                                        <SelectItem value="mono">Đơn cách</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={localPrintStyle.fontSize} onValueChange={(v: any) => setLocalPrintStyle({...localPrintStyle, fontSize: v})}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue placeholder="Cỡ chữ" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sm">Nhỏ</SelectItem>
                                        <SelectItem value="base">Thường</SelectItem>
                                        <SelectItem value="lg">Lớn</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex justify-center bg-gray-100 p-8 rounded-lg border overflow-hidden">
                            <div 
                                style={{ width: receiptWidth, transition: 'width 0.3s ease' }} 
                                className="bg-white shadow-lg p-4 text-center text-sm leading-tight relative group min-h-[400px]"
                            >
                                {/* Paper tear effect */}
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-gray-100/50 to-transparent"></div>

                                {/* Drag & Drop Header Area */}
                                <DndContext 
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext 
                                        items={localHeaderLayout}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2 mb-4">
                                            {localHeaderLayout.map((id) => (
                                                <SortableHeaderItem key={id} id={id}>
                                                    {renderHeaderItem(id)}
                                                </SortableHeaderItem>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {/* Static Mock Content for Context */}
                                <div className="border-t border-b border-dashed border-gray-300 py-2 my-2 space-y-1 opacity-60 pointer-events-none select-none font-mono">
                                    <div className="font-bold text-lg mb-2">HÓA ĐƠN BÁN HÀNG</div>
                                    <div className="flex justify-between text-xs"><span>Bàn: 05</span><span>02/10/2023 10:30</span></div>
                                    <div className="border-b border-dashed border-gray-300 my-1"></div>
                                    <div className="flex justify-between font-bold"><span>Mặt hàng</span><span>Thành tiền</span></div>
                                    <div className="flex justify-between"><span>Cà phê đá x1</span><span>15.000</span></div>
                                    <div className="flex justify-between"><span>Bún thịt nướng x1</span><span>35.000</span></div>
                                    <div className="border-t border-dashed border-gray-300 my-1"></div>
                                    <div className="flex justify-between font-bold text-base"><span>TỔNG CỘNG</span><span>50.000</span></div>
                                </div>

                                {/* Footer Editable Area */}
                                <div className="mt-4 relative group/input">
                                    <Textarea 
                                        className={cn(
                                            "w-full text-center text-xs border-none focus:ring-0 p-0 m-0 resize-none min-h-[40px] placeholder:text-gray-300 bg-transparent hover:bg-gray-50 focus:bg-gray-50 transition-colors italic",
                                            textAlignClass
                                        )}
                                        value={localReceiptFooter}
                                        onChange={(e) => setLocalReceiptFooter(e.target.value)}
                                        placeholder="Lời chào cuối hóa đơn..."
                                        rows={2}
                                        style={{ 
                                            fontFamily: getFontFamily(localPrintStyle.fontFamily),
                                            textAlign: localPrintStyle.alignment as any 
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                     <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isSaved} className="gap-2">
                            <Save className="h-4 w-4" />
                            {isSaved ? "Đã lưu thay đổi" : "Lưu thay đổi"}
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
    );
}
