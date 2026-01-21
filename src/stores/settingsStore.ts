import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
    billingBlockDuration: number; // in minutes, e.g., 5, 15, 30, 60
    enableBlockBilling: boolean;
    setBillingBlockDuration: (duration: number) => void;
    setEnableBlockBilling: (enable: boolean) => void;
    gracePeriod: number; // minutes
    setGracePeriod: (minutes: number) => void;
    // Printer Settings
    shopName: string;
    shopAddress: string;
    shopPhone: string;
    receiptFooter: string;
    headerLayout: string[]; // Array of keys: 'shopName', 'shopAddress', 'shopPhone'
    printStyle: {
        paperSize: '58' | '80';
        fontSize: 'sm' | 'base' | 'lg';
        fontFamily: 'sans' | 'mono' | 'serif'; // mapped to styles
        alignment: 'left' | 'center' | 'right';
    };
    setShopSettings: (settings: Partial<{ shopName: string; shopAddress: string; shopPhone: string; receiptFooter: string }>) => void;
    setHeaderLayout: (layout: string[]) => void;
    setPrintStyle: (style: Partial<SettingsState['printStyle']>) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            billingBlockDuration: 60, // Default to hourly
            enableBlockBilling: false,
            setBillingBlockDuration: (duration) => set({ billingBlockDuration: duration }),
            setEnableBlockBilling: (enable) => set({ enableBlockBilling: enable }),
            gracePeriod: 5,
            setGracePeriod: (minutes) => set({ gracePeriod: minutes }),

            // Default Printer Settings
            shopName: 'POS365 Store',
            shopAddress: '123 Đường ABC, Phường XYZ, TP.HCM',
            shopPhone: '0901234567',
            receiptFooter: 'Cảm ơn Quý khách. Hẹn gặp lại!',
            headerLayout: ['shopName', 'shopAddress', 'shopPhone'],
            printStyle: {
                paperSize: '80',
                fontSize: 'base',
                fontFamily: 'sans',
                alignment: 'center',
            },

            setShopSettings: (settings) => set((state) => ({ ...state, ...settings })),
            setHeaderLayout: (layout) => set({ headerLayout: layout }),
            setPrintStyle: (style) => set((state) => ({ printStyle: { ...state.printStyle, ...style } })),
        }),
        {
            name: 'pos-settings-storage',
        }
    )
);
