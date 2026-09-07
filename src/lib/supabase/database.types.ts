export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: 'admin' | 'teacher' | null
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          status: 'pending' | 'approved' | 'rejected' | null
          permissions: Json | null
          birth_date: string | null
          photo_path: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          name: string
          role?: 'admin' | 'teacher' | null
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          permissions?: Json | null
          birth_date?: string | null
          photo_path?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          role?: 'admin' | 'teacher' | null
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          status?: 'pending' | 'approved' | 'rejected' | null
          permissions?: Json | null
          birth_date?: string | null
          photo_path?: string | null
          created_at?: string | null
        }
      }
      students: {
        Row: {
          id: number
          name: string
          gender: 'male' | 'female'
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          birth_date: string | null
          school: string | null
          grade: string | null
          parent_name: string | null
          parent_contact: string | null
          total_talents: number | null
          qr_token: string | null
          is_active: boolean
          photo_path: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          gender: 'male' | 'female'
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          birth_date?: string | null
          school?: string | null
          grade?: string | null
          parent_name?: string | null
          parent_contact?: string | null
          total_talents?: number | null
          qr_token?: string | null
          is_active?: boolean
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          gender?: 'male' | 'female'
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          birth_date?: string | null
          school?: string | null
          grade?: string | null
          parent_name?: string | null
          parent_contact?: string | null
          total_talents?: number | null
          qr_token?: string | null
          is_active?: boolean
          photo_path?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      attendance: {
        Row: {
          id: number
          student_id: number | null
          attendance_date: string
          is_present: boolean | null
          recorded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          student_id?: number | null
          attendance_date: string
          is_present?: boolean | null
          recorded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          student_id?: number | null
          attendance_date?: string
          is_present?: boolean | null
          recorded_by?: string | null
          created_at?: string | null
        }
      }
      talent_transactions: {
        Row: {
          id: number
          student_id: number | null
          type: 'grant' | 'deduct'
          amount: number
          reason: string
          recorded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          student_id?: number | null
          type: 'grant' | 'deduct'
          amount: number
          reason: string
          recorded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          student_id?: number | null
          type?: 'grant' | 'deduct'
          amount?: number
          reason?: string
          recorded_by?: string | null
          created_at?: string | null
        }
      }
      events: {
        Row: {
          id: number
          title: string
          event_date: string
          end_date: string | null
          location: string | null
          type: 'special' | 'meeting' | 'worship'
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          created_at: string | null
        }
        Insert: {
          id?: number
          title: string
          event_date: string
          end_date?: string | null
          location?: string | null
          type: 'special' | 'meeting' | 'worship'
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          created_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          event_date?: string
          end_date?: string | null
          location?: string | null
          type?: 'special' | 'meeting' | 'worship'
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부' | null
          created_at?: string | null
        }
      }
      budget_transactions: {
        Row: {
          id: number
          transaction_date: string
          type: 'income' | 'expense'
          category: string
          description: string
          amount: number
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          recorded_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          transaction_date: string
          type: 'income' | 'expense'
          category: string
          description: string
          amount: number
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          recorded_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          transaction_date?: string
          type?: 'income' | 'expense'
          category?: string
          description?: string
          amount?: number
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          recorded_by?: string | null
          created_at?: string | null
        }
      }
      items: {
        Row: {
          id: number
          name: string
          category: string
          quantity: number | null
          location: string | null
          status: 'good' | 'missing' | 'repair' | null
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          name: string
          category: string
          quantity?: number | null
          location?: string | null
          status?: 'good' | 'missing' | 'repair' | null
          department: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          category?: string
          quantity?: number | null
          location?: string | null
          status?: 'good' | 'missing' | 'repair' | null
          department?: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
          created_at?: string | null
          updated_at?: string | null
        }
      }
      counseling_records: {
        Row: {
          id: string
          student_id: number
          counselor_id: string | null
          counseling_date: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: number
          counselor_id?: string | null
          counseling_date?: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: number
          counselor_id?: string | null
          counseling_date?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: number
          title: string
          content: string
          file_path: string | null
          file_name: string | null
          author_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          file_path?: string | null
          file_name?: string | null
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          file_path?: string | null
          file_name?: string | null
          author_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'teacher'
      department_type: '유아부' | '유치부' | '어린이부' | '청소년부' | '청년부'
      gender_type: 'male' | 'female'
      transaction_type: 'grant' | 'deduct'
      event_type: 'special' | 'meeting' | 'worship'
      budget_type: 'income' | 'expense'
      item_status: 'good' | 'missing' | 'repair'
      profile_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
