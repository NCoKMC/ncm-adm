'use client';
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { formatDate } from '../utils/dateUtils';

interface MealInfo {
  id: number;
  room_no: string;
  org: string;
  meal_ymd: string;
  meal_cd: string;
  meal_time: string;
  eat_num: number;
}

export default function MealListPage() {
  const router = useRouter();
  const [searchDate, setSearchDate] = useState<string>('');
  const [searchRoomNo, setSearchRoomNo] = useState<string>('');
  const [mealList, setMealList] = useState<MealInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [isLargeMobile, setIsLargeMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 480);
      setIsLargeMobile(width >= 480 && width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    // 초기 체크
    checkScreenSize();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkScreenSize);
    
    // 클린업
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 오늘 날짜를 기본값으로 설정
  useEffect(() => {
    const today = new Date();
    const formattedDate = formatDate(today);
    setSearchDate(formattedDate);
  }, []);

  // 식사 정보 조회 함수
  const handleSearch = async () => {
    if (!searchDate) {
      setError('날짜를 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
      const formattedDate = searchDate.replace(/-/g, '');
      
      // 쿼리 조건 설정
      let query = supabase
        .from('kmc_meal_mgmt')
        .select('*')
        .eq('meal_ymd', formattedDate)
        .order('meal_ymd', { ascending: false })
        .order('meal_time', { ascending: true });
      
      // 방번호가 입력된 경우 방번호 조건 추가
      if (searchRoomNo) {
        query = query.eq('room_no', searchRoomNo);
      }
      
      // 쿼리 실행
      const { data, error } = await query;

      if (error) throw error;

      // 인원 합계 계산
      const totalGuests = data.reduce((sum, meal) => sum + (parseInt(meal.eat_num) || 0), 0);
      setMealList(data || []);
      setSuccess(`${data.length}건의 식사 정보가 조회되었습니다. (총 ${totalGuests}명)`);
    } catch (err) {
      console.error('Exception details:', err);
      setError(`오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 날짜 형식 변환 함수 (YYYYMMDD -> YYYY-MM-DD)
  const mealDate = (dateString: string) => {
    if (dateString.length !== 8) return dateString;
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
  };

  // 시간 형식 변환 함수 (HHMM -> HH:MM)
  const mealTime = (timeString: string) => {
    if (timeString.length !== 4) return timeString;
    return `${timeString.substring(0, 2)}:${timeString.substring(2, 4)}`;
  };

  // CSV 다운로드 함수
  const handleCSVDownload = () => {
    if (mealList.length === 0) {
      setError('다운로드할 데이터가 없습니다.');
      return;
    }

    try {
      // CSV 헤더
      const headers = ['방번호', '식사 날짜', '식사 코드', '식사 시간', '식사 인원'];
      
      // CSV 데이터 준비
      const csvData = mealList.map(meal => [
        meal.room_no,
        mealDate(meal.meal_ymd),
        meal.meal_cd,
        mealTime(meal.meal_time),
        `${meal.eat_num}`
      ]);

      // CSV 문자열 생성
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      // Blob 생성
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `식사목록_${searchDate.replace(/-/g, '')}.csv`);
      document.body.appendChild(link);
      
      // 다운로드 실행
      link.click();
      
      // 정리
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('CSV 파일이 다운로드되었습니다.');
    } catch (err) {
      console.error('CSV download error:', err);
      setError('CSV 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 로우 클릭 핸들러
  const handleRowClick = (roomNo: string) => {
    router.push(`/room-detail?roomNo=${roomNo}`);
  };

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="bg-white rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 shadow-lg">
          <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-5 lg:mb-6">
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">식사 확인 목록</h1>
            {mealList.length > 0 && (
              <button
                onClick={handleCSVDownload}
                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                CSV 다운로드
              </button>
            )}
          </div>
          
          {/* 검색 조건 영역 */}
          <div className="mb-3 sm:mb-4 md:mb-5 lg:mb-6 bg-blue-50 p-2 sm:p-3 md:p-4 rounded-xl">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-700 mb-2 sm:mb-3 md:mb-4">검색 조건</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4">
              <div>
                <label htmlFor="searchDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  날짜
                </label>
                <input
                  type="date"
                  id="searchDate"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base"
                />
              </div>
              
              <div>
                <label htmlFor="searchRoomNo" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  방번호 (선택)
                </label>
                <input
                  type="text"
                  id="searchRoomNo"
                  value={searchRoomNo}
                  onChange={(e) => setSearchRoomNo(e.target.value)}
                  placeholder="방번호 입력"
                  className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>
            
            <button
              onClick={handleSearch}
              disabled={loading}
              className={`w-full py-2 sm:py-2.5 md:py-3 rounded-xl text-white font-bold text-sm sm:text-base md:text-lg ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              } transition-colors`}
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>
          
          {/* 메시지 표시 영역 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm md:text-base">
              {success}
            </div>
          )}
          
          {/* 결과 표시 영역 */}
          {mealList.length > 0 && (
            <div className="overflow-x-auto">
              <div className="max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-[65vh] overflow-y-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-left text-xs sm:text-sm font-semibold text-gray-600">방번호</th>
                      <th className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-left text-xs sm:text-sm font-semibold text-gray-600">식사 날짜</th>
                      <th className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-left text-xs sm:text-sm font-semibold text-gray-600">식사 코드</th>
                      <th className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-left text-xs sm:text-sm font-semibold text-gray-600">식사 시간</th>
                      <th className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-left text-xs sm:text-sm font-semibold text-gray-600">식사 인원</th>                   
                    </tr>
                  </thead>
                  <tbody>
                    {mealList.map((meal) => (
                      <tr 
                        key={`${meal.room_no}-${meal.org}-${meal.meal_ymd}-${meal.meal_cd}`} 
                        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRowClick(meal.room_no)}
                      >
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-xs sm:text-sm text-gray-700">{meal.room_no}</td>
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-xs sm:text-sm text-gray-700">{mealDate(meal.meal_ymd)}</td>
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-xs sm:text-sm text-gray-700">{meal.meal_cd}</td>
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-xs sm:text-sm text-gray-700">{mealTime(meal.meal_time)}</td>
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-xs sm:text-sm text-gray-700">{meal.eat_num}명</td>                      
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 