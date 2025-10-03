'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useRouter } from 'next/navigation';

interface MissionaryInfo {
  missionaryId: string;
  koreanName: string;
  englishName: string;
  missionName: string;
  gender: 'male' | 'female';
  maritalStatus: string;
  residentNumber1: string;
  residentNumber2: string;
  birthDate: string;
  passportNumber: string;
  admissionDate: string;
  dispatchDate: string;
  endDate: string;
  trainingInstitution: string;
  trainingBatch: string;
  trainingStartDate: string;
  trainingEndDate: string;
  address: string;
  photoFile?: File;
}

interface SpouseInfo {
  koreanName: string;
  englishName: string;
  missionName: string;
  gender: 'male' | 'female';
  birthDate: string;
  passportNumber: string;
  admissionDate: string;
  dispatchDate: string;
  trainingInstitution: string;
  trainingBatch: string;
  trainingStartDate: string;
  trainingEndDate: string;
  address: string;
  photoFile?: File;
}

interface AdditionalInfo {
  localAddress: string;
  phone1: string;
  phone2: string;
  faxNumber: string;
  mobilePhone: string;
  email1: string;
  email2: string;
  homepageUrl: string;
  familyContact: string;
  domesticFamilyAddress: string;
  virtualAccount: string;
  travelInsuranceStatus: string;
  nationalPensionStatus: string;
  regularMail: string[];
  publicationName: string;
  attachedFile?: File;
  familyPhotoFile?: File;
}

export default function TycichusPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const [missionaryInfo, setMissionaryInfo] = useState<MissionaryInfo>({
    missionaryId: '',
    koreanName: '',
    englishName: '',
    missionName: '',
    gender: 'male',
    maritalStatus: '',
    residentNumber1: '',
    residentNumber2: '',
    birthDate: '',
    passportNumber: '',
    admissionDate: '',
    dispatchDate: '',
    endDate: '',
    trainingInstitution: '',
    trainingBatch: '',
    trainingStartDate: '',
    trainingEndDate: '',
    address: ''
  });

  const [spouseInfo, setSpouseInfo] = useState<SpouseInfo>({
    koreanName: '',
    englishName: '',
    missionName: '',
    gender: 'female',
    birthDate: '',
    passportNumber: '',
    admissionDate: '',
    dispatchDate: '',
    trainingInstitution: '',
    trainingBatch: '',
    trainingStartDate: '',
    trainingEndDate: '',
    address: ''
  });

  const [additionalInfo, setAdditionalInfo] = useState<AdditionalInfo>({
    localAddress: '',
    phone1: '',
    phone2: '',
    faxNumber: '',
    mobilePhone: '',
    email1: '',
    email2: '',
    homepageUrl: '',
    familyContact: '',
    domesticFamilyAddress: '',
    virtualAccount: '',
    travelInsuranceStatus: '',
    nationalPensionStatus: '',
    regularMail: [],
    publicationName: ''
  });

  const [consentToPrivacy, setConsentToPrivacy] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: string}>({});

  // searchParams를 컴포넌트 최상위에서 unwrap
  const params = use(searchParams);

  // 편집 모드에서 기존 데이터 불러오기
  useEffect(() => {
    if (params.edit) {
      setIsEditMode(true);
      fetchMissionaryData(params.edit);
    }
  }, [params.edit]);

  const fetchMissionaryData = async (missionaryId: string) => {
    try {
      setLoading(true);

      // 사역자 기본 정보 조회
      const { data: missionaryData, error: missionaryError } = await supabase
        .from('ncm_m10001')
        .select('*')
        .eq('missionary_id', missionaryId)
        .single();

      if (missionaryError) {
        console.error('Error fetching missionary data:', missionaryError);
        alert('사역자 정보를 불러오는 중 오류가 발생했습니다.');
        return;
      }

      if (missionaryData) {
        setMissionaryInfo({
          missionaryId: missionaryData.missionary_id || '',
          koreanName: missionaryData.korean_name || '',
          englishName: missionaryData.english_name || '',
          missionName: missionaryData.mission_name || '',
          gender: missionaryData.gender || 'male',
          maritalStatus: missionaryData.marital_status || '',
          residentNumber1: missionaryData.resident_number1 || '',
          residentNumber2: missionaryData.resident_number2 || '',
          birthDate: missionaryData.birth_date || '',
          passportNumber: missionaryData.passport_number || '',
          admissionDate: missionaryData.admission_date || '',
          dispatchDate: missionaryData.dispatch_date || '',
          endDate: missionaryData.end_date || '',
          trainingInstitution: missionaryData.training_institution || '',
          trainingBatch: missionaryData.training_batch || '',
          trainingStartDate: missionaryData.training_start_date || '',
          trainingEndDate: missionaryData.training_end_date || '',
          address: missionaryData.address || ''
        });

        // 배우자 정보 조회
        const { data: spouseData } = await supabase
          .from('ncm_m10101')
          .select('*')
          .eq('missionary_id', missionaryData.id)
          .single();

        if (spouseData) {
          setSpouseInfo({
            koreanName: spouseData.korean_name || '',
            englishName: spouseData.english_name || '',
            missionName: spouseData.mission_name || '',
            gender: spouseData.gender || 'female',
            birthDate: spouseData.birth_date || '',
            passportNumber: spouseData.passport_number || '',
            admissionDate: spouseData.admission_date || '',
            dispatchDate: spouseData.dispatch_date || '',
            trainingInstitution: spouseData.training_institution || '',
            trainingBatch: spouseData.training_batch || '',
            trainingStartDate: spouseData.training_start_date || '',
            trainingEndDate: spouseData.training_end_date || '',
            address: spouseData.address || ''
          });
        }

        // 연락처 정보 조회
        const { data: contactData } = await supabase
          .from('ncm_m10002')
          .select('*')
          .eq('missionary_id', missionaryData.id)
          .single();

        if (contactData) {
          setAdditionalInfo({
            localAddress: contactData.local_address || '',
            phone1: contactData.phone1 || '',
            phone2: contactData.phone2 || '',
            faxNumber: contactData.fax_number || '',
            mobilePhone: contactData.mobile_phone || '',
            email1: contactData.email1 || '',
            email2: contactData.email2 || '',
            homepageUrl: contactData.homepage_url || '',
            familyContact: contactData.family_contact || '',
            domesticFamilyAddress: contactData.domestic_family_address || '',
            virtualAccount: contactData.virtual_account || '',
            travelInsuranceStatus: contactData.travel_insurance_status || '',
            nationalPensionStatus: contactData.national_pension_status || '',
            regularMail: contactData.regular_mail || [],
            publicationName: contactData.publication_name || ''
          });
        }

        // 개인정보 동의 조회
        const { data: consentData } = await supabase
          .from('ncm_m10003')
          .select('consent_given')
          .eq('missionary_id', missionaryData.id)
          .single();

        if (consentData) {
          setConsentToPrivacy(consentData.consent_given);
        }

        // 업로드된 파일 정보 조회
        const { data: fileData } = await supabase
          .from('ncm_file_uploads')
          .select('file_type, original_filename')
          .eq('missionary_id', missionaryData.id);

        if (fileData) {
          const files: {[key: string]: string} = {};
          fileData.forEach(file => {
            files[file.file_type] = file.original_filename;
          });
          console.log(files);
          setUploadedFiles(files);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMissionaryInfoChange = (field: keyof MissionaryInfo, value: string) => {
    setMissionaryInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSpouseInfoChange = (field: keyof SpouseInfo, value: string) => {
    setSpouseInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAdditionalInfoChange = (field: keyof AdditionalInfo, value: string | string[]) => {
    setAdditionalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (type: string, file: File, missionaryId?: string) => {
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('파일 크기는 10MB를 초과할 수 없습니다.');
      return;
    }

    // 허용된 파일 형식 확인
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedDocTypes];

    if (!allAllowedTypes.includes(file.type)) {
      alert('지원되지 않는 파일 형식입니다. 이미지 파일(JPG, PNG, GIF) 또는 PDF, Word 문서만 업로드 가능합니다.');
      return;
    }

    // 업로드 상태 설정
    setUploadingFiles(prev => ({ ...prev, [type]: true }));

    try {
      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const storedFilename = `${timestamp}_${file.name}`;
      const filePath = `missionaries/${missionaryId || 'temp'}/${type}/${storedFilename}`;

      console.log('파일 업로드 시작:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: filePath,
        missionaryId: missionaryId || 'temp'
      });

      // Supabase Storage에 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('missionary-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('File upload error:', uploadError);
        
        // 구체적인 오류 메시지 제공
        if (uploadError.message.includes('Bucket not found')) {
          alert('파일 저장소가 설정되지 않았습니다. 관리자에게 문의하세요.');
        } else if (uploadError.message.includes('File too large')) {
          alert('파일이 너무 큽니다. 파일 크기를 줄여주세요.');
        } else if (uploadError.message.includes('Invalid file type')) {
          alert('지원되지 않는 파일 형식입니다.');
        } else {
          alert(`파일 업로드 중 오류가 발생했습니다: ${uploadError.message}`);
        }
        return;
      }

      console.log('파일 업로드 성공 missionary-files :', uploadData);

      // 업로드된 파일명을 상태에 저장
      setUploadedFiles(prev => ({ ...prev, [type]: file.name }));
      
      console.log('missionaryId :', missionaryId);
      
      // 파일 정보를 데이터베이스에 저장 (새 등록 시에는 나중에 저장)
      if (missionaryId && missionaryId !== 'temp') {
        console.log('데이터베이스에 파일 정보 저장:', {
          missionary_id: missionaryId,
          file_type: type,
          original_filename: file.name,
          stored_filename: storedFilename,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        });
        
        const { error: dbError } = await supabase
          .from('ncm_file_uploads')
          .insert([{
            missionary_id: missionaryId,
            file_type: type,
            original_filename: file.name,
            stored_filename: storedFilename,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
          alert('파일 정보 저장 중 오류가 발생했습니다.');
        } else {
          alert(`${type} 파일이 성공적으로 업로드되었습니다.`);
        }
      } else {
        // 새 등록 시에는 파일만 업로드하고 데이터베이스 저장은 나중에
        alert(`${type} 파일이 임시 저장되었습니다. 사역자 등록 완료 시 함께 저장됩니다.`);
      }

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('파일 업로드 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      // 업로드 상태 해제
      setUploadingFiles(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleFileDelete = (type: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[type];
      return newFiles;
    });
    alert(`${type} 파일이 삭제되었습니다.`);
  };

  const handleSubmit = async () => {
    try {
      // 1. 사역자 기본정보 필수 입력 검증
      const basicRequiredFields = [
        { value: missionaryInfo.missionaryId, name: '사역자 ID' },
        { value: missionaryInfo.koreanName, name: '한글명' },
        { value: missionaryInfo.englishName, name: '영문명' },
        { value: missionaryInfo.missionName, name: '사역명' },
        { value: missionaryInfo.maritalStatus, name: '결혼여부' },
        { value: missionaryInfo.residentNumber1, name: '주민등록번호 앞자리' },
        { value: missionaryInfo.residentNumber2, name: '주민등록번호 뒷자리' },
        { value: missionaryInfo.birthDate, name: '생년월일' },
        { value: missionaryInfo.passportNumber, name: '여권번호' },
        { value: missionaryInfo.admissionDate, name: '허입일자' },
        { value: missionaryInfo.dispatchDate, name: '파송일자' },
        { value: missionaryInfo.trainingInstitution, name: '훈련기관' },
        { value: missionaryInfo.trainingBatch, name: '훈련기수' },
        { value: missionaryInfo.trainingStartDate, name: '훈련 시작일' },
        { value: missionaryInfo.trainingEndDate, name: '훈련 종료일' },
        { value: missionaryInfo.address, name: '주소' }
      ];

      const missingBasicFields = basicRequiredFields.filter(field => !field.value);
      if (missingBasicFields.length > 0) {
        alert(`사역자 기본정보에서 다음 필수 항목을 입력해주세요:\n${missingBasicFields.map(f => f.name).join(', ')}`);
        return;
      }

      // 2. 배우자 정보 필수 입력 검증 (결혼여부가 미혼이 아닌 경우)
      if (missionaryInfo.maritalStatus !== '미혼') {
        const spouseRequiredFields = [
          { value: spouseInfo.koreanName, name: '배우자 한글명' },
          { value: spouseInfo.englishName, name: '배우자 영문명' },
          { value: spouseInfo.missionName, name: '배우자 사역명' },
          { value: spouseInfo.birthDate, name: '배우자 생년월일' },
          { value: spouseInfo.passportNumber, name: '배우자 여권번호' },
          { value: spouseInfo.admissionDate, name: '배우자 허입일자' },
          { value: spouseInfo.dispatchDate, name: '배우자 파송일자' },
          { value: spouseInfo.trainingInstitution, name: '배우자 훈련기관' },
          { value: spouseInfo.trainingBatch, name: '배우자 훈련기수' },
          { value: spouseInfo.trainingStartDate, name: '배우자 훈련 시작일' },
          { value: spouseInfo.trainingEndDate, name: '배우자 훈련 종료일' }
        ];

        const missingSpouseFields = spouseRequiredFields.filter(field => !field.value);
        if (missingSpouseFields.length > 0) {
          alert(`배우자 정보에서 다음 필수 항목을 입력해주세요:\n${missingSpouseFields.map(f => f.name).join(', ')}`);
          return;
        }
      }

      // 3. 추가 정보 필수 입력 검증
      const additionalRequiredFields = [
        { value: additionalInfo.localAddress, name: '현지주소' },
        { value: additionalInfo.mobilePhone, name: '핸드폰' },
        { value: additionalInfo.email1, name: 'E-mail1' },
        { value: additionalInfo.domesticFamilyAddress, name: '국내가족주소' }
      ];

      const missingAdditionalFields = additionalRequiredFields.filter(field => !field.value);
      if (missingAdditionalFields.length > 0) {
        alert(`추가 정보에서 다음 필수 항목을 입력해주세요:\n${missingAdditionalFields.map(f => f.name).join(', ')}`);
        return;
      }

      // 4. 정기우편물 필수 입력 검증
      if (additionalInfo.regularMail.length === 0) {
        alert('정기우편물을 최소 하나 이상 선택해주세요.');
        return;
      }

      // 5. 개인정보 동의 검증
      if (!consentToPrivacy) {
        alert('개인정보 제공에 동의해주세요.');
        return;
      }

      if (isEditMode) {
        // 편집 모드: 업데이트
        await handleUpdate();
      } else {
        // 새 등록 모드: 삽입
        await handleInsert();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleInsert = async () => {
    try {
      // 1. 사역자 기본 정보 저장
      const { data: missionaryData, error: missionaryError } = await supabase
      .from('ncm_m10001')
      .insert([{
          missionary_id: missionaryInfo.missionaryId,
          korean_name: missionaryInfo.koreanName,
          english_name: missionaryInfo.englishName,
          mission_name: missionaryInfo.missionName,
          gender: missionaryInfo.gender,
          marital_status: missionaryInfo.maritalStatus,
          resident_number1: missionaryInfo.residentNumber1,
          resident_number2: missionaryInfo.residentNumber2,
          birth_date: missionaryInfo.birthDate || null,
          passport_number: missionaryInfo.passportNumber,
          admission_date: missionaryInfo.admissionDate,
          dispatch_date: missionaryInfo.dispatchDate || null,
          end_date: missionaryInfo.endDate || null,
          training_institution: missionaryInfo.trainingInstitution,
          training_batch: missionaryInfo.trainingBatch,
          training_start_date: missionaryInfo.trainingStartDate || null,
          training_end_date: missionaryInfo.trainingEndDate || null,
          address: missionaryInfo.address
        }])
        .select()
        .single();

      if (missionaryError) {
        console.error('Error saving missionary info:', missionaryError);
        alert('사역자 정보 저장 중 오류가 발생했습니다: ' + missionaryError.message);
        return;
      }

      const missionaryId = missionaryData.id;

      // 2. 배우자 정보 저장 (배우자 정보가 있는 경우만)
      if (spouseInfo.koreanName || spouseInfo.englishName) {
        const { error: spouseError } = await supabase
          .from('ncm_m10101')
          .insert([{
            missionary_id: missionaryId,
            korean_name: spouseInfo.koreanName,
            english_name: spouseInfo.englishName,
            mission_name: spouseInfo.missionName,
            gender: spouseInfo.gender,
            birth_date: spouseInfo.birthDate || null,
            passport_number: spouseInfo.passportNumber,
            admission_date: spouseInfo.admissionDate || null,
            dispatch_date: spouseInfo.dispatchDate || null,
            training_institution: spouseInfo.trainingInstitution,
            training_batch: spouseInfo.trainingBatch,
            training_start_date: spouseInfo.trainingStartDate || null,
            training_end_date: spouseInfo.trainingEndDate || null,
            address: spouseInfo.address
          }]);

        if (spouseError) {
          console.error('Error saving spouse info:', spouseError);
          alert('배우자 정보 저장 중 오류가 발생했습니다.');
        }
      }

      // 3. 연락처 정보 저장
      const { error: contactError } = await supabase
        .from('ncm_m10002')
        .insert([{
          missionary_id: missionaryId,
          local_address: additionalInfo.localAddress,
          phone1: additionalInfo.phone1,
          phone2: additionalInfo.phone2,
          fax_number: additionalInfo.faxNumber,
          mobile_phone: additionalInfo.mobilePhone,
          email1: additionalInfo.email1,
          email2: additionalInfo.email2,
          homepage_url: additionalInfo.homepageUrl,
          family_contact: additionalInfo.familyContact,
          domestic_family_address: additionalInfo.domesticFamilyAddress,
          virtual_account: additionalInfo.virtualAccount,
          travel_insurance_status: additionalInfo.travelInsuranceStatus,
          national_pension_status: additionalInfo.nationalPensionStatus,
          regular_mail: additionalInfo.regularMail,
          publication_name: additionalInfo.publicationName
        }]);

      if (contactError) {
        console.error('Error saving contact info:', contactError);
        alert('연락처 정보 저장 중 오류가 발생했습니다.');
      }

      // 4. 개인정보 동의 저장
      const { error: consentError } = await supabase
        .from('ncm_m10003')
        .insert([{
          missionary_id: missionaryId,
          consent_given: consentToPrivacy,
          consent_date: new Date().toISOString(),
          ip_address: null, // 클라이언트에서는 IP 주소를 직접 가져올 수 없음
          user_agent: navigator.userAgent
        }]);

      if (consentError) {
        console.error('Error saving consent info:', consentError);
        alert('개인정보 동의 저장 중 오류가 발생했습니다.');
      }

      // 임시 저장된 파일들을 실제 사역자 ID로 업데이트
      const tempFiles = Object.keys(uploadedFiles);
      if (tempFiles.length > 0) {
        console.log('임시 파일들을 실제 사역자 ID로 업데이트:', tempFiles);
        
        for (const fileType of tempFiles) {
          // 임시 파일 경로에서 실제 사역자 ID로 변경
          const tempPath = `missionaries/temp/${fileType}`;
          const newPath = `missionaries/${missionaryId}/${fileType}`;
          
          // Storage에서 파일 이동 (복사 후 삭제)
          const { data: files } = await supabase.storage
            .from('missionary-files')
            .list(`missionaries/temp/${fileType}`);
          
          if (files && files.length > 0) {
            for (const file of files) {
              const oldFilePath = `${tempPath}/${file.name}`;
              const newFilePath = `${newPath}/${file.name}`;
              
              // 파일 다운로드
              const { data: fileData } = await supabase.storage
                .from('missionary-files')
                .download(oldFilePath);
              
              if (fileData) {
                // 새 위치에 업로드
                await supabase.storage
                  .from('missionary-files')
                  .upload(newFilePath, fileData);
                
                // 임시 파일 삭제
                await supabase.storage
                  .from('missionary-files')
                  .remove([oldFilePath]);
                
                // 데이터베이스에 파일 정보 저장
                await supabase
                  .from('ncm_file_uploads')
                  .insert([{
                    missionary_id: missionaryId,
                    file_type: fileType,
                    original_filename: uploadedFiles[fileType],
                    stored_filename: file.name,
                    file_path: newFilePath,
                    file_size: fileData.size,
                    mime_type: fileData.type
                  }]);
              }
            }
          }
        }
      }

      alert('사역자 정보가 성공적으로 저장되었습니다.');
      
      // 폼 초기화
      handleReset();
      
    } catch (error) {
      console.error('Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleUpdate = async () => {
    try {
      // 기존 사역자 ID로 기본 정보 조회
      const { data: existingData, error: fetchError } = await supabase
        .from('ncm_m10001')
        .select('id')
        .eq('missionary_id', missionaryInfo.missionaryId)
        .single();

      if (fetchError || !existingData) {
        alert('기존 사역자 정보를 찾을 수 없습니다.');
        return;
      }

      const missionaryId = existingData.id;

      // 1. 사역자 기본 정보 업데이트
      const { error: missionaryError } = await supabase
        .from('ncm_m10001')
        .update({
          missionary_id: missionaryInfo.missionaryId,
          korean_name: missionaryInfo.koreanName,
          english_name: missionaryInfo.englishName,
          mission_name: missionaryInfo.missionName,
          gender: missionaryInfo.gender,
          marital_status: missionaryInfo.maritalStatus,
          resident_number1: missionaryInfo.residentNumber1,
          resident_number2: missionaryInfo.residentNumber2,
          birth_date: missionaryInfo.birthDate || null,
          passport_number: missionaryInfo.passportNumber,
          admission_date: missionaryInfo.admissionDate,
          dispatch_date: missionaryInfo.dispatchDate || null,
          end_date: missionaryInfo.endDate || null,
          training_institution: missionaryInfo.trainingInstitution,
          training_batch: missionaryInfo.trainingBatch,
          training_start_date: missionaryInfo.trainingStartDate || null,
          training_end_date: missionaryInfo.trainingEndDate || null,
          address: missionaryInfo.address
        })
        .eq('id', missionaryId);

      if (missionaryError) {
        console.error('Error updating missionary info:', missionaryError);
        alert('사역자 정보 업데이트 중 오류가 발생했습니다.');
        return;
      }

      // 2. 배우자 정보 업데이트 또는 삽입
      if (spouseInfo.koreanName || spouseInfo.englishName) {
        const { data: existingSpouse } = await supabase
          .from('ncm_m10101')
          .select('id')
          .eq('missionary_id', missionaryId)
          .single();

        const spouseData = {
          missionary_id: missionaryId,
          korean_name: spouseInfo.koreanName,
          english_name: spouseInfo.englishName,
          mission_name: spouseInfo.missionName,
          gender: spouseInfo.gender,
          birth_date: spouseInfo.birthDate || null,
          passport_number: spouseInfo.passportNumber,
          admission_date: spouseInfo.admissionDate || null,
          dispatch_date: spouseInfo.dispatchDate || null,
          training_institution: spouseInfo.trainingInstitution,
          training_batch: spouseInfo.trainingBatch,
          training_start_date: spouseInfo.trainingStartDate || null,
          training_end_date: spouseInfo.trainingEndDate || null,
          address: spouseInfo.address
        };

        if (existingSpouse) {
          // 업데이트
          await supabase
            .from('ncm_m10101')
            .update(spouseData)
            .eq('id', existingSpouse.id);
        } else {
          // 삽입
          await supabase
            .from('ncm_m10101')
            .insert([spouseData]);
        }
      }

      // 3. 연락처 정보 업데이트 또는 삽입
      const { data: existingContact } = await supabase
        .from('ncm_m10002')
        .select('id')
        .eq('missionary_id', missionaryId)
        .single();

      const contactData = {
        missionary_id: missionaryId,
        local_address: additionalInfo.localAddress,
        phone1: additionalInfo.phone1,
        phone2: additionalInfo.phone2,
        fax_number: additionalInfo.faxNumber,
        mobile_phone: additionalInfo.mobilePhone,
        email1: additionalInfo.email1,
        email2: additionalInfo.email2,
        homepage_url: additionalInfo.homepageUrl,
        family_contact: additionalInfo.familyContact,
        domestic_family_address: additionalInfo.domesticFamilyAddress,
        virtual_account: additionalInfo.virtualAccount,
        travel_insurance_status: additionalInfo.travelInsuranceStatus,
        national_pension_status: additionalInfo.nationalPensionStatus,
        regular_mail: additionalInfo.regularMail,
        publication_name: additionalInfo.publicationName
      };

      if (existingContact) {
        // 업데이트
        await supabase
          .from('ncm_m10002')
          .update(contactData)
          .eq('id', existingContact.id);
      } else {
        // 삽입
        await supabase
          .from('ncm_m10002')
          .insert([contactData]);
      }

      // 4. 개인정보 동의 업데이트
      const { data: existingConsent } = await supabase
        .from('ncm_m10003')
        .select('id')
        .eq('missionary_id', missionaryId)
        .single();

      const consentData = {
        missionary_id: missionaryId,
        consent_given: consentToPrivacy,
        consent_date: new Date().toISOString(),
        ip_address: null,
        user_agent: navigator.userAgent
      };

      if (existingConsent) {
        // 업데이트
        await supabase
          .from('ncm_m10003')
          .update(consentData)
          .eq('id', existingConsent.id);
      } else {
        // 삽입
        await supabase
          .from('ncm_m10003')
          .insert([consentData]);
      }

      alert('사역자 정보가 성공적으로 업데이트되었습니다.');
      
    } catch (error) {
      console.error('Error:', error);
      alert('업데이트 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setMissionaryInfo({
      missionaryId: '',
      koreanName: '',
      englishName: '',
      missionName: '',
      gender: 'male',
      maritalStatus: '',
      residentNumber1: '',
      residentNumber2: '',
      birthDate: '',
      passportNumber: '',
      admissionDate: '',
      dispatchDate: '',
      endDate: '',
      trainingInstitution: '',
      trainingBatch: '',
      trainingStartDate: '',
      trainingEndDate: '',
      address: ''
    });
    setSpouseInfo({
      koreanName: '',
      englishName: '',
      missionName: '',
      gender: 'female',
      birthDate: '',
      passportNumber: '',
      admissionDate: '',
      dispatchDate: '',
      trainingInstitution: '',
      trainingBatch: '',
      trainingStartDate: '',
      trainingEndDate: '',
      address: ''
    });
    setAdditionalInfo({
      localAddress: '',
      phone1: '',
      phone2: '',
      faxNumber: '',
      mobilePhone: '',
      email1: '',
      email2: '',
      homepageUrl: '',
      familyContact: '',
      domesticFamilyAddress: '',
      virtualAccount: '',
      travelInsuranceStatus: '',
      nationalPensionStatus: '',
      regularMail: [],
      publicationName: ''
    });
    setUploadedFiles({}); // Reset uploaded files
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">사역자 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditMode ? '사역자정보수정' : '사역자등록정보'}
          </h1>
          {isEditMode && (
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-300 font-medium"
            >
              목록으로 돌아가기
            </button>
          )}
        </div>
      
      <form className="space-y-8">
        {/* 사역자 기본 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">1. 사역자 기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">사역자 ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={missionaryInfo.missionaryId}
                onChange={(e) => handleMissionaryInfoChange('missionaryId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">한글명 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={missionaryInfo.koreanName}
                onChange={(e) => handleMissionaryInfoChange('koreanName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">영문명 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={missionaryInfo.englishName}
                onChange={(e) => handleMissionaryInfoChange('englishName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div className="col-span-full md:col-span-2">
              <label className="block text-sm font-medium mb-1">주민등록번호 <span className="text-red-500">*</span></label>
              <div className="flex space-x-2 justify-center md:justify-start">
                <input
                  type="text"
                  value={missionaryInfo.residentNumber1}
                  onChange={(e) => handleMissionaryInfoChange('residentNumber1', e.target.value)}
                  className="w-37 md:flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center md:text-left"
                  placeholder="앞자리"
                  maxLength={6}
                />
                <span className="self-center">-</span>
                <input
                  type="text"
                  value={missionaryInfo.residentNumber2}
                  onChange={(e) => handleMissionaryInfoChange('residentNumber2', e.target.value)}
                  className="w-37 md:flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center md:text-left"
                  placeholder="뒷자리"
                  maxLength={7}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">성별</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={missionaryInfo.gender === 'male'}
                    onChange={(e) => handleMissionaryInfoChange('gender', e.target.value)}
                    className="mr-2"
                  />
                  남
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={missionaryInfo.gender === 'female'}
                    onChange={(e) => handleMissionaryInfoChange('gender', e.target.value)}
                    className="mr-2"
                  />
                  여
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">결혼여부 <span className="text-red-500">*</span></label>
              <select
                value={missionaryInfo.maritalStatus}
                onChange={(e) => handleMissionaryInfoChange('maritalStatus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="가정">가정</option>
                <option value="미혼">미혼</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">생년월일</label>
              <input
                type="date"
                value={missionaryInfo.birthDate}
                onChange={(e) => handleMissionaryInfoChange('birthDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">여권번호</label>
              <input
                type="text"
                value={missionaryInfo.passportNumber}
                onChange={(e) => handleMissionaryInfoChange('passportNumber', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">허입일자*</label>
              <input
                type="date"
                value={missionaryInfo.admissionDate}
                onChange={(e) => handleMissionaryInfoChange('admissionDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">파송일자</label>
              <input
                type="date"
                value={missionaryInfo.dispatchDate}
                onChange={(e) => handleMissionaryInfoChange('dispatchDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">종료일자</label>
              <input
                type="date"
                value={missionaryInfo.endDate}
                onChange={(e) => handleMissionaryInfoChange('endDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
             <div className="md:col-span-3">
               <label className="block text-sm font-medium mb-1">사역명 <span className="text-red-500">*</span></label>
               <input
                 type="text"
                 value={missionaryInfo.missionName}
                 onChange={(e) => handleMissionaryInfoChange('missionName', e.target.value)}
                 className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 required
               />
             </div>
            <div>
              <label className="block text-sm font-medium mb-1">훈련기관</label>
              <input
                type="text"
                value={missionaryInfo.trainingInstitution}
                onChange={(e) => handleMissionaryInfoChange('trainingInstitution', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">훈련기수</label>
              <input
                type="text"
                value={missionaryInfo.trainingBatch}
                onChange={(e) => handleMissionaryInfoChange('trainingBatch', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">훈련일자</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={missionaryInfo.trainingStartDate}
                  onChange={(e) => handleMissionaryInfoChange('trainingStartDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="self-center">~</span>
                <input
                  type="date"
                  value={missionaryInfo.trainingEndDate}
                  onChange={(e) => handleMissionaryInfoChange('trainingEndDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">주소</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={missionaryInfo.address}
                  onChange={(e) => handleMissionaryInfoChange('address', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="주소를 입력하세요"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  우편번호
                </button>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">사진파일</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload('photo', e.target.files[0])}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer ${
                    uploadingFiles.photo 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {uploadingFiles.photo ? '업로드 중...' : '파일 선택'}
                </label>
                <span className={`text-sm ${uploadedFiles.photo ? 'text-green-600' : 'text-gray-500'}`}>
                  {uploadedFiles.photo ? uploadedFiles.photo : '선택한 파일 없음'}
                </span>
                {uploadedFiles.photo && (
                  <button
                    type="button"
                    onClick={() => handleFileDelete('photo')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    파일삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 사역자 배우자 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-600">
            2. 사역자 배우자 정보
            {missionaryInfo.maritalStatus !== '미혼' && (
              <span className="text-sm text-red-500 ml-2">(결혼 상태로 모든 항목 필수)</span>
            )}
          </h2>
          <div className="mb-4">
            <button
              type="button"
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={() => {
                setSpouseInfo({
                  ...spouseInfo,
                  koreanName: missionaryInfo.koreanName,
                  englishName: missionaryInfo.englishName,
                  missionName: missionaryInfo.missionName,
                  trainingInstitution: missionaryInfo.trainingInstitution,
                  trainingBatch: missionaryInfo.trainingBatch,
                  trainingStartDate: missionaryInfo.trainingStartDate,
                  trainingEndDate: missionaryInfo.trainingEndDate,
                  admissionDate: missionaryInfo.admissionDate,
                  dispatchDate: missionaryInfo.dispatchDate
                });
              }}
            >
              상동
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">한글명</label>
              <input
                type="text"
                value={spouseInfo.koreanName}
                onChange={(e) => handleSpouseInfoChange('koreanName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">영문명</label>
              <input
                type="text"
                value={spouseInfo.englishName}
                onChange={(e) => handleSpouseInfoChange('englishName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">사역명</label>
              <input
                type="text"
                value={spouseInfo.missionName}
                onChange={(e) => handleSpouseInfoChange('missionName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">성별</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="spouseGender"
                    value="male"
                    checked={spouseInfo.gender === 'male'}
                    onChange={(e) => handleSpouseInfoChange('gender', e.target.value)}
                    className="mr-2"
                  />
                  남
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="spouseGender"
                    value="female"
                    checked={spouseInfo.gender === 'female'}
                    onChange={(e) => handleSpouseInfoChange('gender', e.target.value)}
                    className="mr-2"
                  />
                  여
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">생년월일</label>
              <input
                type="date"
                value={spouseInfo.birthDate}
                onChange={(e) => handleSpouseInfoChange('birthDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">여권번호</label>
              <input
                type="text"
                value={spouseInfo.passportNumber}
                onChange={(e) => handleSpouseInfoChange('passportNumber', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">허입일자</label>
              <input
                type="date"
                value={spouseInfo.admissionDate}
                onChange={(e) => handleSpouseInfoChange('admissionDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">파송일자</label>
              <input
                type="date"
                value={spouseInfo.dispatchDate}
                onChange={(e) => handleSpouseInfoChange('dispatchDate', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">훈련기관</label>
              <input
                type="text"
                value={spouseInfo.trainingInstitution}
                onChange={(e) => handleSpouseInfoChange('trainingInstitution', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">훈련기수</label>
              <input
                type="text"
                value={spouseInfo.trainingBatch}
                onChange={(e) => handleSpouseInfoChange('trainingBatch', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">훈련일자</label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={spouseInfo.trainingStartDate}
                  onChange={(e) => handleSpouseInfoChange('trainingStartDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <span className="self-center">~</span>
                <input
                  type="date"
                  value={spouseInfo.trainingEndDate}
                  onChange={(e) => handleSpouseInfoChange('trainingEndDate', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">주소</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={spouseInfo.address}
                  onChange={(e) => handleSpouseInfoChange('address', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="주소를 입력하세요"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  우편번호
                </button>
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">사진파일</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload('spousePhoto', e.target.files[0])}
                  className="hidden"
                  id="spouse-photo-upload"
                />
                <label
                  htmlFor="spouse-photo-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer ${
                    uploadingFiles.spousePhoto 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white`}
                >
                  {uploadingFiles.spousePhoto ? '업로드 중...' : '파일 선택'}
                </label>
                <span className={`text-sm ${uploadedFiles.spousePhoto ? 'text-green-600' : 'text-gray-500'}`}>
                  {uploadedFiles.spousePhoto ? uploadedFiles.spousePhoto : '선택한 파일 없음'}
                </span>
                {uploadedFiles.spousePhoto && (
                  <button
                    type="button"
                    onClick={() => handleFileDelete('spousePhoto')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    파일삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 사역자 추가 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">3. 사역자 추가 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">현지주소 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={additionalInfo.localAddress}
                onChange={(e) => handleAdditionalInfoChange('localAddress', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">전화번호1</label>
              <input
                type="tel"
                value={additionalInfo.phone1}
                onChange={(e) => handleAdditionalInfoChange('phone1', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">전화번호2</label>
              <input
                type="tel"
                value={additionalInfo.phone2}
                onChange={(e) => handleAdditionalInfoChange('phone2', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">팩스번호</label>
              <input
                type="tel"
                value={additionalInfo.faxNumber}
                onChange={(e) => handleAdditionalInfoChange('faxNumber', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">핸드폰 <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={additionalInfo.mobilePhone}
                onChange={(e) => handleAdditionalInfoChange('mobilePhone', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail1 <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={additionalInfo.email1}
                onChange={(e) => handleAdditionalInfoChange('email1', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail2</label>
              <input
                type="email"
                value={additionalInfo.email2}
                onChange={(e) => handleAdditionalInfoChange('email2', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">홈페이지URL</label>
              <input
                type="url"
                value={additionalInfo.homepageUrl}
                onChange={(e) => handleAdditionalInfoChange('homepageUrl', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">가족연락처</label>
              <input
                type="tel"
                value={additionalInfo.familyContact}
                onChange={(e) => handleAdditionalInfoChange('familyContact', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">국내가족주소 <span className="text-red-500">*</span></label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={additionalInfo.domesticFamilyAddress}
                  onChange={(e) => handleAdditionalInfoChange('domesticFamilyAddress', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="주소를 입력하세요"
                />
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  우편번호
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">가상계좌</label>
              <input
                type="text"
                value={additionalInfo.virtualAccount}
                onChange={(e) => handleAdditionalInfoChange('virtualAccount', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">여행자보험가입여부</label>
              <select
                value={additionalInfo.travelInsuranceStatus}
                onChange={(e) => handleAdditionalInfoChange('travelInsuranceStatus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="전가족">전가족</option>
                <option value="본인만">본인만</option>
                <option value="미가입">미가입</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">국민연금가입여부</label>
              <select
                value={additionalInfo.nationalPensionStatus}
                onChange={(e) => handleAdditionalInfoChange('nationalPensionStatus', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="-------">-------</option>
                <option value="가입">가입</option>
                <option value="미가입">미가입</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">정기우편물 <span className="text-red-500">*</span></label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={additionalInfo.regularMail.includes('GMP')}
                    onChange={(e) => {
                      const newMail = e.target.checked
                        ? [...additionalInfo.regularMail, 'GMP']
                        : additionalInfo.regularMail.filter(mail => mail !== 'GMP');
                      handleAdditionalInfoChange('regularMail', newMail);
                    }}
                    className="mr-2"
                  />
                  GMP
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={additionalInfo.regularMail.includes('기도편지')}
                    onChange={(e) => {
                      const newMail = e.target.checked
                        ? [...additionalInfo.regularMail, '기도편지']
                        : additionalInfo.regularMail.filter(mail => mail !== '기도편지');
                      handleAdditionalInfoChange('regularMail', newMail);
                    }}
                    className="mr-2"
                  />
                  기도편지
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={additionalInfo.regularMail.includes('기타')}
                    onChange={(e) => {
                      const newMail = e.target.checked
                        ? [...additionalInfo.regularMail, '기타']
                        : additionalInfo.regularMail.filter(mail => mail !== '기타');
                      handleAdditionalInfoChange('regularMail', newMail);
                    }}
                    className="mr-2"
                  />
                  기타
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">신청간행물명</label>
              <input
                type="text"
                value={additionalInfo.publicationName}
                onChange={(e) => handleAdditionalInfoChange('publicationName', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">사역자첨부파일</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  onChange={(e) => e.target.files && handleFileUpload('attached', e.target.files[0])}
                  className="hidden"
                  id="attached-file-upload"
                />
                <label
                  htmlFor="attached-file-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer ${
                    uploadingFiles.attached 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  {uploadingFiles.attached ? '업로드 중...' : '파일 선택'}
                </label>
                <span className={`text-sm ${uploadedFiles.attached ? 'text-green-600' : 'text-gray-500'}`}>
                  {uploadedFiles.attached ? uploadedFiles.attached : '선택한 파일 없음'}
                </span>
                {uploadedFiles.attached && (
                  <button
                    type="button"
                    onClick={() => handleFileDelete('attached')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    파일삭제
                  </button>
                )}
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-1">가족사진파일</label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFileUpload('familyPhoto', e.target.files[0])}
                  className="hidden"
                  id="family-photo-upload"
                />
                <label
                  htmlFor="family-photo-upload"
                  className={`px-4 py-2 rounded-md cursor-pointer ${
                    uploadingFiles.familyPhoto 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  {uploadingFiles.familyPhoto ? '업로드 중...' : '파일 선택'}
                </label>
                <span className={`text-sm ${uploadedFiles.familyPhoto ? 'text-green-600' : 'text-gray-500'}`}>
                  {uploadedFiles.familyPhoto ? uploadedFiles.familyPhoto : '선택한 파일 없음'}
                </span>
                {uploadedFiles.familyPhoto && (
                  <button
                    type="button"
                    onClick={() => handleFileDelete('familyPhoto')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                  >
                    파일삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보제공동의 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">4. 개인정보제공동의</h2>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="consent"
              checked={consentToPrivacy}
              onChange={(e) => setConsentToPrivacy(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="consent" className="text-sm font-medium">
              개인정보 제공에 동의합니다.
            </label>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-center space-x-4 pt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium"
          >
            {isEditMode ? '수정' : '등록'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium"
          >
            새로작성
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
