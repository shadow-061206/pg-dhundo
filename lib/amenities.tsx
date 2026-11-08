import {
  Wifi, Utensils, AirVent, Cctv, BatteryCharging, WashingMachine, ShieldCheck, Droplets, Dumbbell,
  type LucideIcon,
} from "lucide-react";

export const AMENITIES: Record<string, { label: string; icon: LucideIcon }> = {
  wifi: { label: "Wi-Fi", icon: Wifi },
  food: { label: "Food", icon: Utensils },
  ac: { label: "AC", icon: AirVent },
  cctv: { label: "CCTV", icon: Cctv },
  power_backup: { label: "Power Backup", icon: BatteryCharging },
  laundry: { label: "Laundry", icon: WashingMachine },
  wardens: { label: "24/7 Wardens", icon: ShieldCheck },
  purified_water: { label: "Purified Water", icon: Droplets },
  gym: { label: "Gym", icon: Dumbbell },
};
