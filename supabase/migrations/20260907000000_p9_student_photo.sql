-- 학생 사진 등록 기능

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_path TEXT;

-- 학생 사진 저장용 비공개 스토리지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can read student photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'student-photos');

CREATE POLICY "Authenticated users can upload student photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Authenticated users can update student photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-photos')
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Authenticated users can delete student photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-photos');
