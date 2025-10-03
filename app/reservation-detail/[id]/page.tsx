'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { supabase } from '../../lib/supabase';
import { KmcInfo, ReservationStatus, reservationStatusMap } from '../../lib/type';
import { formatDateForDB } from '@/app/utils/dateUtils';
import { useAuth } from '../../lib/auth';
// 타입 정의
//interface Reservation {
  // kmc_cd: string;
  // user_nm: string;
  // location_nm: string;
  // check_in_ymd: string;
  // check_out_ymd: string;
  // check_in_hhmm: string;
  // check_out_hhmm: string;
  // room_no: string;
  // guest_num: number;
  // status_cd: string;
  // status_nm: string;
  // group_desc: string;
  // phone_num: string;
  // user_email: string;
  // seq_no: string;
  // memo: string;
//}
//type RoomStatus = 'I' | 'O' | 'S';
  // 상태 코드 매핑
  //const statusMap: Record<RoomStatus, string> = {
  //  'I': '입실',
  //  'O': '퇴실', 
  //  'S': '예약'    
  //};

export default function RoomDetail() {
  const params = useParams();
  const router = useRouter();
  const { userEmail } = useAuth();
  const [reservation, setReservation] = useState<KmcInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [memo, setMemo] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [memoError, setMemoError] = useState('');
  const [memoSuccess, setMemoSuccess] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [editingInfo, setEditingInfo] = useState({
    check_in_ymd: '',
    check_in_hhmm: '',
    check_out_ymd: '',
    check_out_hhmm: '',
    room_no: '',
    guest_num: '',
    user_nm: '',
    phone_num: '',
    location_nm: '',
    group_desc: ''
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [infoSuccess, setInfoSuccess] = useState('');
  const memoTextareaRef = useRef<HTMLTextAreaElement>(null);
  const originalScrollPosition = useRef(0);

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

  // 메모 textarea 포커스 처리
  useEffect(() => {
    const textarea = memoTextareaRef.current;
    if (!textarea) return;

    const handleFocus = () => {
      // 현재 스크롤 위치 저장
      originalScrollPosition.current = window.scrollY;
      
      // textarea가 화면 하단에 있는지 확인
      const textareaRect = textarea.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // textarea가 화면 하단에 있으면 스크롤 조정
      if (textareaRect.bottom > viewportHeight * 0.7) {
        // textarea가 화면 중앙에 오도록 스크롤
        const scrollTo = window.scrollY + (textareaRect.top - viewportHeight * 0.3);
        window.scrollTo({
          top: scrollTo,
          behavior: 'smooth'
        });
      }
    };

    const handleBlur = () => {
      // 포커스 해제 시 원래 스크롤 위치로 복귀
      setTimeout(() => {
        window.scrollTo({
          top: originalScrollPosition.current,
          behavior: 'smooth'
        });
      }, 100); // 약간의 지연을 두어 키보드가 완전히 사라진 후 스크롤
    };

    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);

    return () => {
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 데이터 가져오기 함수
  const fetchReservation = async () => {
    try {
      setLoading(true);
      const kmc_cd = params.id as string;
      console.log(kmc_cd);
      const { data, error } = await supabase
        .from('kmc_info')
        .select('*')
        .eq('kmc_cd', kmc_cd)          
        .in('status_cd', ['S', 'I','O'])
        .order('check_in_ymd', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      setReservation(data);
      setMemo(data.memo || '');
      setEditingInfo({
        check_in_ymd: data.check_in_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        check_in_hhmm: data.check_in_hhmm,
        check_out_ymd: data.check_out_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        check_out_hhmm: data.check_out_hhmm,
        room_no: data.room_no,
        guest_num: data.guest_num.toString(),
        user_nm: data.user_nm,
        phone_num: data.phone_num,
        location_nm: data.location_nm,
        group_desc: data.group_desc
      });
    } catch (error) {
      console.error('Error fetching reservation:', error);
    } finally {
      setLoading(false);
    }
  };

  // 메모와 체크인/아웃 정보 저장 함수
  const saveChanges = async () => {
    if (!reservation) return;
    
    try {
      setSavingMemo(true);
      setMemoError('');
      setMemoSuccess('');
      setInfoError('');
      setInfoSuccess('');
      
      if (!userEmail) {
        setMemoError('로그인이 필요합니다.');
        return;
      }
      
      const { error } = await supabase
        .from('kmc_info')
        .update({
          memo: memo,
          check_in_ymd: editingInfo.check_in_ymd.replace(/-/g, ''),
          check_in_hhmm: editingInfo.check_in_hhmm,
          check_out_ymd: editingInfo.check_out_ymd.replace(/-/g, ''),
          check_out_hhmm: editingInfo.check_out_hhmm,
          room_no: editingInfo.room_no,
          guest_num: parseInt(editingInfo.guest_num),
          user_nm: editingInfo.user_nm,
          phone_num: editingInfo.phone_num,
          location_nm: editingInfo.location_nm,
          group_desc: editingInfo.group_desc,
          upd_date: new Date().toISOString(),
          upd_id: userEmail
        })
        .eq('kmc_cd', reservation.kmc_cd)
        .eq('seq_no', reservation.seq_no);
      
      if (error) throw error;
      
      setMemoSuccess('변경사항이 성공적으로 저장되었습니다.');
      fetchReservation();
      
      // 3초 후 성공 메시지 숨기기
      setTimeout(() => {
        setMemoSuccess('');
      }, 3000);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      setMemoError('변경사항 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingMemo(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchReservation();
  }, [params.id]);

  // reservation이 변경될 때 editingInfo 업데이트
  useEffect(() => {
    if (reservation) {
      setEditingInfo({
        check_in_ymd: reservation.check_in_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        check_in_hhmm: reservation.check_in_hhmm,
        check_out_ymd: reservation.check_out_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
        check_out_hhmm: reservation.check_out_hhmm,
        room_no: reservation.room_no,
        guest_num: reservation.guest_num.toString(),
        user_nm: reservation.user_nm,
        phone_num: reservation.phone_num,
        location_nm: reservation.location_nm,
        group_desc: reservation.group_desc
      });
    }
  }, [reservation]);

  // 예약 상태 업데이트 함수
  const updateStatus = async (newStatus: string) => {
    try {
      if (!reservation) {
        alert("null"); 
        return;
      }
      console.log('저장할 newStatus:', newStatus);
      console.log('저장할 데이터:', reservation);

      const { error } = await supabase
        .from('kmc_info')
        .update({ status_cd: newStatus })
        .eq('kmc_cd', reservation.kmc_cd)
        .eq('seq_no', reservation.seq_no)
        .select();

      if (error) throw error;

      // 상태 업데이트 후 데이터 다시 가져오기
      fetchReservation();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
          {/* 뒤로가기 버튼 */}
          <div className="flex justify-start">
            <button
              onClick={() => router.back()}
              className="bg-white text-gray-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow hover:bg-gray-100 transition-colors text-sm sm:text-base"
            >
              ← 뒤로가기
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg text-center py-6 sm:py-8">
              <p className="text-gray-600 text-sm sm:text-base">로딩 중...</p>
            </div>
          ) : reservation ? (
            <>
              {/* 예약 정보 카드 */}
              <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">예약 상세 정보</h2>
                    <span className={`px-4 sm:px-6 py-1 sm:py-2 rounded-full text-sm sm:text-base lg:text-lg font-bold ${
                      reservation.status_cd === 'S' ? 'bg-green-100 text-green-800' :
                          reservation.status_cd === 'I' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                     {reservationStatusMap[reservation.status_cd as ReservationStatus]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* 기본 정보 */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 border-b pb-1 sm:pb-2">기본 정보</h3>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">예약자</div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editingInfo.user_nm}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, user_nm: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">연락처</div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editingInfo.phone_num}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, phone_num: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">지역</div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editingInfo.location_nm}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, location_nm: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">그룹</div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editingInfo.group_desc}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, group_desc: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 체크인/아웃 정보 */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 border-b pb-1 sm:pb-2">체크인/아웃 정보</h3>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">체크인</div>
                      <div className="col-span-2 space-y-2">
                        <input
                          type="date"
                          value={editingInfo.check_in_ymd}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, check_in_ymd: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                        <input
                          type="time"
                          value={editingInfo.check_in_hhmm}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, check_in_hhmm: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">체크아웃</div>
                      <div className="col-span-2 space-y-2">
                        <input
                          type="date"
                          value={editingInfo.check_out_ymd}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, check_out_ymd: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                        <input
                          type="time"
                          value={editingInfo.check_out_hhmm}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, check_out_hhmm: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">방번호</div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={editingInfo.room_no}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, room_no: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 sm:gap-2">
                      <div className="text-gray-500 text-sm sm:text-base">인원</div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={editingInfo.guest_num}
                          onChange={(e) => setEditingInfo(prev => ({ ...prev, guest_num: e.target.value }))}
                          min="1"
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 메모 */}
                <div className="mt-4 sm:mt-6 space-y-2">
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 border-b pb-1 sm:pb-2">메모</h3>
                  <textarea
                    ref={memoTextareaRef}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    maxLength={1000}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    rows={4}
                    placeholder="메모를 입력하세요 (최대 1000자)"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-gray-500">{memo.length}/1000</span>
                  </div>
                  {memoError && (
                    <p className="text-red-500 text-xs sm:text-sm">{memoError}</p>
                  )}
                  {memoSuccess && (
                    <p className="text-green-500 text-xs sm:text-sm">{memoSuccess}</p>
                  )}
                </div>

                {/* 변경 버튼 */}
                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveChanges}
                    disabled={savingMemo}
                    className="px-3 py-1 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 text-sm sm:text-base"
                  >
                    {savingMemo ? '저장 중...' : '변경'}
                  </button>
                </div>

                {/* 상태 변경 버튼 */}
                <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-4">
                  <button
                    onClick={() => updateStatus('S')}
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                      reservation.status_cd === 'I'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                    }`}
                  >
                    예약
                  </button>
                  <button
                    onClick={() => updateStatus('I')}
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                      reservation.status_cd === 'S'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    입실
                  </button>
                  <button
                    onClick={() => updateStatus('O')}
                    className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                      reservation.status_cd === 'I'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-yellow-100'
                    }`}
                  >
                    퇴실
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg text-center py-6 sm:py-8">
              <p className="text-gray-600 text-sm sm:text-base">예약 정보를 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 