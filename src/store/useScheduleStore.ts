import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduleBlock {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface DoctorInfo {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  slotInterval: number;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  createdBy: string;
}

interface ScheduleStore {
  schedules: ScheduleBlock[];
  doctors: DoctorInfo[];
  blockedDates: BlockedDate[];
  fetchSchedules: (doctorId: string) => Promise<void>;
  fetchAllSchedules: () => Promise<void>;
  fetchDoctors: () => Promise<void>;
  fetchBlockedDates: () => Promise<void>;
  addBlockedDate: (date: string, reason: string) => Promise<void>;
  removeBlockedDate: (id: string) => Promise<void>;
  isDateBlocked: (date: string) => boolean;
  addBlock: (block: Omit<ScheduleBlock, 'id'>) => Promise<void>;
  updateBlock: (id: string, data: Partial<ScheduleBlock>) => Promise<void>;
  deleteBlock: (id: string) => Promise<void>;
  getBlocksForDay: (doctorId: string, dayOfWeek: number) => ScheduleBlock[];
  generateAvailableSlots: (doctorId: string, dayOfWeek: number, intervalOverride?: number) => string[];
}

function mapBlock(b: any): ScheduleBlock {
  return {
    id: b.id,
    doctorId: b.doctor_id,
    dayOfWeek: b.day_of_week,
    startTime: b.start_time,
    endTime: b.end_time,
    active: b.active,
  };
}

function generateSlotsFromBlock(startTime: string, endTime: string, interval: number = 10): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  for (let m = startMin; m < endMin; m += interval) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
  return slots;
}

export const useScheduleStore = create<ScheduleStore>()((set, get) => ({
  schedules: [],
  doctors: [],

  fetchSchedules: async (doctorId) => {
    const { data } = await supabase
      .from('doctor_schedules')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week')
      .order('start_time');
    if (data) set({ schedules: data.map(mapBlock) });
  },

  fetchAllSchedules: async () => {
    const { data } = await supabase
      .from('doctor_schedules')
      .select('*')
      .order('day_of_week')
      .order('start_time');
    if (data) set({ schedules: data.map(mapBlock) });
  },

  fetchDoctors: async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'doctor');
    if (!roles || roles.length === 0) { set({ doctors: [] }); return; }
    const ids = roles.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, slot_interval')
      .in('user_id', ids);
    if (profiles) {
      set({
        doctors: profiles.map(p => ({
          userId: p.user_id,
          fullName: p.full_name,
          avatarUrl: (p as any).avatar_url || null,
          slotInterval: (p as any).slot_interval ?? 10,
        })),
      });
    }
  },

  addBlock: async (block) => {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .insert({
        doctor_id: block.doctorId,
        day_of_week: block.dayOfWeek,
        start_time: block.startTime,
        end_time: block.endTime,
        active: block.active,
      } as any)
      .select()
      .single();
    if (error) throw error;
    set(s => ({ schedules: [...s.schedules, mapBlock(data)] }));
  },

  updateBlock: async (id, data) => {
    const update: any = {};
    if (data.active !== undefined) update.active = data.active;
    if (data.startTime) update.start_time = data.startTime;
    if (data.endTime) update.end_time = data.endTime;
    await supabase.from('doctor_schedules').update(update).eq('id', id);
    set(s => ({
      schedules: s.schedules.map(b => b.id === id ? { ...b, ...data } : b),
    }));
  },

  deleteBlock: async (id) => {
    await supabase.from('doctor_schedules').delete().eq('id', id);
    set(s => ({ schedules: s.schedules.filter(b => b.id !== id) }));
  },

  getBlocksForDay: (doctorId, dayOfWeek) =>
    get().schedules.filter(b => b.doctorId === doctorId && b.dayOfWeek === dayOfWeek && b.active),

  generateAvailableSlots: (doctorId, dayOfWeek, intervalOverride?) => {
    const blocks = get().getBlocksForDay(doctorId, dayOfWeek);
    const doctor = get().doctors.find(d => d.userId === doctorId);
    const interval = intervalOverride ?? doctor?.slotInterval ?? 10;
    const allSlots: string[] = [];
    for (const block of blocks) {
      allSlots.push(...generateSlotsFromBlock(block.startTime, block.endTime, interval));
    }
    return [...new Set(allSlots)].sort();
  },
}));
