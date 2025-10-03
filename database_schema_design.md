# 사역자 정보 관리 시스템 데이터베이스 설계

## 개요
사역자 등록 정보를 관리하기 위한 데이터베이스 스키마 설계 문서입니다. 이 문서는 첨부된 이미지의 폼 구조를 기반으로 작성되었습니다.

## 테이블 구조

### 1. missionaries (사역자 기본 정보)

사역자의 기본적인 개인 정보와 사역 관련 정보를 저장하는 메인 테이블입니다.

```sql
CREATE TABLE missionaries (
    id SERIAL PRIMARY KEY,
    missionary_id VARCHAR(20) UNIQUE NOT NULL,  -- 사역자 ID
    korean_name VARCHAR(100) NOT NULL,          -- 한글명
    english_name VARCHAR(100),                  -- 영문명
    mission_name VARCHAR(100),                  -- 사역명
    gender VARCHAR(10) NOT NULL,                -- 성별 (male/female)
    marital_status VARCHAR(20),                 -- 결혼여부
    resident_number1 VARCHAR(10),               -- 주민등록번호 앞자리
    resident_number2 VARCHAR(10),               -- 주민등록번호 뒷자리
    birth_date DATE,                            -- 생년월일
    passport_number VARCHAR(50),                -- 여권번호
    admission_date DATE NOT NULL,               -- 허입일자
    dispatch_date DATE,                         -- 파송일자
    end_date DATE,                              -- 종료일자
    training_institution VARCHAR(100),          -- 훈련기관
    training_batch VARCHAR(50),                 -- 훈련기수
    training_start_date DATE,                   -- 훈련 시작일
    training_end_date DATE,                     -- 훈련 종료일
    address TEXT,                               -- 주소
    photo_url VARCHAR(500),                     -- 사진 파일 URL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. spouse_info (배우자 정보)

사역자의 배우자 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE spouse_info (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES missionaries(id) ON DELETE CASCADE,
    korean_name VARCHAR(100),                   -- 한글명
    english_name VARCHAR(100),                  -- 영문명
    mission_name VARCHAR(100),                  -- 사역명
    gender VARCHAR(10),                         -- 성별 (male/female)
    birth_date DATE,                            -- 생년월일
    passport_number VARCHAR(50),                -- 여권번호
    admission_date DATE,                        -- 허입일자
    dispatch_date DATE,                         -- 파송일자
    training_institution VARCHAR(100),          -- 훈련기관
    training_batch VARCHAR(50),                 -- 훈련기수
    training_start_date DATE,                   -- 훈련 시작일
    training_end_date DATE,                     -- 훈련 종료일
    address TEXT,                               -- 주소
    photo_url VARCHAR(500),                     -- 사진 파일 URL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. contact_info (연락처 정보)

사역자의 연락처 및 추가 정보를 저장하는 테이블입니다.

```sql
CREATE TABLE contact_info (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES missionaries(id) ON DELETE CASCADE,
    local_address TEXT,                         -- 현지주소
    phone1 VARCHAR(50),                         -- 전화번호1
    phone2 VARCHAR(50),                         -- 전화번호2
    fax_number VARCHAR(50),                     -- 팩스번호
    mobile_phone VARCHAR(50),                   -- 핸드폰
    email1 VARCHAR(100),                        -- E-mail1
    email2 VARCHAR(100),                        -- E-mail2
    homepage_url VARCHAR(500),                  -- 홈페이지URL
    family_contact VARCHAR(50),                 -- 가족연락처
    domestic_family_address TEXT,               -- 국내가족주소
    virtual_account VARCHAR(50),                -- 가상계좌
    travel_insurance_status VARCHAR(20),        -- 여행자보험가입여부
    national_pension_status VARCHAR(20),        -- 국민연금가입여부
    regular_mail TEXT[],                        -- 정기우편물 (배열)
    publication_name VARCHAR(100),              -- 신청간행물명
    attached_file_url VARCHAR(500),             -- 사역자첨부파일 URL
    family_photo_url VARCHAR(500),              -- 가족사진파일 URL
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 4. privacy_consent (개인정보 동의)

개인정보 제공 동의 내역을 저장하는 테이블입니다.

```sql
CREATE TABLE privacy_consent (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES missionaries(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE, -- 개인정보 제공 동의 여부
    consent_date TIMESTAMP DEFAULT NOW(),          -- 동의 일시
    ip_address INET,                               -- 동의 시 IP 주소
    user_agent TEXT,                               -- 사용자 에이전트
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. file_uploads (파일 업로드 관리)

업로드된 파일들의 메타데이터를 관리하는 테이블입니다.

```sql
CREATE TABLE file_uploads (
    id SERIAL PRIMARY KEY,
    missionary_id INTEGER REFERENCES missionaries(id) ON DELETE CASCADE,
    file_type VARCHAR(50) NOT NULL,             -- 파일 유형 (photo, spouse_photo, attached, family_photo)
    original_filename VARCHAR(255) NOT NULL,    -- 원본 파일명
    stored_filename VARCHAR(255) NOT NULL,      -- 저장된 파일명
    file_path VARCHAR(500) NOT NULL,            -- 파일 경로
    file_size BIGINT NOT NULL,                  -- 파일 크기 (bytes)
    mime_type VARCHAR(100),                     -- MIME 타입
    upload_date TIMESTAMP DEFAULT NOW(),        -- 업로드 일시
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 인덱스

성능 최적화를 위한 인덱스를 생성합니다.

```sql
-- missionaries 테이블 인덱스
CREATE INDEX idx_missionaries_missionary_id ON missionaries(missionary_id);
CREATE INDEX idx_missionaries_korean_name ON missionaries(korean_name);
CREATE INDEX idx_missionaries_admission_date ON missionaries(admission_date);
CREATE INDEX idx_missionaries_created_at ON missionaries(created_at);

-- spouse_info 테이블 인덱스
CREATE INDEX idx_spouse_info_missionary_id ON spouse_info(missionary_id);

-- contact_info 테이블 인덱스
CREATE INDEX idx_contact_info_missionary_id ON contact_info(missionary_id);
CREATE INDEX idx_contact_info_email1 ON contact_info(email1);

-- privacy_consent 테이블 인덱스
CREATE INDEX idx_privacy_consent_missionary_id ON privacy_consent(missionary_id);

-- file_uploads 테이블 인덱스
CREATE INDEX idx_file_uploads_missionary_id ON file_uploads(missionary_id);
CREATE INDEX idx_file_uploads_file_type ON file_uploads(file_type);
```

## 제약 조건

데이터 무결성을 보장하기 위한 제약 조건입니다.

```sql
-- missionaries 테이블 제약 조건
ALTER TABLE missionaries ADD CONSTRAINT chk_gender CHECK (gender IN ('male', 'female'));
ALTER TABLE missionaries ADD CONSTRAINT chk_marital_status CHECK (marital_status IN ('가정', '미혼', ''));

-- spouse_info 테이블 제약 조건
ALTER TABLE spouse_info ADD CONSTRAINT chk_spouse_gender CHECK (gender IN ('male', 'female'));

-- contact_info 테이블 제약 조건
ALTER TABLE contact_info ADD CONSTRAINT chk_travel_insurance CHECK (travel_insurance_status IN ('전가족', '본인만', '미가입', ''));
ALTER TABLE contact_info ADD CONSTRAINT chk_national_pension CHECK (national_pension_status IN ('가입', '미가입', '-------', ''));

-- privacy_consent 테이블 제약 조건
ALTER TABLE privacy_consent ADD CONSTRAINT chk_consent_given CHECK (consent_given = TRUE);
```

## 트리거

업데이트 시간을 자동으로 갱신하는 트리거입니다.

```sql
-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_missionaries_updated_at BEFORE UPDATE ON missionaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spouse_info_updated_at BEFORE UPDATE ON spouse_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_info_updated_at BEFORE UPDATE ON contact_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 뷰 (View)

자주 사용되는 조회를 위한 뷰를 생성합니다.

```sql
-- 사역자 전체 정보 조회 뷰
CREATE VIEW missionary_full_info AS
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
FROM missionaries m
LEFT JOIN spouse_info s ON m.id = s.missionary_id
LEFT JOIN contact_info c ON m.id = c.missionary_id
LEFT JOIN privacy_consent pc ON m.id = pc.missionary_id;
```

## 마이그레이션 스크립트

Supabase에서 사용할 마이그레이션 스크립트입니다.

```sql
-- 마이그레이션 파일: 20240320000001_create_missionaries_tables.sql

-- 테이블 생성
-- (위의 CREATE TABLE 구문들을 순서대로 실행)

-- 인덱스 생성
-- (위의 CREATE INDEX 구문들을 실행)

-- 제약 조건 추가
-- (위의 ALTER TABLE 구문들을 실행)

-- 트리거 생성
-- (위의 함수 및 트리거 구문들을 실행)

-- 뷰 생성
-- (위의 CREATE VIEW 구문을 실행)
```

## 사용 예시

### 데이터 삽입 예시

```sql
-- 사역자 기본 정보 삽입
INSERT INTO missionaries (
    missionary_id, korean_name, english_name, mission_name, gender,
    marital_status, resident_number1, resident_number2, birth_date,
    passport_number, admission_date, dispatch_date, training_institution,
    training_batch, training_start_date, training_end_date, address
) VALUES (
    '00066', '주준성/강은', 'Ju Jun Sung', '라크나스', 'male',
    '가정', '74010', '100534', '1974-01-03',
    'M07947089', '2001-07-09', '2002-03-20', 'GMTC 227',
    'GMTC 227', '2001-01-01', '2001-06-30', 'AEP#11, K.P 119 Tirana, Albania'
);

-- 배우자 정보 삽입
INSERT INTO spouse_info (
    missionary_id, korean_name, english_name, mission_name, gender,
    birth_date, passport_number, admission_date, dispatch_date,
    training_institution, training_batch, training_start_date, training_end_date
) VALUES (
    1, '강은경', 'Kang Eun Kyung', '라크나스', 'female',
    '1970-07-07', 'M07307792', '2001-07-09', '2002-03-20',
    'GMTC 227', 'GMTC 227', '2001-01-01', '2001-06-30'
);

-- 연락처 정보 삽입
INSERT INTO contact_info (
    missionary_id, local_address, phone1, phone2, mobile_phone,
    email1, homepage_url, virtual_account, travel_insurance_status,
    national_pension_status, regular_mail
) VALUES (
    1, 'AEP#11, K.P 119 Tirana, Albania', '+355-69-602-8905', '+355-69-602-8806', '+355-69-602-8905',
    'albania21@hanmail.l', 'https://www.facebook.com/profile.php?id=1000017350166958', '3030400000589', '전가족',
    '-------', ARRAY['GMP', '기도편지']
);

-- 개인정보 동의 삽입
INSERT INTO privacy_consent (missionary_id, consent_given) VALUES (1, TRUE);
```

### 데이터 조회 예시

```sql
-- 전체 사역자 정보 조회
SELECT * FROM missionary_full_info WHERE missionary_id = '00066';

-- 최근 등록된 사역자 조회
SELECT * FROM missionaries ORDER BY created_at DESC LIMIT 10;

-- 특정 사역지의 사역자 조회
SELECT * FROM missionaries WHERE mission_name = '라크나스';

-- 이메일로 사역자 검색
SELECT m.*, c.email1 FROM missionaries m
JOIN contact_info c ON m.id = c.missionary_id
WHERE c.email1 LIKE '%albania21%';
```

## 보안 고려사항

1. **개인정보 보호**: 주민등록번호는 암호화하여 저장 권장
2. **접근 권한**: 역할 기반 접근 제어 (RBAC) 구현
3. **감사 로그**: 데이터 변경 이력 추적
4. **백업**: 정기적인 데이터 백업 수행

## 확장 가능성

1. **다국어 지원**: 국제화를 위한 언어별 필드 추가
2. **히스토리 관리**: 데이터 변경 이력을 별도 테이블로 관리
3. **알림 시스템**: 중요한 날짜나 이벤트 알림 기능
4. **통계 및 리포팅**: 사역자 현황 분석 기능

