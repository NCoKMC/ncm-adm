'use client';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import Navigation from '../components/Navigation';
import { useRouter } from 'next/navigation';
import Router from 'next/router';
import { supabase } from '../lib/supabase';
import { KmcInfo, ReservationStatus, reservationStatusMap, Room, RoomStatus, roomStatusMap, roomStatusColors } from '../lib/type';

// 타입 정의
//interface propPage {
  // kmc_cd: string;
  // user_nm: string;
  // location_nm: string;
  // check_in_ymd: string;
  // check_out_ymd: string;
  // room_no: string;
  // guest_num: number;
  // status_cd: string;
  // status_nm: string;
  // group_desc: string;
  // check_in_hhmm: string;
  // check_out_hhmm: string;

//}

// type RoomStatus = 'I' | 'O' | 'S';
//   // 상태 코드 매핑
//   const statusMap: Record<RoomStatus, string> = {
//     'I': '입실',
//     'O': '퇴실', 
//     'S': '예약'    
//   };
export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [incomingFriends, setIncomingFriends] = useState<KmcInfo[]>([]);
  const [outgoingFriends, setOutgoingFriends] = useState<KmcInfo[]>([]);
  const [cleaningRooms, setCleaningRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isSmallMobile, setIsSmallMobile] = useState(false);
  const router = useRouter();

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsSmallMobile(window.innerWidth <= 412); // 갤럭시 울트라 크기
    };
    
    // 초기 체크
    checkScreenSize();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkScreenSize);
    
    // 클린업
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 데이터 가져오기 함수
  const fetchKmcInfo = async (date: Date) => {
    try {
      setLoading(true);
      const formattedDate = format(date, 'yyyyMMdd');
      const fiveDaysLater = format(new Date(date.getTime() + 5 * 24 * 60 * 60 * 1000), 'yyyyMMdd');

      // 청소해야 할 방 목록 가져오기
      const { data: cleaningData, error: cleaningError } = await supabase
        .from('kmc_rooms')
        .select('room_no, org_cd, status_cd, clear_chk_yn, bipum_chk_yn, insp_chk_yn, use_yn')
        .eq('status_cd', 'Z')
        .eq('use_yn', 'Y');

      if (cleaningError) throw cleaningError;

      // 예약 정보 가져오기
      const { data: reservationData, error: reservationError } = await supabase
        .from('kmc_info')
        .select('room_no, check_in_ymd, check_out_ymd')
        .gt('check_in_ymd', formattedDate)
        .lt('check_in_ymd', fiveDaysLater)
        .order('check_in_ymd', { ascending: true });
      
      if (reservationError) throw reservationError;

      // 청소해야 할 방과 예약 정보 매칭
      const cleaningRoomsWithReservation = cleaningData?.map(room => {
        const reservation = reservationData?.find(res => res.room_no?.includes(room.room_no));
        return {
          ...room,
          check_in_ymd: reservation?.check_in_ymd || '',
          check_out_ymd: reservation?.check_out_ymd || ''
        };
      }).filter(room => room.check_in_ymd !== '') || [];

      setCleaningRooms(cleaningRoomsWithReservation);
      
      // 도착하는 친구들 가져오기
      const { data: incomingData, error: incomingError } = await supabase
        .from('kmc_info')
        .select('*')
        .eq('check_in_ymd', formattedDate)
        .in('status_cd', ['I', 'S'])
        .order('check_in_ymd', { ascending: true });

      if (incomingError) throw incomingError;

      // 출발하는 친구들 가져오기
      const { data: outgoingData, error: outgoingError } = await supabase
        .from('kmc_info')
        .select('*')
        .eq('check_out_ymd', formattedDate)
        .in('status_cd', ['O', 'I','S'])
        .order('check_out_ymd', { ascending: true });

      if (outgoingError) throw outgoingError;

      setIncomingFriends(incomingData || []);
      setOutgoingFriends(outgoingData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 날짜가 변경될 때마다 데이터 다시 가져오기
  useEffect(() => {
    fetchKmcInfo(selectedDate);
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
          {/* 날짜 선택 */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center">
            <h2 className={`font-semibold text-gray-800 mb-2 sm:mb-0 sm:mr-4 ${isSmallMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>날짜 선택</h2>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => date && setSelectedDate(date)}
              dateFormat="yyyy/MM/dd"
              className={`w-full sm:w-auto px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors ${isSmallMobile ? 'text-xs' : 'text-sm sm:text-base'}`}
            />
          </div>

          {/* 목록 컨테이너 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* 청소해야 할 방 목록 */}
            <div className="bg-white rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h2 className={`font-semibold text-gray-800 ${isSmallMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>청소해야 할 방 목록</h2>
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-xs sm:text-sm">로딩 중...</div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-y-auto max-h-[200px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="bg-gray-50">
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">방번호</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">방상태</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">입실일</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">퇴실일</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cleaningRooms.length > 0 ? (
                          cleaningRooms.map((room, index) => (
                            <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/room-detail?roomNo=${room.room_no}`)}>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                                {room.room_no}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${roomStatusColors[room.status_cd as RoomStatus]}`}>
                                  {roomStatusMap[room.status_cd as RoomStatus]}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">
                                {room.check_in_ymd ? `${room.check_in_ymd.substring(0, 4)}/${room.check_in_ymd.substring(4, 6)}/${room.check_in_ymd.substring(6, 8)}` : '-'}
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">
                                {room.check_out_ymd ? `${room.check_out_ymd.substring(0, 4)}/${room.check_out_ymd.substring(4, 6)}/${room.check_out_ymd.substring(6, 8)}` : '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-2 sm:px-3 py-3 text-center text-xs text-gray-500">
                              청소해야 할 방이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 입실예정 목록 */}
            <div className="bg-white rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h2 className={`font-semibold text-gray-800 ${isSmallMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>입실예정</h2>
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-xs sm:text-sm">로딩 중...</div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-y-auto max-h-[200px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="bg-gray-50">
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">객실</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>                      
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">인원</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">지역</th>                      
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {incomingFriends.length > 0 ? (
                          incomingFriends.map((friend, index) => (
                            <tr key={`${friend.kmc_cd}-${index}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/reservation-detail/${friend.kmc_cd}`)}>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                                  friend.status_cd === 'S' ? 'bg-green-100 text-green-800' 
                                  : friend.status_cd === 'I' ? 'bg-green-100 text-green-800' 
                                    :'bg-yellow-100 text-yellow-800'
                                }`}>                            
                                  {reservationStatusMap[friend.status_cd as ReservationStatus]}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs font-medium text-gray-900">{friend.user_nm}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.room_no}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.check_in_hhmm}</td>                        
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.guest_num}명</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.location_nm}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-2 sm:px-3 py-3 text-center text-xs text-gray-500">
                              입실 예정인 고객이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* 퇴실예정 목록 */}
            <div className="bg-white rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h2 className={`font-semibold text-gray-800 ${isSmallMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>퇴실예정</h2>
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-xs sm:text-sm">로딩 중...</div>
              ) : (
                <div className="overflow-hidden">
                  <div className="overflow-y-auto max-h-[200px]">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-white">
                        <tr className="bg-gray-50">
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">객실</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>                      
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">인원</th>
                          <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">지역</th>                      
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {outgoingFriends.length > 0 ? (
                          outgoingFriends.map((friend, index) => (
                            <tr key={`${friend.kmc_cd}-${index}`} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/reservation-detail/${friend.kmc_cd}`)}>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">
                                <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs ${
                                  friend.status_cd === 'S' ? 'bg-green-100 text-green-800' 
                                  : friend.status_cd === 'I' ? 'bg-blue-100 text-blue-800' 
                                    :'bg-yellow-100 text-yellow-800'
                                }`}>                            
                                  {reservationStatusMap[friend.status_cd as ReservationStatus]}
                                </span>
                              </td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs font-medium text-gray-900">{friend.user_nm}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.room_no}</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.check_out_hhmm}</td>                        
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.guest_num}명</td>
                              <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-gray-500">{friend.location_nm}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-2 sm:px-3 py-3 text-center text-xs text-gray-500">
                              퇴실 예정인 고객이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 