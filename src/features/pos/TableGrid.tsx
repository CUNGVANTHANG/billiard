import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';

interface TableGridProps {
    onSelectTable: (tableId: number) => void;
}

// Helper to render pockets
const Pockets = () => (
    <>
        {/* Top Left */}
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        {/* Top Center */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        {/* Top Right */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        {/* Bottom Left */}
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        {/* Bottom Center */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
        {/* Bottom Right */}
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-black rounded-full border border-gray-600 z-10"></div>
    </>
);

const Ball = ({ color }: { color: string }) => (
    <div className={cn("w-4 h-4 rounded-full shadow-[1px_1px_2px_rgba(0,0,0,0.5)]", color)}></div>
);

const TriangleRack = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col items-center gap-[1px] opacity-90 scale-90 origin-center -rotate-90", className)}>
        {/* Row 1 (1) */}
        <div className="flex gap-[1px]">
             <Ball color="bg-yellow-400" />
        </div>
        {/* Row 2 (2) */}
        <div className="flex gap-[1px]">
             <Ball color="bg-blue-600" /> <Ball color="bg-red-600" />
        </div>
        {/* Row 3 (3) */}
        <div className="flex gap-[1px]">
             <Ball color="bg-purple-600" /> <Ball color="bg-orange-500" /> <Ball color="bg-green-600" />
        </div>
        {/* Row 4 (4) */}
        <div className="flex gap-[1px]">
             <Ball color="bg-red-800" /> <Ball color="bg-black" /> <Ball color="bg-yellow-200" /> <Ball color="bg-blue-400" />
        </div>
        {/* Row 5 (5) */}
        <div className="flex gap-[1px]">
             <Ball color="bg-red-400" /> <Ball color="bg-purple-400" /> <Ball color="bg-orange-300" /> <Ball color="bg-green-400" /> <Ball color="bg-red-900" />
        </div>
    </div>
);

// Helper to render cue stick
const CueStick = () => (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-[45%] h-3 z-10 filter drop-shadow-[2px_2px_2px_rgba(0,0,0,0.5)] rotate-180">
        <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-sm"></div>
        <div className="w-full h-full flex items-center" style={{ clipPath: 'polygon(0 30%, 100% 0, 100% 100%, 0 70%)' }}>
            {/* Tip (Lơ - Xanh) */}
            <div className="w-[2%] h-full bg-blue-500 rounded-l-[1px]"></div>
            {/* Ferrule (Phíp - NOW MATCHES SHAFT) */}
            <div className="w-[3%] h-full bg-gradient-to-b from-[#fde6cd] via-[#fff5eb] to-[#e6ccb2]"></div>
            {/* Shaft (Ngọn - Gỗ Maple sáng) */}
            <div className="w-[50%] h-full bg-gradient-to-b from-[#5c4033] via-[#8b5a2b] to-[#3e2723]"></div>
            {/* Joint (Khớp - Kim loại) */}
            <div className="w-[2%] h-full bg-gradient-to-b from-[#5c4033] via-[#8b5a2b] to-[#3e2723]"></div>
            {/* Forearm (Cán trên - Gỗ sẫm vân) */}
            <div className="w-[15%] h-full bg-gradient-to-b from-[#5c4033] via-[#8b5a2b] to-[#3e2723]"></div>
            {/* Wrap (Tay cầm - Đen/Họa tiết) */}
            <div className="w-[18%] h-full bg-gradient-to-b from-gray-800 via-gray-700 to-gray-900 border-x border-white/10"></div>
            {/* Butt Sleeve (Chuôi - Gỗ sẫm) */}
            <div className="w-[9%] h-full bg-gradient-to-b from-[#5c4033] via-[#8b5a2b] to-[#3e2723]"></div>
            {/* Bumper (Đế cao su) */}
            <div className="w-[1%] h-full bg-black rounded-r-sm"></div>
        </div>
    </div>
);

const TableTimer = ({ startDate }: { startDate: Date }) => {
    const [elapsed, setElapsed] = useState<string>("");

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const start = new Date(startDate);
            const diff = now.getTime() - start.getTime();
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            setElapsed(`${hours}h ${minutes}p`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [startDate]);

    return <span>{elapsed}</span>;
}

export function TableGrid({ onSelectTable }: TableGridProps) {
    const tables = useLiveQuery(async () => {
        const allTables = await db.billiardTables.toArray();
        const occupiedOrderIds = allTables
            .filter(t => t.currentOrderId)
            .map(t => t.currentOrderId as number);
        
        const orders = await db.orders.where('id').anyOf(occupiedOrderIds).toArray();
        
        return allTables.map(table => {
            const order = orders.find(o => o.id === table.currentOrderId);
            return {
                ...table,
                startTime: order ? order.date : null
            };
        });
    });

    if (!tables) return null;

    return (
        <div className="p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {tables.map(table => (
                    <div 
                        key={table.id}
                        onClick={() => onSelectTable(table.id!)}
                        className="relative group cursor-pointer"
                    >
                    {/* Table Frame */}
                    <div className={cn(
                        "h-56 rounded-lg border-[14px] shadow-2xl transition-transform transform group-hover:scale-105 relative",
                        table.status === 'occupied' 
                            ? "border-amber-900 bg-red-800" 
                            : "border-amber-800 bg-green-700"
                    )}>
                         {/* Pockets */}
                         <Pockets />
                         
                         {/* Table Surface Gradient/Texture */}
                         <div className={cn(
                             "w-full h-full flex flex-col items-center justify-center relative overflow-hidden",
                              table.status === 'occupied' ? "bg-red-900/40" : "bg-green-600/10"
                         )}>
                             


                             {/* Center Logo/Status */}
                             <div className="text-center z-20 pointer-events-none">
                                 <h3 className="font-bold text-2xl text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">{table.name}</h3>
                                 <div className="flex flex-col gap-1 items-center">
                                     <span className={cn(
                                         "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg border border-white/20",
                                         table.status === 'occupied' 
                                            ? "bg-red-600 text-white animate-pulse" 
                                            : "bg-green-600 text-white"
                                     )}>
                                         {table.status === 'occupied' ? "Đang chơi" : "Trống"}
                                     </span>
                                     <span className="text-white/90 text-xs font-medium bg-black/40 px-2 py-0.5 rounded mt-1">
                                         {table.pricePerHour?.toLocaleString()}đ / giờ
                                     </span>
                                     {table.status === 'occupied' && table.startTime && (
                                         <span className="text-white font-mono text-xs bg-black/60 px-2 py-1 rounded border border-white/10 shadow-sm whitespace-nowrap mt-1">
                                             <TableTimer startDate={table.startTime} />
                                         </span>
                                     )}
                                 </div>
                             </div>

                             {/* Left Side: Cue Stick */}
                             {table.status === 'occupied' && (
                                 <CueStick />
                             )}

                             {/* Right Side: Balls */}
                             {table.status === 'occupied' && (
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-20">
                                     <TriangleRack />
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            ))}
            </div>
        </div>
    );
}
