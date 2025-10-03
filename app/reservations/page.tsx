'use client';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, isToday } from 'date-fns';
import Navigation from '../components/Navigation';
import { useRouter } from 'next/navigation';
import Router from 'next/router';
import { supabase } from '../lib/supabase';
import type { JSX } from 'react';
import { KmcInfo, ReservationStatus, reservationStatusMap } from '../lib/type';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../lib/auth';
import * as XLSX from 'xlsx';

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
  // email: string;
  // memo: string;
//}

// kmc_cd 생성 함수
const generateKmcCd = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function Reservations() {
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(formatDate(new Date()).slice(0, 7));
  const [selectedStatus, setSelectedStatus] = useState<string>('전체');
  const [reservations, setReservations] = useState<KmcInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const { userEmail } = useAuth();
  const [newReservation, setNewReservation] = useState({
    seq_no: 0,
    kmc_cd: '',
    user_nm: '',
    location_nm: '',
    check_in_ymd: format(new Date(), 'yyyyMMdd'),
    check_out_ymd: format(new Date(), 'yyyyMMdd'),
    check_in_hhmm: '1400',
    check_out_hhmm: '1100',
    room_no: '',
    guest_num: 1,
    status_cd: 'S',
    group_desc: '',
    phone_num: '',
    memo: ''
  });
  const router = useRouter();

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

  // 예약 상태 옵션
  const reservationStatusOptions = [
    { value: '전체', label: '전체' },
    { value: 'I', label: '입실' },
    { value: 'S', label: '예약' },
    { value: 'O', label: '퇴실' }
  ];

  // 데이터 가져오기 함수
  const fetchReservations = async () => {
    try {
      setLoading(true);
      const [year, month] = selectedYearMonth.split('-');
      const formattedDate = `${selectedYearMonth.replace(/-/g, '')}%`;
      const endDate = `${selectedYearMonth}-31`;

      
    
      let query = supabase
        .from('kmc_info')
        .select('*')        
        .or(`check_in_ymd.like.${formattedDate},check_out_ymd.like.${formattedDate}`)
        .in('status_cd', ['S', 'I', 'O'])
        .order('check_in_ymd', { ascending: true });

      

      if (selectedStatus !== '전체') {
        query = query.eq('status_cd', selectedStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  // 신규 예약 생성
  const handleCreateReservation = async () => {
    try {
      if (!userEmail) {
        alert('로그인이 필요합니다.');
        return;
      }

      // kmc_cd 생성
      const kmc_cd = generateKmcCd();
      // seq 생성 (YYYYmm 형식)
      const seq_no = parseInt(format(new Date(), 'yyyyMM'));
      const reservationData = {
        ...newReservation,
        kmc_cd,
        seq_no,
        reg_date: new Date().toISOString(),
        reg_id: userEmail
      };
      console.log(reservationData);
      const { data, error } = await supabase
        .from('kmc_info')
        .insert([reservationData])
        .select()
        .single();

      if (error) throw error;

      setShowNewReservationModal(false);
      fetchReservations();
      router.push(`/reservation-detail/${data.kmc_cd}`);
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('예약 생성 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 템플릿 다운로드 함수
  const handleDownloadTemplate = () => {
    // kmc_info 테이블 실제 컬럼명 전체 반영
    const columns = [
      'seq_no',
      'kmc_cd',
      'user_nm',
      'spouse_nm',
      'dispatch_agency_nm',
      'dispatch_dmn_nm',
      'dispatch_church_nm',
      'location_nm',
      'dispatch_agency_phone_1_num',
      'user_email',
      'check_in_ymd',
      'check_in_hhmm',
      'check_out_ymd',
      'check_out_hhmm',
      'guest_num',
      'group_desc',
      'phone_num',
      'hc',
      'ot',
      'proof_doc_yn',
      'room_no',
      'status_cd',
      'status_nm',
      'memo',
      'reg_date',
      'reg_id',
      'upd_date',
      'upd_id',
    ];
    const ws = XLSX.utils.aoa_to_sheet([columns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'kmc_info_template.xlsx');
  };

  // 엑셀 업로드 input 참조
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 엑셀 업로드 모달 상태
  const [showExcelModal, setShowExcelModal] = useState(false);


  // 엑셀 업로드 버튼 클릭 시 모달 오픈
  const checkUploadAuth = async () => {
    const { data, error } = await supabase.rpc('kmc_upload_info', {
      p_user_id: userEmail || 'SYSTEM'
    });
  
    if (error) {
      console.error('에러 발생:', error.message);
      return false;
    } else {
      console.log('호출 성공:', data);

      if(data == 'X') {
        alert('업로드 권한이 없습니다.');
        return false;
      }
    }
    return true;
  }

  // 엑셀 업로드 버튼 클릭 시 모달 오픈
  const handleExcelUploadClick = async () => {
    const auth = await checkUploadAuth();
    if(auth) {
      setShowExcelModal(true);
    }
  };

  // 모달 닫기
  const handleCloseExcelModal = () => {
    setShowExcelModal(false);
  };

  // 엑셀 업로드 정합성 검사 및 업로드 전체 프로세스
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {    
    // console.log('엑셀 업로드 시작',userEmail);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      if (!data) return;
     
      const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
      const header = json[0] as string[];
      // console.log('엑셀 헤더:', header);
      const orgColumns = [
        'No.',	'코드',	'성명',	'배우자',	'파송기관단체',	'파송기관교단',	'파송기관교회',	'파송국가',	'연락처',	'이메일',	'입실일',	'입실시간',	'퇴실일',	'퇴실시간',	'입실인원',	'가족사항',	'연락처',	'힐링센터',	'OT',	'증빙서류',	'객실선택',	'상태'
      ];
      
      const requiredColumns = [
        'seq_no', 'kmc_cd', 'user_nm', 'spouse_nm', 'dispatch_agency_nm', 'dispatch_dmn_nm', 'dispatch_church_nm', 'location_nm', 'dispatch_agency_phone_1_num', 'user_email', 'check_in_ymd', 'check_in_hhmm', 'check_out_ymd', 'check_out_hhmm', 'guest_num', 'group_desc', 'phone_num', 'hc', 'ot', 'proof_doc_yn', 'room_no', 'status_cd'
      ];
      
      const isValid = header && header.length === orgColumns.length && header.every((col, idx) => col === orgColumns[idx]);
      if (!isValid) {
        alert('엑셀 컬럼이 형식과 일치하지 않습니다.\n\n필수 컬럼:\n' + orgColumns.join(', '));
        setShowExcelModal(false);
        return;
      }
      
      // 1. 엑셀 데이터 rows 추출 (orgColumns 인덱스로 읽어서 requiredColumns 컬럼명으로 저장)
      const rows = json.slice(1).map((row, i) => {
        const arr = row as any[];
        const obj: any = {};
        requiredColumns.forEach((col, idx) => {
          obj[col] = arr[idx] ?? null;
        });
        return obj;
      });

      const rowCnt = rows.length;
      // console.log('엑셀 데이터 rowCnt:', rowCnt);
      console.log('엑셀 데이터 rows:', rows);
      
      if (rowCnt > 0) {
          

          // 2. kms_info_tmp 전체 목록 조회 후 seq_no만 추출하여 삭제
          const { data: allRows, error: selectError } = await supabase.from('kms_info_tmp').select('seq_no');
          if (selectError) {
            console.error('kms_info_tmp select error:', selectError);
          } else if (allRows && allRows.length > 0) {
            const allSeqNos = Array.from(new Set(allRows.map(r => r.seq_no).filter(v => v != null)));
            // console.log('삭제할 seq_no 목록:', allSeqNos);
            // console.log('삭제 전 kms_info_tmp 건수:', allRows.length);
            if (allSeqNos.length > 0) {
              const { error: deleteError } = await supabase.from('kms_info_tmp').delete().in('seq_no', allSeqNos);
              if (deleteError) {
                console.error('삭제 중 에러:', deleteError);
              } else {
                console.log('삭제 완료! 삭제된 건수:', allRows.length);
              }
            }
          } else {
            console.log('삭제할 데이터가 없습니다. (kms_info_tmp가 비어있음)');
          }

          // console.log('엑셀 업로드 시작2',rowCnt);
          await supabase.from('kms_info_tmp').insert(rows);

        // 3. 첫 번째 update 쿼리 (status_nm, memo, reg_date, reg_id, upd_date, upd_id)
        // console.log('엑셀 업로드 시작3',userEmail);
        const { data, error } = await supabase.rpc('proc_upload_info', {
          p_user_id: userEmail || 'SYSTEM'
        });
      
        if (error) {
          console.error('에러 발생:', error.message);
          alert('업로드 중 오류가 발생했습니다: ' + error.message);
          setShowExcelModal(false);
        } else {
          console.log('호출 성공:', data);
        }

        alert(`업로드 완료! 총 ${rowCnt}건이 처리되었습니다.`);
        setShowExcelModal(false);
      } else {
        alert('엑셀 파일에 데이터가 없습니다.');
        setShowExcelModal(false);
      }
    };
    // console.log('엑셀 업로드 시작4');
    reader.readAsArrayBuffer(file);
  };

  // 검색 조건이 변경될 때마다 데이터 다시 가져오기
  useEffect(() => {
    fetchReservations();
  }, [selectedYearMonth, selectedStatus]);

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8">
          {/* 검색 조건 */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">검색 조건</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* 년월 선택 */}
              <div>
                <label htmlFor="yearMonth" className="block text-sm font-medium text-gray-700 mb-1">
                  년월
                </label>
                <input
                  type="month"
                  id="yearMonth"
                  value={selectedYearMonth}
                  onChange={(e) => setSelectedYearMonth(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-base sm:text-lg"
                />
              </div>

              {/* 예약 상태 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예약 상태
                </label>
                <div className="flex flex-wrap gap-2">
                  {reservationStatusOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedStatus(option.value)}
                      className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-sm sm:text-base font-medium ${
                        selectedStatus === option.value 
                          ? option.value === '전체' ? 'bg-blue-500 text-white' :
                            option.value === 'S' ? 'bg-green-100 text-green-800' :
                            option.value === 'I' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 예약 목록 */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-lg">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800">예약 목록</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleExcelUploadClick}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  엑셀 업로드
                </button>
                <button
                  onClick={() => setShowNewReservationModal(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  신규 예약
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-4 text-base sm:text-lg">로딩 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr className="bg-gray-50">
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">상태</th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">예약자</th>                        
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">체크인</th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">체크아웃</th>
                        <th className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider w-1/5">지역</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservations.map((reservation, index) => (
                        <tr key={`${reservation.kmc_cd}-${index}`} className={`hover:bg-gray-50 font-medium cursor-pointer`} onClick={() => router.push(`/reservation-detail/${reservation.kmc_cd}`)}>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap w-auto">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                              reservation.status_cd === 'S' ? 'bg-green-100 text-green-800' : 
                              reservation.status_cd === 'I' ? 'bg-blue-100 text-blue-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {reservationStatusMap[reservation.status_cd as ReservationStatus]}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 w-auto">
                            {reservation.user_nm}
                          </td>                                              
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 w-auto">
                            {reservation.check_in_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')} {reservation.check_in_hhmm}
                          </td>
                          <td className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm w-auto ${
                            isToday(new Date(reservation.check_out_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))) 
                              ? 'text-pink-500 font-medium' 
                              : 'text-gray-500'
                          }`}>
                            {reservation.check_out_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')} {reservation.check_out_hhmm}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 w-auto">{reservation.location_nm}</td>
                                                                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 신규 예약 모달 */}
      {showNewReservationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">신규 예약</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예약자</label>
                <input
                  type="text"
                  value={newReservation.user_nm}
                  onChange={(e) => setNewReservation({...newReservation, user_nm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                <input
                  type="text"
                  value={newReservation.location_nm}
                  onChange={(e) => setNewReservation({...newReservation, location_nm: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">체크인 날짜</label>
                <input
                  type="date"
                  value={newReservation.check_in_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                  onChange={(e) => setNewReservation({...newReservation, check_in_ymd: e.target.value.replace(/-/g, '')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">체크인 시간</label>
                <input
                  type="time"
                  value={newReservation.check_in_hhmm.replace(/(\d{2})(\d{2})/, '$1:$2')}
                  onChange={(e) => setNewReservation({...newReservation, check_in_hhmm: e.target.value.replace(':', '')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">체크아웃 날짜</label>
                <input
                  type="date"
                  value={newReservation.check_out_ymd.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3')}
                  onChange={(e) => setNewReservation({...newReservation, check_out_ymd: e.target.value.replace(/-/g, '')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">체크아웃 시간</label>
                <input
                  type="time"
                  value={newReservation.check_out_hhmm.replace(/(\d{2})(\d{2})/, '$1:$2')}
                  onChange={(e) => setNewReservation({...newReservation, check_out_hhmm: e.target.value.replace(':', '')})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">객실 번호</label>
                <input
                  type="text"
                  value={newReservation.room_no}
                  onChange={(e) => setNewReservation({...newReservation, room_no: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">인원</label>
                <input
                  type="number"
                  value={newReservation.guest_num}
                  onChange={(e) => setNewReservation({...newReservation, guest_num: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input
                  type="text"
                  value={newReservation.phone_num}
                  onChange={(e) => setNewReservation({...newReservation, phone_num: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">단체명</label>
                <input
                  type="text"
                  value={newReservation.group_desc}
                  onChange={(e) => setNewReservation({...newReservation, group_desc: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea
                  value={newReservation.memo}
                  onChange={(e) => setNewReservation({...newReservation, memo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowNewReservationModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreateReservation}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                예약 생성
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 엑셀 업로드 모달 */}
      {showExcelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">엑셀 업로드</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors w-full"
              >
                엑셀 업로드
              </button>
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleExcelUpload}
                style={{ display: 'none' }}
              />
              {/* <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors w-full"
              >
                템플릿 다운로드
              </button> */}
              <button
                onClick={handleCloseExcelModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors w-full"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 