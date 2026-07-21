/**
 * ChurchSchoolMng 데이터베이스 타입 정의
 * Supabase PostgreSQL 스키마 기반
 */

// ============================================
// Enums & Constants
// ============================================

/** 사용자 역할 (RBAC) */
export type UserRole = 'super_admin' | 'pastor' | 'teacher' | 'parent';

/** 출석 상태 */
export type AttendanceStatus = '출석' | '결석' | '지각';

/** 달란트 변동 사유 */
export type TalentReason =
  | '출석'
  | '암송'
  | '과제'
  | '봉사'
  | '마켓 차감'
  | '보너스'
  | '기타';

// ============================================
// Database Table Types
// ============================================

/** USERS 테이블 - Supabase Auth 확장 */
export interface User {
  id: string; // UUID (Supabase Auth 연동)
  role: UserRole;
  name: string;
  phone_number: string | null; // 마스킹 대상
  avatar_url: string | null;
  created_at: string; // ISO 8601
  updated_at: string | null;
}

/** DEPARTMENTS 테이블 - 부서 */
export interface Department {
  id: number;
  name: string; // 유아부, 초등부 등
  total_budget: number; // 올해 예산
  created_at: string;
  updated_at: string | null;
}

/** STUDENTS 테이블 - 학생 */
export interface Student {
  id: number;
  department_id: number;
  parent_user_id: string | null; // 학부모 계정 연동 (Nullable)
  name: string;
  birth_date: string | null; // YYYY-MM-DD
  talent_balance: number; // 현재 달란트 잔액 (캐싱)
  qr_code_hash: string | null; // 마켓 결제용 QR
  created_at: string;
  updated_at: string | null;
}

/** TEACHER_DEPARTMENTS 테이블 - 교사-부서 매핑 (N:M) */
export interface TeacherDepartment {
  user_id: string; // UUID
  department_id: number;
  is_manager: boolean; // 부장 교사 여부
  created_at: string;
}

/** TALENT_LOGS 테이블 - 달란트 증감 내역 (Append-only) */
export interface TalentLog {
  id: number;
  student_id: number;
  teacher_id: string; // UUID
  amount: number; // 증감량 (+/-)
  reason: string;
  created_at: string;
}

/** ITEMS 테이블 - 물품 관리 */
export interface Item {
  id: number;
  department_id: number | null; // 공용일 경우 null
  name: string;
  total_qty: number; // 총 수량
  current_qty: number; // 현재 잔여 수량
  created_at: string;
  updated_at: string | null;
}

/** BUDGET_LOGS 테이블 - 예산 지출/수입 */
export interface BudgetLog {
  id: number;
  department_id: number;
  user_id: string; // UUID
  amount: number; // 지출/수입 금액
  description: string; // 내역
  created_at: string;
}

/** SCHEDULES 테이블 - 일정 관리 */
export interface Schedule {
  id: number;
  department_id: number | null; // 전체 행사일 경우 null
  title: string;
  start_time: string; // ISO 8601
  end_time: string; // ISO 8601
  location: string | null; // 본당, 비전홀 등 (중복 검사)
  created_at: string;
  updated_at: string | null;
}

/** ATTENDANCE 테이블 - 출석부 */
export interface Attendance {
  id: number;
  student_id: number;
  attend_date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  created_at: string;
}

/** TASKS 테이블 - 할 일 */
export interface Task {
  id: number;
  user_id: string; // UUID (담당 교사)
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string | null;
}

/** COUNSELING_LOGS 테이블 - 상담록 */
export interface CounselingLog {
  id: number;
  student_id: number;
  teacher_id: string; // UUID (작성 교사)
  content: string;
  counseling_date: string; // YYYY-MM-DD
  created_at: string;
}

// ============================================
// Supabase Database Type Helper
// ============================================

/** Supabase Database 스키마 타입 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<User, 'id'>>;
      };
      departments: {
        Row: Department;
        Insert: Omit<Department, 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Department, 'id'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at' | 'talent_balance'> & {
          id?: number;
          talent_balance?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Student, 'id'>>;
      };
      teacher_departments: {
        Row: TeacherDepartment;
        Insert: Omit<TeacherDepartment, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<TeacherDepartment>;
      };
      talent_logs: {
        Row: TalentLog;
        Insert: Omit<TalentLog, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: never; // Append-only, 수정 불가
      };
      items: {
        Row: Item;
        Insert: Omit<Item, 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Item, 'id'>>;
      };
      budget_logs: {
        Row: BudgetLog;
        Insert: Omit<BudgetLog, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: never; // Append-only
      };
      schedules: {
        Row: Schedule;
        Insert: Omit<Schedule, 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Schedule, 'id'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<Attendance, 'id'>>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Task, 'id'>>;
      };
      counseling_logs: {
        Row: CounselingLog;
        Insert: Omit<CounselingLog, 'id' | 'created_at'> & {
          id?: number;
          created_at?: string;
        };
        Update: Partial<Omit<CounselingLog, 'id'>>;
      };
    };
  };
}

// ============================================
// Utility Types
// ============================================

/** 마스킹 처리된 사용자 (클라이언트 응답용) */
export interface MaskedUser extends Omit<User, 'phone_number'> {
  phone_number: string | null; // 010-1234-**** 형태
}

/** 학생 + 소속 부서 정보 조인 */
export interface StudentWithDepartment extends Student {
  department: Department;
}

/** 교사 + 소속 부서 목록 조인 */
export interface TeacherWithDepartments extends User {
  departments: (TeacherDepartment & { department: Department })[];
}
