'use client';
import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { supabase } from '../lib/supabase';
import { formatDate, formatDateTime } from '../utils/dateUtils';

interface VacationRequest {
  req_no: number;
  req_email: string;
  req_date: string;
  req_cd: string;
  req_desc: string;
  res_email: string | null;
  res_date: string | null;
  res_cd: string | null;
  res_desc: string | null;
  req_name?: string;
  res_name?: string;
  start_date?: string;
  end_date?: string;
  pto_cd?: string;
}

export default function VacationPage() {
  const [requests, setRequests] = useState<VacationRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateDates, setDuplicateDates] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [isMorning, setIsMorning] = useState(true);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<VacationRequest | null>(null);

  // 입력 필드 초기화 함수
  const resetForm = () => {
    setStartDate('');
    setEndDate('');
    setIsHalfDay(false);
    setIsMorning(true);
    setMemo('');
    setError('');
    setSuccess('');
    setSelectedRequest(null);
  };

  // 선택된 휴가신청 정보로 폼 초기화
  const initializeFormWithRequest = async (request: VacationRequest) => {
    try {
      // kmc_guentae_mgmt 테이블에서 휴가 정보 가져오기
      const { data: ptoData, error: ptoError } = await supabase
        .from('kmc_pto_mgmt')
        .select('start_ymd, end_ymd, pto_cd')
        .eq('req_no', request.req_no)
        .single();

      if (ptoError) throw ptoError;

      // 가져온 정보로 폼 초기화
      setStartDate(ptoData.start_ymd);
      setEndDate(ptoData.end_ymd);
      setMemo(request.req_desc || '');
      setSelectedRequest(request);

      // 반차 정보 설정
      if (ptoData.pto_cd === 'MO' || ptoData.pto_cd === 'AF') {
        setIsHalfDay(true);
        setIsMorning(ptoData.pto_cd === 'MO');
      } else {
        setIsHalfDay(false);
        setIsMorning(true);
      }
    } catch (err) {
      console.error('Error fetching vacation details:', err);
      setError('휴가 정보를 가져오는 중 오류가 발생했습니다.');
    }
  };

  // 휴가신청 목록 조회
  const fetchRequests = async () => {
    try {
      // kmc_requests 테이블에서 휴가신청 목록 조회
      const { data: requestsData, error: requestsError } = await supabase
        .from('kmc_requests')
        .select('*')
        .eq('req_cd', 'VC')
        .order('req_date', { ascending: false });

      if (requestsError) throw requestsError;

      // 신청자와 승인자의 이름을 가져오기
      const requestsWithNames = await Promise.all(
        (requestsData || []).map(async (request) => {
          // 신청자 이름 조회
          const { data: reqUserData } = await supabase
            .from('kmc_adms')
            .select('name')
            .eq('email', request.req_email)
            .single();

          // 승인자 이름 조회
          let resUserName = null;
          if (request.res_email) {
            const { data: resUserData } = await supabase
              .from('kmc_adms')
              .select('name')
              .eq('email', request.res_email)
              .single();
            resUserName = resUserData?.name || null;
          }

          // kmc_guentae_mgmt 테이블에서 휴가 정보 조회
          const { data: guentaeData } = await supabase
            .from('kmc_guentae_mgmt')
            .select('start_date, end_date, pto_cd')
            .eq('req_no', request.req_no)
            .single();

          return {
            ...request,
            req_name: reqUserData?.name || request.req_email,
            res_name: resUserName || request.res_email,
            start_date: guentaeData?.start_date,
            end_date: guentaeData?.end_date,
            pto_cd: guentaeData?.pto_cd
          };
        })
      );

      setRequests(requestsWithNames);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('데이터 조회 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // 휴가신청 처리
  const handleSubmit = async () => {
    if (!startDate || !endDate) {
      setError('휴가 시작일과 종료일을 선택해주세요.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('종료일은 시작일보다 이후여야 합니다.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('로그인이 필요합니다.');

      // 이미 신청된 날짜 체크
      const start = new Date(startDate);
      const end = new Date(endDate);
      const existingDates = [];

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const { data: existingData } = await supabase
          .from('kmc_guentae_mgmt')
          .select('start_date')
          .eq('email', user.email)
          .eq('start_date', formatDate(d))
          .eq('status_cd', 'VC');

        if (existingData && existingData.length > 0) {
          existingDates.push(formatDate(d));
        }
      }

      if (existingDates.length > 0) {
        setDuplicateDates(existingDates);
        setShowDuplicateModal(true);
        setLoading(false);
        return;
      }

      let req_no: number | null = null;
      let pto_cd = 'AL'; // 기본값: 전일

      // 반차인 경우 pto_cd 설정
      if (isHalfDay) {
        pto_cd = isMorning ? 'MO' : 'AF';
      }

      if (selectedRequest) {
        // 기존 신청 수정
        const { data: updateData, error: updateError } = await supabase
          .from('kmc_requests')
          .update({
            req_desc: memo,
            res_cd: 'W',
            res_email: null,
            res_date: null,
            res_desc: null
          })
          .eq('req_no', selectedRequest.req_no)
          .select()
          .single();

        if (updateError) throw updateError;
        req_no = updateData.req_no;

        // 기존 kmc_guentae_mgmt 데이터 삭제
        const { error: deleteError } = await supabase
          .from('kmc_guentae_mgmt')
          .delete()
          .eq('req_no', selectedRequest.req_no);

        if (deleteError) throw deleteError;

        // 시작일부터 종료일까지 각 날짜를 개별적으로 저장
        const dateArray = [];

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateArray.push({
            email: user.email,
            seq: 1,
            start_date: formatDate(d),
            end_date: formatDate(d),
            status_cd: 'VC',
            req_no: req_no,
            pto_cd: pto_cd
          });
        }

        // 새로운 데이터 일괄 삽입
        const { error: guentaeError } = await supabase
          .from('kmc_guentae_mgmt')
          .insert(dateArray);

        if (guentaeError) throw guentaeError;

        // kmc_pto_mgmt 테이블에 데이터 수정
        const { error: ptoError } = await supabase
          .from('kmc_pto_mgmt')
          .update(
            {              
              start_ymd: startDate,
              end_ymd: endDate,                            
              pto_cd: pto_cd
            }
          ).eq('req_no', selectedRequest.req_no)
          .select()
          .single();

        if (ptoError) throw ptoError;

        setSuccess('휴가신청이 수정되었습니다.');
      } else {
        // 새로운 신청
        console.log('새로운 신청');
        const { data: insertData, error: insertError } = await supabase
          .from('kmc_requests')
          .insert([
            {
              req_date: formatDateTime(new Date()),
              req_cd: 'VC',
              req_desc: memo,
              req_email: user.email,
              res_cd: 'W'
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;
        req_no = insertData.req_no;

        // 시작일부터 종료일까지 각 날짜를 개별적으로 저장
        const dateArray = [];
        console.log(start, end);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dateArray.push({
            email: user.email,
            seq: 1,
            start_date: formatDate(d),
            end_date: formatDate(d),
            status_cd: 'VC',
            req_no: req_no,
            pto_cd: pto_cd
          });
        }
        console.log(dateArray);
        // 새로운 데이터 일괄 삽입
        const { error: guentaeError } = await supabase
          .from('kmc_guentae_mgmt')
          .insert(dateArray);

        if (guentaeError) throw guentaeError;

        // kmc_pto_mgmt 테이블에 데이터 저장
        const { error: ptoError } = await supabase
          .from('kmc_pto_mgmt')
          .insert([
            {
              req_email: user.email,
              req_no: req_no,
              start_ymd: startDate,
              end_ymd: endDate,
              pto_cd: pto_cd
            }
          ]);

        if (ptoError) throw ptoError;

        setSuccess('휴가신청이 완료되었습니다.');
      }

      setShowModal(false);
      resetForm();
      fetchRequests();
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('휴가신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 승인 상태 텍스트 변환
  const getStatusText = (code: string | null) => {
    switch (code) {
      case 'S': return '승인';
      case 'C': return '반려';
      case 'W': return '대기중';
      default: return '-';
    }
  };

  // 휴가 유형 텍스트 변환
  const getVacationTypeText = (code: string | undefined) => {
    switch (code) {
      case 'AL': return '전일';
      case 'MO': return '오전반차';
      case 'AF': return '오후반차';
      default: return '-';
    }
  };

  return (
    <div className="min-h-screen bg-[#1e3a8a]">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="bg-white rounded-3xl p-2 sm:p-3 md:p-4 lg:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2 sm:gap-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">휴가신청 현황</h1>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base"
            >
              휴가신청
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-sm sm:text-base">
              {success}
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm md:text-base">신청자</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm md:text-base">신청일</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm md:text-base">요청일</th>                    
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm md:text-base">신청내역</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm md:text-base">승인 상태</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr 
                      key={request.req_no} 
                      className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                      onClick={async () => {
                        if (request.res_cd !== 'S') {
                          setShowModal(true);
                          await initializeFormWithRequest(request);
                        }
                      }}
                    >
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{request.req_name}</td>
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{request.req_date.split('T')[0]}</td>
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{request.start_date ? request.start_date.split('T')[0] : '-'}</td>                      
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{getVacationTypeText(request.pto_cd)}</td>
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm md:text-base">{getStatusText(request.res_cd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* 휴가신청 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4">
              {selectedRequest ? '휴가신청 수정' : '휴가신청'}
            </h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴가 시작일
                </label>
                <input
                  type="date"
                  value={startDate ? new Date(startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  disabled={selectedRequest?.res_cd === 'S'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴가 종료일
                </label>
                <input
                  type="date"
                  value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  disabled={selectedRequest?.res_cd === 'S'}
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center text-sm sm:text-base">
                  <input
                    type="checkbox"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="mr-2 w-4 h-4"
                    disabled={selectedRequest?.res_cd === 'S'}
                  />
                  반차
                </label>
                {isHalfDay && (
                  <div className="flex space-x-4">
                    <label className="flex items-center text-sm sm:text-base">
                      <input
                        type="radio"
                        checked={isMorning}
                        onChange={() => setIsMorning(true)}
                        className="mr-2 w-4 h-4"
                        disabled={selectedRequest?.res_cd === 'S'}
                        value="MO"
                      />
                      오전
                    </label>
                    <label className="flex items-center text-sm sm:text-base">
                      <input
                        type="radio"
                        checked={!isMorning}
                        onChange={() => setIsMorning(false)}
                        className="mr-2 w-4 h-4"
                        disabled={selectedRequest?.res_cd === 'S'}
                        value="AF"
                      />
                      오후
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 border rounded-lg text-sm sm:text-base"
                  rows={4}
                  disabled={selectedRequest?.res_cd === 'S'}
                />
                <p className="text-xs sm:text-sm text-gray-500 text-right mt-1">
                  {memo.length}/500
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-100 text-sm sm:text-base"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || selectedRequest?.res_cd === 'S'}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {loading ? '처리중...' : (selectedRequest ? '재신청' : '신청')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 중복 날짜 팝업 */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-red-600">
              중복된 휴가신청
            </h2>
            
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-gray-700">
                다음 날짜는 이미 휴가신청이 되어있습니다:
              </p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <ul className="list-disc list-inside text-sm sm:text-base">
                  {duplicateDates.map((date, index) => (
                    <li key={index} className="text-gray-700">
                      {date}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setDuplicateDates([]);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 