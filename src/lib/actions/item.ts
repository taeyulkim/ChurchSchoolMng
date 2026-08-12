'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { Database } from '@/lib/supabase/database.types';

type ItemRow = Database['public']['Tables']['items']['Row'];
type ItemInsert = Database['public']['Tables']['items']['Insert'];
type ItemUpdate = Database['public']['Tables']['items']['Update'];

let MOCK_ITEMS: ItemRow[] = [
  { id: 1, name: '마이크', category: '음향기기', quantity: 4, location: '본당 방송실', status: 'good', department: '어린이부', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 2, name: '성경책 (어린이용)', category: '도서', quantity: 25, location: '유년부실', status: 'good', department: '어린이부', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 3, name: '프로젝터 리모컨', category: '기자재', quantity: 1, location: '중등부실', status: 'missing', department: '청소년부', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 4, name: '접이식 의자', category: '가구', quantity: 15, location: '창고', status: 'repair', department: '청년부', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getItems(): Promise<ActionResponse<ItemRow[]>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: true, data: [...MOCK_ITEMS] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return handleSupabaseError(error);

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function createItem(item: ItemInsert): Promise<ActionResponse<ItemRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const newItem: ItemRow = {
        id: Math.max(0, ...MOCK_ITEMS.map(i => i.id)) + 1,
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;
      MOCK_ITEMS.push(newItem);
      revalidatePath('/items');
      return { success: true, data: newItem };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      .insert(item as any)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/items');

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

export async function updateItem(id: number, item: ItemUpdate): Promise<ActionResponse<ItemRow>> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const idx = MOCK_ITEMS.findIndex(i => i.id === id);
      if (idx === -1) throw new Error('Item not found');
      MOCK_ITEMS[idx] = {
        ...MOCK_ITEMS[idx],
        ...item,
        updated_at: new Date().toISOString(),
      } as any;
      revalidatePath('/items');
      return { success: true, data: MOCK_ITEMS[idx] };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('items')
      // @ts-ignore
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) return handleSupabaseError(error);

    revalidatePath('/items');

    return { success: true, data };
  } catch (err) {
    return handleSupabaseError(err);
  }
}
