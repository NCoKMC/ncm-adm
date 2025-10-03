-- Supabase Storage 버킷 생성 마이그레이션
-- 작성일: 2024-03-20
-- 설명: 사역자 파일 업로드를 위한 Storage 버킷을 생성합니다.

-- Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'missionary-files',
  'missionary-files',
  false, -- 비공개 버킷
  10485760, -- 10MB 파일 크기 제한
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- Storage 정책 설정 - 인증된 사용자만 업로드 가능
CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'missionary-files' AND 
  auth.role() = 'authenticated'
);

-- Storage 정책 설정 - 인증된 사용자만 다운로드 가능
CREATE POLICY "Allow authenticated users to download files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'missionary-files' AND 
  auth.role() = 'authenticated'
);

-- Storage 정책 설정 - 인증된 사용자만 업데이트 가능
CREATE POLICY "Allow authenticated users to update files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'missionary-files' AND 
  auth.role() = 'authenticated'
);

-- Storage 정책 설정 - 인증된 사용자만 삭제 가능
CREATE POLICY "Allow authenticated users to delete files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'missionary-files' AND 
  auth.role() = 'authenticated'
);

