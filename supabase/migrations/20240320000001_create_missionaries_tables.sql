-- 사역자 정보 관리 시스템 테이블 생성 마이그레이션
-- 작성일: 2024-03-20
-- 설명: 사역자 등록 정보를 관리하기 위한 테이블들을 생성합니다.

-- 1. missionaries 테이블 (사역자 기본 정보)
CREATE TABLE IF NOT EXISTS ncm_m10001 (
    id SERIAL PRIMARY KEY,
    missionary_id VARCHAR(20) UNIQUE NOT NULL,
    korean_name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    mission_name VARCHAR(100),
    gender VARCHAR(10) NOT NULL,
    marital_status VARCHAR(20),
    resident_number1 VARCHAR(10),
    resident_number2 VARCHAR(10),
    birth_date DATE,
    passport_number VARCHAR(50),
    admission_date DATE NOT NULL,
    dispatch_date DATE,
    end_date DATE,
    training_institution VARCHAR(100),
    training_batch VARCHAR(50),
    training_start_date DATE,
    training_end_date DATE,
    address TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. spouse_info 테이블 (배우자 정보)
CREATE TABLE IF NOT EXISTS ncm_m10101 (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES ncm_m10001(id) ON DELETE CASCADE,
    korean_name VARCHAR(100),
    english_name VARCHAR(100),
    mission_name VARCHAR(100),
    gender VARCHAR(10),
    birth_date DATE,
    passport_number VARCHAR(50),
    admission_date DATE,
    dispatch_date DATE,
    training_institution VARCHAR(100),
    training_batch VARCHAR(50),
    training_start_date DATE,
    training_end_date DATE,
    address TEXT,
    photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. contact_info 테이블 (연락처 정보)
CREATE TABLE IF NOT EXISTS ncm_m10002 (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES ncm_m10001(id) ON DELETE CASCADE,
    local_address TEXT,
    phone1 VARCHAR(50),
    phone2 VARCHAR(50),
    fax_number VARCHAR(50),
    mobile_phone VARCHAR(50),
    email1 VARCHAR(100),
    email2 VARCHAR(100),
    homepage_url VARCHAR(500),
    family_contact VARCHAR(50),
    domestic_family_address TEXT,
    virtual_account VARCHAR(50),
    travel_insurance_status VARCHAR(20),
    national_pension_status VARCHAR(20),
    regular_mail TEXT[],
    publication_name VARCHAR(100),
    attached_file_url VARCHAR(500),
    family_photo_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ncm_m10003 테이블 (개인정보 동의)
CREATE TABLE IF NOT EXISTS ncm_m10003 (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES ncm_m10001(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ncm_file_uploads 테이블 (파일 업로드 관리)
CREATE TABLE IF NOT EXISTS ncm_file_uploads (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES ncm_m10001(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_missionaries_missionary_id ON ncm_m10001(missionary_id);
CREATE INDEX IF NOT EXISTS idx_missionaries_korean_name ON ncm_m10001(korean_name);
CREATE INDEX IF NOT EXISTS idx_missionaries_admission_date ON ncm_m10001(admission_date);
CREATE INDEX IF NOT EXISTS idx_missionaries_created_at ON ncm_m10001(created_at);

CREATE INDEX IF NOT EXISTS idx_spouse_info_missionary_id ON ncm_m10101(missionary_id);

CREATE INDEX IF NOT EXISTS idx_contact_info_missionary_id ON ncm_m10002(missionary_id);
CREATE INDEX IF NOT EXISTS idx_contact_info_email1 ON ncm_m10002(email1);

CREATE INDEX IF NOT EXISTS idx_privacy_consent_missionary_id ON ncm_m10003(missionary_id);

CREATE INDEX IF NOT EXISTS idx_file_uploads_missionary_id ON ncm_file_uploads(missionary_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_file_type ON ncm_file_uploads(file_type);

-- 제약 조건 추가
-- ALTER TABLE ncm_m10001 ADD CONSTRAINT IF NOT EXISTS chk_gender CHECK (gender IN ('male', 'female'));
-- ALTER TABLE ncm_m10001 ADD CONSTRAINT IF NOT EXISTS chk_marital_status CHECK (marital_status IN ('가정', '미혼', ''));

-- ALTER TABLE ncm_m10101 ADD CONSTRAINT IF NOT EXISTS chk_spouse_gender CHECK (gender IN ('male', 'female'));

-- ALTER TABLE ncm_m10002 ADD CONSTRAINT IF NOT EXISTS chk_travel_insurance CHECK (travel_insurance_status IN ('전가족', '본인만', '미가입', ''));
-- ALTER TABLE ncm_m10002 ADD CONSTRAINT IF NOT EXISTS chk_national_pension CHECK (national_pension_status IN ('가입', '미가입', '-------', ''));

-- ALTER TABLE ncm_m10003 ADD CONSTRAINT IF NOT EXISTS chk_consent_given CHECK (consent_given = TRUE);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_missionaries_updated_at ON ncm_m10001;
CREATE TRIGGER update_missionaries_updated_at BEFORE UPDATE ON ncm_m10001
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_spouse_info_updated_at ON ncm_m10101;
CREATE TRIGGER update_spouse_info_updated_at BEFORE UPDATE ON ncm_m10101
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contact_info_updated_at ON ncm_m10002;
CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON ncm_m10002
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 뷰 생성 (사역자 전체 정보 조회)
CREATE OR REPLACE VIEW ncm_m10000_full_info AS
SELECT 
    m.id,
    m.missionary_id,
    m.korean_name,
    m.english_name,
    m.mission_name,
    m.gender,
    m.marital_status,
    m.birth_date,
    m.passport_number,
    m.admission_date,
    m.dispatch_date,
    m.end_date,
    m.training_institution,
    m.training_batch,
    m.address,
    s.korean_name as spouse_korean_name,
    s.english_name as spouse_english_name,
    s.birth_date as spouse_birth_date,
    c.local_address,
    c.phone1,
    c.phone2,
    c.email1,
    c.email2,
    c.homepage_url,
    pc.consent_given,
    pc.consent_date
FROM ncm_m10001 m
LEFT JOIN ncm_m10101 s ON m.id = s.missionary_id
LEFT JOIN ncm_m10002 c ON m.id = c.missionary_id
LEFT JOIN ncm_m10003 pc ON m.id = pc.missionary_id;

-- RLS (Row Level Security) 정책 설정
ALTER TABLE ncm_m10001 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncm_m10101 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncm_m10002 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncm_m10003 ENABLE ROW LEVEL SECURITY;
ALTER TABLE ncm_file_uploads ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 인증된 사용자만 모든 작업 가능
CREATE POLICY "Enable all operations for authenticated users" ON ncm_m10001
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON ncm_m10101
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON ncm_m10002
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON ncm_m10003
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON ncm_file_uploads
    FOR ALL USING (auth.role() = 'authenticated');

-- 샘플 데이터 삭제 (실제 운영에서는 빈 테이블로 시작)
