// 타입 정의
export interface KmcInfo {
    kmc_cd: string;
    user_nm: string;
    location_nm: string;
    check_in_ymd: string;
    check_out_ymd: string;
    room_no: string;
    guest_num: number;
    status_cd: string;
    status_nm: string;
    group_desc: string;
    check_in_hhmm: string;
    check_out_hhmm: string;
    phone_num: string;
    user_email: string;
    seq_no: string;
    memo: string;
  };

  export type ReservationStatus = 'I' | 'O' | 'S';
  // 상태 코드 매핑
  export const reservationStatusMap: Record<ReservationStatus, string> = {
    'I': '입실',
    'O': '퇴실', 
    'S': '예약'
  }; 

// 방 데이터 타입 정의
export interface Room {
    org_cd: string;
    room_no: string;
    status_cd: string;
    clear_chk_yn: string;
    bipum_chk_yn: string;
    insp_chk_yn: string;
    use_yn: string;
    check_in_ymd?: string;
    check_out_ymd?: string;
  };

  // 방 상태 타입 정의
export type RoomStatus =  'Z' | 'C' | 'T' | 'G';

// 상태 코드 매핑
export const roomStatusMap: Record<RoomStatus, string> = {  
  'Z': '청소중',
  'C': '청소완료',
  'T': '셋팅완료',
  'G': '점검완료'
};

// 상태별 색상 매핑
export const roomStatusColors: Record<RoomStatus, string> = {
    'Z': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-green-100 text-green-800',
    'T': 'bg-purple-100 text-purple-800',
    'G': 'bg-indigo-100 text-indigo-800'
  };





  