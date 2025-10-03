'use client';
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { formatDate, formatDateForDB, formatDateTime } from '../utils/dateUtils';

interface VisitorInfo {
  user_nm: string;
  guest_num: number;
  kmc_cd: string;
}

export default function MealCheckPage() {
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [manualInput, setManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState('');
  const [mealCount, setMealCount] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
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
    }
  }, [isAuthenticated, authLoading]);

  const handleButtonClick = (num: string) => {
    if (roomNumber.length < 3) {
      setRoomNumber(prev => prev + num);
    }
  };

  const handleClear = () => {
    setRoomNumber('');
    setVisitorInfo(null);
    setMealCount(0);
    setError('');
    setWarning('');
    setSuccess('');
  };

  const handleMealCountChange = (change: number) => {
    const newCount = mealCount + change;
    
    if (newCount < 0) {
      setMealCount(0);
      return;
    }
    
    // 최대 인원을 4명으로 제한
    if (newCount > 4) {
      setMealCount(4);
      setWarning('최대 인원은 4명으로 제한됩니다.');
      return;
    }
    
    if (visitorInfo && newCount > visitorInfo.guest_num) {
      setWarning(`경고: 전체 인원수(${visitorInfo.guest_num}명)보다 많은 식사 인원을 입력했습니다.`);
    } else {
      setWarning('');
    }
    
    setMealCount(newCount);
  };

  const handleCheck = async () => {
    if (roomNumber.length !== 3) {
      setError('방번호를 3자리로 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setWarning('');
      setSuccess('');

      const { data, error } = await supabase
        .from('kmc_info')
        .select('user_nm, guest_num, kmc_cd')
        .lte('check_in_ymd', selectedDate.replace(/-/g, ''))
        .gte('check_out_ymd', selectedDate.replace(/-/g, ''))
        .like('room_no', `%${roomNumber}%`)
        .in('status_cd', ['I','S'])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setManualInput(true);
          setManualName('');
        } else {
          setError('데이터를 가져오는 중 오류가 발생했습니다.');
          console.error('Error fetching data:', error);
        }
        setVisitorInfo(null);
        return;
      }

      // guest_num을 항상 4로 설정
      const modifiedData = {
        ...data,
        guest_num: 4
      };
      
      setVisitorInfo(modifiedData);
      setMealCount(0);
    } catch (err) {
      setError('오류가 발생했습니다.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualName.trim()) {
      alert('방문자 이름을 입력해주세요.');
      return;
    }

    if (mealCount <= 0) {
      alert('식사 인원을 입력해주세요.');
      return;
    }

    setVisitorInfo({
      user_nm: manualName,
      guest_num: 4,
      kmc_cd: 'K'
    });
    setManualInput(false);
  };

  const handleSubmit = async () => {
    if (!visitorInfo) {
      setError('방문자 정보가 없습니다.');
      return;
    }

    if (mealCount <= 0) {
      setError('식사 인원을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setWarning('');
      setSuccess('');

      // 현재 날짜와 시간 가져오기
      const now = new Date();
      const today = formatDateForDB(now);
      const currentDate = formatDateTime(now);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${String(currentHour).padStart(2, '0')}${String(currentMinute).padStart(2, '0')}`;
      
      // 시간에 따라 meal_cd 결정
      let mealCd = 'T'; // 기본값
      if (currentHour >= 4 && currentHour < 10) {
        mealCd = 'M'; // 아침 식사 (4시~10시)
      } else if (currentHour >= 10 && currentHour < 15) {
        mealCd = 'A'; // 점심 식사 (10시~15시)
      } else if (currentHour >= 15 && currentHour < 21) {
        mealCd = 'E'; // 저녁 식사 (15시~21시)
      } else {
        mealCd = 'T'; // 기타 시간
      }

      // 저장할 데이터 준비
      const mealData = {
        room_no: roomNumber,
        org: 'K',
        meal_ymd: today.replace(/-/g, ''),
        meal_time: currentTime,
        meal_cd: mealCd,
        eat_num: mealCount
      };

      console.log('저장할 데이터:', mealData);

      // 식사 정보 저장 - kmc_meal_mgmt 테이블에 저장
      const { data, error } = await supabase
        .from('kmc_meal_mgmt')
        .insert(mealData)
        .select();

      if (error) {
        console.error('Error details:', error);
        if (error.message.includes('Failed to fetch')) {
          setError('인터넷 연결이 끊어졌습니다. 연결을 확인하고 다시 시도해 주세요.');
        } else if (error.message.includes('PGRST116')) {
          setError('해당 방번호에 입실 중인 방문자가 없습니다.');
        } else if (error.message.includes('duplicate key value violates unique constraint "kmc_meal_mgmt_pkey"')) {
          setError('이미 식사 정보가 등록되었습니다.');
        } else {
          setError(`식사 정보 저장 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
        }
        return;
      }

      console.log('저장된 데이터:', data);
      setSuccess(`식사 인원 ${mealCount}명이 성공적으로 등록되었습니다. (${mealCd === 'M' ? '아침' : mealCd === 'A' ? '점심' : mealCd === 'E' ? '저녁' : '기타'} 식사)`);
      
      // 식사 인원 초기화
      setMealCount(0);
      
      // 팝업 닫기
      setVisitorInfo(null);

      // roomNumber 초기화
      setRoomNumber('');
    } catch (err) {
      console.error('Exception:', err);
      setError('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      <main className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-screen">
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">식사 확인</h1>
          
          {/* 방번호 입력 영역 */}
          <div className="mb-4 sm:mb-6">
            {/* 날짜 입력 */}
            <div className="mb-4 bg-gray-50 p-3 rounded-lg">              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 sm:p-3 text-base sm:text-6xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-2">방번호를 입력하세요</h2>
            <div className="text-6xl sm:text-8xl font-bold text-center mb-8 sm:mb-16 h-12">
              {roomNumber || '---'}
            </div>
            
            {/* 숫자 버튼 그룹 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleButtonClick(num.toString())}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-4xl sm:text-6xl font-bold py-6 sm:py-8 rounded-xl transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleButtonClick('0')}
                className="bg-blue-500 hover:bg-blue-600 text-white text-4xl sm:text-6xl font-bold py-6 sm:py-8 rounded-xl transition-colors"
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="bg-red-500 hover:bg-red-600 text-white text-4xl sm:text-6xl font-bold py-6 sm:py-8 rounded-xl transition-colors"
              >
                C
              </button>
            </div>
            
            {/* 확인 버튼 */}
            <button
              onClick={handleCheck}
              disabled={loading || roomNumber.length !== 3}
              className={`w-full py-8 sm:py-12 rounded-xl text-white font-bold text-3xl sm:text-5xl ${
                loading || roomNumber.length !== 3
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600'
              } transition-colors`}
            >
              {loading ? '확인 중...' : '확인'}
            </button>
          </div>
          
          {/* 결과 표시 영역 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 text-sm sm:text-base">
              {success}
            </div>
          )}
          
          {/* 수동 입력 모달 */}
          {manualInput && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg max-w-[72rem] w-full relative">
                <button 
                  onClick={() => setManualInput(false)}
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 hover:bg-red-600 text-white px-2 py-2 sm:px-3 sm:py-4 rounded-lg text-2xl sm:text-4xl font-medium flex items-center transition-colors"
                  aria-label="돌아가기"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  돌아가기
                </button>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">방문자 정보 입력</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-gray-600 text-2xl sm:text-4xl mb-1 sm:mb-2">방번호</p>
                    <p className="text-2xl sm:text-4xl font-bold">{roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-2xl sm:text-4xl mb-1 sm:mb-2">방문자 이름</p>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full p-2 sm:p-3 text-2xl sm:text-4xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="이름을 입력하세요"
                    />
                  </div>
                </div>

                {/* 식사 인원 입력 */}
                <div className="mt-4 sm:mt-6 border-t pt-4">
                  <h3 className="text-2xl sm:text-4xl font-semibold text-gray-700 mb-2">식사 인원 입력</h3>
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <button
                      onClick={() => handleMealCountChange(-1)}
                      className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full text-xl sm:text-2xl font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="text-2xl sm:text-3xl font-bold w-12 sm:w-16 text-center">{mealCount}</div>
                    <button
                      onClick={() => handleMealCountChange(1)}
                      className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full text-xl sm:text-2xl font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-center text-gray-600 text-xl sm:text-2xl mb-2">최대 인원: 4명</p>
                </div>
                
                <button
                  onClick={handleManualSubmit}
                  className="w-full mt-4 py-4 sm:py-6 rounded-xl text-white font-bold text-2xl sm:text-4xl bg-purple-500 hover:bg-purple-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          )}
          
          {visitorInfo && (
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-blue-200 rounded-xl p-4 sm:p-6 shadow-lg max-w-[72rem] w-full relative">
                {/* 돌아가기 버튼 */}
                <button 
                  onClick={() => {
                    setVisitorInfo(null);
                    setRoomNumber('');
                  }} 
                  className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-500 hover:bg-red-600 text-white px-2 py-2 sm:px-3 sm:py-4 rounded-lg text-2xl sm:text-4xl font-medium flex items-center transition-colors"
                  aria-label="돌아가기"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  돌아가기
                </button>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-6">방문자 정보</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 sm:mb-6">
                  <div>
                    <p className="text-gray-600 text-2xl sm:text-4xl mb-1 sm:mb-2">방번호</p>
                    <p className="text-2xl sm:text-4xl font-bold">{roomNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-2xl sm:text-4xl mb-1 sm:mb-2">방문자</p>
                    <p className="text-2xl sm:text-4xl font-bold">{visitorInfo.user_nm}</p>
                  </div>
                  {/* <div>
                    <p className="text-gray-600 text-2xl sm:text-4xl mb-1 sm:mb-2">인원수</p>
                    <p className="text-2xl sm:text-4xl font-bold">{visitorInfo.guest_num}명</p>
                  </div> */}
                </div>
                
                {/* 식사 인원 입력 영역 */}
                <div className="mt-4 sm:mt-6 border-t pt-4">
                  <h3 className="text-2xl sm:text-4xl font-semibold text-gray-700 mb-2">식사 인원 입력</h3>
                  <div className="flex items-center justify-center space-x-4 mb-2">
                    <button
                      onClick={() => handleMealCountChange(-1)}
                      className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full text-xl sm:text-2xl font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <div className="text-2xl sm:text-3xl font-bold w-12 sm:w-16 text-center">{mealCount}</div>
                    <button
                      onClick={() => handleMealCountChange(1)}
                      className="bg-green-500 hover:bg-green-600 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full text-xl sm:text-2xl font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-center text-gray-600 text-xl sm:text-2xl mb-2">최대 인원: 4명</p>
                  
                  {warning && (
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mt-4 text-sm sm:text-base">
                      {warning}
                    </div>
                  )}
                  
                  {/* 신청 버튼 */}
                  <button
                    onClick={handleSubmit}
                    disabled={saving || mealCount <= 0}
                    className={`w-full mt-4 py-4 sm:py-6 rounded-xl text-white font-bold text-2xl sm:text-4xl ${
                      saving || mealCount <= 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-purple-500 hover:bg-purple-600'
                    } transition-colors`}
                  >
                    {saving ? '저장 중...' : '식사 신청'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 