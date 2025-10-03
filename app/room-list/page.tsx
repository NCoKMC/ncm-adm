'use client';
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { RoomStatus, roomStatusMap, Room, roomStatusColors } from '../lib/type';
import { formatDate } from '../utils/dateUtils';
import { format } from 'date-fns';

// 방 상태 타입 정의
// type RoomStatus =  'N' | 'C' | 'T' | 'G';

// 상태 코드 매핑
// const statusMap: Record<RoomStatus, string> = {  
//   'N': '청소중',
//   'C': '청소완료',
//   'T': '셋팅완료',
//   'G': '점검완료'
// };

// 방 데이터 타입 정의
// interface Room {
//   org_cd: string;
//   room_no: string;
//   status_cd: string;
//   clear_chk_yn: string;
//   bipum_chk_yn: string;
//   insp_chk_yn: string;
//   use_yn: string;
// }

// // 상태별 색상 매핑
// const statusColors: Record<RoomStatus, string> = {
//   'N': 'bg-yellow-100 text-yellow-800',
//   'C': 'bg-green-100 text-green-800',
//   'T': 'bg-purple-100 text-purple-800',
//   'G': 'bg-indigo-100 text-indigo-800'
// };

export default function RoomList() {
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | '전체'>('전체');
  const [selectedUseStatus, setSelectedUseStatus] = useState<'전체' | '입실' | '공실'>('전체');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLargeMobile, setIsLargeMobile] = useState(false);
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // 인증되지 않은 경우 로그인 페이지로 리디렉션
      router.push('/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      console.log('데이터 가져오기 시작');
      
      const { data, error } = await supabase
        .from('kmc_rooms')
        .select('room_no, org_cd, status_cd, clear_chk_yn, bipum_chk_yn, insp_chk_yn, use_yn')
        .eq('use_yn', 'Y')
       // .order('status_cd', { ascending: false })
        .order('room_no', { ascending: true });

      if (error) {
        console.error('데이터 가져오기 오류:', error);
        return;
      }

      // 예약 정보 가져오기
      const today = formatDate(new Date());
      const { data: reservations, error: reservationError } = await supabase
        .from('kmc_info')
        .select('room_no, check_in_ymd, check_out_ymd')
        .lte('check_in_ymd', today)
        .gte('check_out_ymd', today)
        .in('status_cd', ['I', 'S'])
        .order('room_no', { ascending: true });

      if (reservationError) {
        console.error('예약 정보 가져오기 오류:', reservationError);
        return;
      }
      
      //console.log('예약 정보:', reservations);

      if (!data || data.length === 0) {
        console.log('데이터가 없습니다.');
        setRooms([]);
        return;
      }

      // 데이터 형식 변환
      const formattedRooms = data.map(room => {
        const reservation = reservations?.find(reservation => reservation.room_no?.includes(room.room_no));
        return {
          room_no: room.room_no || '',
          org_cd: room.org_cd || '',
          status_cd: room.status_cd || 'O',
          clear_chk_yn: room.clear_chk_yn || 'N',
          bipum_chk_yn: room.bipum_chk_yn || 'N',        
          insp_chk_yn: room.insp_chk_yn || 'N',
          use_yn: reservation ? 'Y' : 'N',
          check_in_ymd: reservation?.check_in_ymd || ''
        };
      });

      setRooms(formattedRooms);
    } catch (error) {
      console.error('데이터 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms
    .filter(room => selectedStatus === '전체' || room.status_cd === selectedStatus)
    .filter(room => {
      if (selectedUseStatus === '전체') return true;
      if (selectedUseStatus === '입실') return room.use_yn === 'Y';
      if (selectedUseStatus === '공실') return room.use_yn === 'N';
      return true;
    });

  // 날짜 형식 변환 함수 (YYYYMMDD -> YYYY-MM-DD)
  const checkInDate = (dateString: string) => {
    if (dateString.length !== 8) return dateString;
    return `${dateString.substring(0, 4)}-${dateString.substring(4, 6)}-${dateString.substring(6, 8)}`;
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
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="w-full">
        <div className="min-h-screen bg-[#1e3a8a] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
              {/* 헤더 */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">방 목록</h1>
                
                {/* 상태 필터 */}
                <div className="mt-2 sm:mt-3 md:mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedStatus('전체')}
                    className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium ${
                      selectedStatus === '전체' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  {Object.keys(roomStatusColors).map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status as RoomStatus)}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium ${
                        selectedStatus === status 
                          ? 'bg-blue-500 text-white' 
                          : `${roomStatusColors[status as RoomStatus]} hover:opacity-80`
                      }`}
                    >
                      {roomStatusMap[status as RoomStatus]}
                    </button>
                  ))}
                </div>

                {/* 입실/퇴실 필터 */}
                <div className="mt-2 sm:mt-3 md:mt-4 flex flex-wrap gap-2">
                  {['전체', '입실', '공실'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedUseStatus(status as '전체' | '입실' | '공실')}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium ${
                        selectedUseStatus === status 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 방 목록 테이블 */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg overflow-hidden">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800">방 목록</h2>
                </div>
                <div className="overflow-x-auto">
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">
                            방번호
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">
                            방상태
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">
                            입실/퇴실
                          </th>
                          <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">
                            입실일
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRooms.length > 0 ? (
                          filteredRooms.map((room, index) => (
                            <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/room-detail?roomNo=${room.room_no}`)}>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 w-auto">
                                {room.room_no}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap w-auto">
                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm leading-5 font-semibold ${roomStatusColors[room.status_cd as RoomStatus] || 'bg-gray-100 text-gray-800'}`}>
                                  {roomStatusMap[room.status_cd as RoomStatus] || '알 수 없음'}
                                </span>
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 w-auto">
                                {room.use_yn === 'Y' ? '입실' : '공실'}
                              </td>
                              <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 w-auto">
                                {room.use_yn === 'Y' ? checkInDate(room.check_in_ymd || '') : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-gray-500">
                              데이터가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 