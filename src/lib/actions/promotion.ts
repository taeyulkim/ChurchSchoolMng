'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ActionResponse } from './types';
import { handleSupabaseError } from './utils';
import { isMasterAdmin } from './user';
import { Database } from '@/lib/supabase/database.types';

type StudentRow = Database['public']['Tables']['students']['Row'];
type Department = StudentRow['department'];

export interface PromotionChange {
  studentId: number;
  name: string;
  fromDepartment: Department;
  fromGrade: string | null;
  toDepartment: Department;
  toGrade: string | null;
  departmentChanged: boolean;
}

export interface MissingBirthDateStudent {
  studentId: number;
  name: string;
  department: Department;
}

export interface PromotionPreview {
  year: number;
  changes: PromotionChange[];
  missingBirthDate: MissingBirthDateStudent[];
}

/**
 * 생년월일과 기준 연도로 부서/학년을 계산합니다.
 * 나이는 "그 해 기준 만 나이"(year - 출생연도)로 계산합니다.
 *   0~4세 유아부 / 5~6세 유치부 / 7~12세 어린이부(초1~초6)
 *   13~18세 청소년부(중1~고3) / 19세 이상 청년부
 */
function computePromotion(birthDate: string, year: number): { department: Department; grade: string | null } {
  const birthYear = new Date(birthDate).getUTCFullYear();
  const ageBand = year - birthYear;

  if (ageBand <= 4) return { department: '유아부', grade: null };
  if (ageBand <= 6) return { department: '유치부', grade: null };
  if (ageBand <= 12) return { department: '어린이부', grade: `초${ageBand - 6}` };
  if (ageBand <= 18) {
    const n = ageBand - 12;
    return n <= 3 ? { department: '청소년부', grade: `중${n}` } : { department: '청소년부', grade: `고${n - 3}` };
  }
  return { department: '청년부', grade: null };
}

async function buildPreview(): Promise<ActionResponse<PromotionPreview>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true);

    if (error) return handleSupabaseError(error);

    const students = (data ?? []) as StudentRow[];
    const year = new Date().getFullYear();
    const changes: PromotionChange[] = [];
    const missingBirthDate: MissingBirthDateStudent[] = [];

    students.forEach((s) => {
      if (!s.birth_date) {
        missingBirthDate.push({ studentId: s.id, name: s.name, department: s.department });
        return;
      }
      const { department, grade } = computePromotion(s.birth_date, year);
      if (department !== s.department || grade !== s.grade) {
        changes.push({
          studentId: s.id,
          name: s.name,
          fromDepartment: s.department,
          fromGrade: s.grade,
          toDepartment: department,
          toGrade: grade,
          departmentChanged: department !== s.department,
        });
      }
    });

    changes.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    missingBirthDate.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    return { success: true, data: { year, changes, missingBirthDate } };
  } catch (err) {
    return handleSupabaseError(err);
  }
}

/**
 * 매년 진급 처리 미리보기 (마스터 관리자 전용).
 * 실제로 값을 바꾸지 않고, 지금 실행하면 무엇이 바뀔지만 계산합니다.
 */
export async function previewYearlyPromotion(): Promise<ActionResponse<PromotionPreview>> {
  if (!(await isMasterAdmin())) {
    return { success: false, error: '학년/부서 진급 처리는 마스터 관리자만 가능합니다.' };
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: true, data: { year: new Date().getFullYear(), changes: [], missingBirthDate: [] } };
  }
  return buildPreview();
}

/**
 * 매년 진급 처리 실행 (마스터 관리자 전용).
 * 미리보기와 동일한 계산으로 실제 학생 department/grade를 갱신합니다.
 */
export async function applyYearlyPromotion(): Promise<ActionResponse<{ count: number; failed: number }>> {
  if (!(await isMasterAdmin())) {
    return { success: false, error: '학년/부서 진급 처리는 마스터 관리자만 가능합니다.' };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: true, data: { count: 0, failed: 0 } };
  }

  const previewRes = await buildPreview();
  if (!previewRes.success || !previewRes.data) {
    return { success: false, error: previewRes.error };
  }

  const { changes } = previewRes.data;
  if (changes.length === 0) {
    return { success: true, data: { count: 0, failed: 0 } };
  }

  const supabase = await createClient();
  let count = 0;
  let failed = 0;

  for (const change of changes) {
    const { error } = await supabase
      .from('students')
      .update({ department: change.toDepartment, grade: change.toGrade } as never)
      .eq('id', change.studentId);

    if (error) {
      console.error(error);
      failed++;
    } else {
      count++;
    }
  }

  revalidatePath('/students');
  revalidatePath('/dashboard');
  revalidatePath('/settings/promotion');

  return { success: true, data: { count, failed } };
}
