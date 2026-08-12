-- 1. 상담록 테이블 생성
CREATE TABLE IF NOT EXISTS public.counseling_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 작성자(교사)
    counseling_date DATE NOT NULL DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 인덱스 생성 (조회 성능 최적화)
CREATE INDEX idx_counseling_student_id ON public.counseling_records(student_id);
CREATE INDEX idx_counseling_date ON public.counseling_records(counseling_date DESC);

-- 3. RLS(Row Level Security) 설정
ALTER TABLE public.counseling_records ENABLE ROW LEVEL SECURITY;

-- 4. 정책(Policies) 추가
CREATE POLICY "Enable read access for authenticated users" 
ON public.counseling_records FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.counseling_records FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for creators" 
ON public.counseling_records FOR UPDATE 
TO authenticated 
USING (auth.uid() = counselor_id);

CREATE POLICY "Enable delete for creators" 
ON public.counseling_records FOR DELETE 
TO authenticated 
USING (auth.uid() = counselor_id);
