import { createClient } from '@supabase/supabase-js';

// Supabase URL과 익명 키(anon key)는 환경 변수에서 가져옵니다.
// .env.local 파일에 설정해야 합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey); 