'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatDate, formatDateForDB } from '../utils/dateUtils';

interface RoomDetail {
  room_no: string;
  status_cd: string;
  user_nm: string;
  guest_num: number;
  check_in_ymd: string;
  check_out_ymd: string;
  kmc_cd: string;
  use_yn: string;
  org_cd: string;
  bipum_chk_yn: string;
  clear_chk_yn: string;
  insp_chk_yn: string;
}

// RoomDetailContent 컴포넌트로 분리
function RoomDetailContent() {
  const searchParams = useSearchParams();
  const roomNo = searchParams.get('roomNo');
  
  const [roomDetail, setRoomDetail] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checkboxStates, setCheckboxStates] = useState({
    bipum_chk_yn: 'N',
    clear_chk_yn: 'N',
    insp_chk_yn: 'N'
  });
  const { isAuthenticated, loading: authLoading } = useAuth();

  // 화면 크기 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 초기 체크
    checkIfMobile();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkIfMobile);
    
    // 클린업
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // 인증되지 않은 경우 로그인 페이지로 리디렉션
      window.location.href = '/login';
      return;
    }
    
    if (isAuthenticated && roomNo) {
      fetchRoomDetail(roomNo);
    }
  }, [roomNo, isAuthenticated, authLoading]);

  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (field: 'bipum_chk_yn' | 'clear_chk_yn' | 'insp_chk_yn') => {
    setCheckboxStates(prev => {
      const newStates = { ...prev };
      
      if (field === 'insp_chk_yn') {
        // 점검완료 체크 시 청소완료와 셋팅완료도 자동 체크
        if (prev[field] === 'N') {
          newStates.insp_chk_yn = 'Y';
          newStates.clear_chk_yn = 'Y';
          newStates.bipum_chk_yn = 'Y';
        } else {
          newStates.insp_chk_yn = 'N';
        }
      } else if (field === 'bipum_chk_yn') {
        // 점검완료 체크 시 청소완료와 셋팅완료도 자동 체크
        if (prev[field] === 'N') {          
          newStates.clear_chk_yn = 'Y';
          newStates.bipum_chk_yn = 'Y';
        } else {
          newStates.bipum_chk_yn = 'N';
        }
      }else {
        // 다른 체크박스는 토글
        newStates[field] = prev[field] === 'Y' ? 'N' : 'Y';
      }
      
      return newStates;
    });
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    if (!roomNo) return;
    
    try {
      setSaving(true);
      setError('');
      
      // 상태 코드 결정
      let statusCd = 'N'; // 기본값
      if (checkboxStates.insp_chk_yn === 'Y') {
        statusCd = 'G'; // 점검완료
      } else if (checkboxStates.bipum_chk_yn === 'Y' && checkboxStates.clear_chk_yn === 'Y') {
        statusCd = 'T'; // 셋팅완료
      } else if (checkboxStates.clear_chk_yn === 'Y') {
        statusCd = 'C'; // 청소완료
      }
      
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        setError('사용자 정보를 가져오는 중 오류가 발생했습니다.');
        return;
      }
      
      // 현재 날짜 (YYYY-MM-DD 형식)
      const today = formatDateForDB(new Date()); 
      
      console.log('체크박스 상태:', checkboxStates);
      console.log('방 번호:', roomNo);
      console.log('상태 코드:', statusCd);
      console.log('업데이트 사용자:', user?.email);
      console.log('업데이트 날짜:', today);
      
      const { error } = await supabase
        .from('kmc_rooms')
        .update({
          bipum_chk_yn: checkboxStates.bipum_chk_yn,
          clear_chk_yn: checkboxStates.clear_chk_yn,
          insp_chk_yn: checkboxStates.insp_chk_yn,
          status_cd: statusCd,
          upd_eeno: user?.email || '',
          upd_date: today
        })
        .eq('room_no', roomNo);
      
      if (error) {
        console.error('Error updating room status:', error);
        setError('방 상태 업데이트 중 오류가 발생했습니다.');
        return;
      }
      
      // 성공 메시지 표시
      alert('방 상태가 성공적으로 저장되었습니다.');
      
    } catch (err) {
      console.error('Exception:', err);
      setError('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const fetchRoomDetail = async (roomNo: string) => {
    try {
      setLoading(true);
      setError('');
      
      const { data, error } = await supabase
        .from('kmc_rooms')
        .select('room_no, use_yn,org_cd, bipum_chk_yn, clear_chk_yn, insp_chk_yn, status_cd')
        .eq('room_no', roomNo)
        .single();
      
      if (error) {
        console.error('Error fetching room detail:', error);
        setError('방 정보를 가져오는 중 오류가 발생했습니다.');
        return;
      }
      
      if (!data) {
        setError('해당 방 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 체크박스 상태 초기화
      setCheckboxStates({
        bipum_chk_yn: data.bipum_chk_yn || 'N',
        clear_chk_yn: data.clear_chk_yn || 'N',
        insp_chk_yn: data.insp_chk_yn || 'N'
      });
      
      // 사용자 정보 가져오기
      const { data: userData, error: userError } = await supabase
        .from('kmc_info')
        .select('seq_no, user_nm, guest_num, check_in_ymd, check_out_ymd, kmc_cd')        
        .like('room_no', '%' + roomNo + '%')
        .lte('check_in_ymd', formatDateForDB(new Date()))
        .gte('check_out_ymd', formatDateForDB(new Date()))
        .in('status_cd', ['I', 'S'])
        .single();
      
        console.log(formatDateForDB(new Date()));
        console.log(roomNo);
      if (userError) {
        console.error('Error fetching user data:', userError);
        // 사용자 정보가 없어도 방 정보는 표시
        setRoomDetail({
          ...data,          
          user_nm: '정보 없음',
          guest_num: 0,
          check_in_ymd: '',
          check_out_ymd: '',
          kmc_cd: ''
        });
      } else {
        setRoomDetail({
          ...data,
          ...userData
        });
      }

    } catch (err) {
      console.error('Exception:', err);
      setError('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    return `${year}-${month}-${day}`;
  };
  


  const getRoomStatusText = (statusCd: string) => {
    const statusMap: Record<string, string> = {
      'N': '청소중',
      'C': '청소완료',
      'T': '셋팅완료',
      'G': '점검완료'
    };
    return statusMap[statusCd] || statusCd;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1e3a8a] flex items-center justify-center">
        <div className="text-white text-xl">인증 확인 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 리디렉션 중이므로 아무것도 렌더링하지 않음
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1e3a8a] flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-screen">
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">방 상세 정보</h1>            
          </div>
          
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 text-sm sm:text-base">
              {error}
            </div>
          ) : roomDetail ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">기본 정보</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-gray-600 text-base sm:text-lg lg:text-xl">방 번호</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{roomDetail.room_no}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl">상태</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{getRoomStatusText(roomDetail.status_cd)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl">사용여부</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{roomDetail.use_yn == 'Y' ? '사용' : '미사용'}</p>
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">방문자 정보</h2>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <p className="text-gray-600 text-base sm:text-lg lg:text-xl">방문자 이름</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{roomDetail.user_nm}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-base sm:text-lg lg:text-xl">인원수</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{roomDetail.guest_num}명</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl">체크인 날짜</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatDate(roomDetail.check_in_ymd)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl">체크아웃 날짜</p>
                        <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{formatDate(roomDetail.check_out_ymd)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">방관리 정보</h2>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="cleaning"
                      checked={checkboxStates.clear_chk_yn === 'Y'}
                      onChange={() => handleCheckboxChange('clear_chk_yn')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="cleaning" className="text-gray-700 text-lg">청소완료</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="setting"
                      checked={checkboxStates.bipum_chk_yn === 'Y'}
                      onChange={() => handleCheckboxChange('bipum_chk_yn')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="setting" className="text-gray-700 text-lg">셋팅완료</label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="inspection"
                      checked={checkboxStates.insp_chk_yn === 'Y'}
                      onChange={() => handleCheckboxChange('insp_chk_yn')}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="inspection" className="text-gray-700 text-lg">점검완료</label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center mt-6 sm:mt-8 space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg lg:text-xl font-bold transition-colors"
                >
                  돌아가기
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg lg:text-xl font-bold transition-colors disabled:bg-blue-300"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

// 로딩 상태를 표시하는 컴포넌트
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#1e3a8a] flex items-center justify-center">
      <div className="text-white text-2xl">로딩 중...</div>
    </div>
  );
}

// 메인 컴포넌트
export default function RoomDetailPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RoomDetailContent />
    </Suspense>
  );
} 