'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // 세션 종료
        await supabase.auth.signOut();
        
        // 로컬 스토리지에서 인증 정보 제거
        localStorage.removeItem('user');
        
        // 로그인 페이지로 리디렉션
        router.push('/login');
      } catch (error) {
        console.error('로그아웃 중 오류 발생:', error);
        // 오류가 발생해도 로그인 페이지로 리디렉션
        router.push('/login');
      }
    };

    // 컴포넌트 마운트 시 로그아웃 실행
    handleLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1e3a8a] flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">로그아웃 중...</h1>
        <p className="text-gray-600 mb-6">잠시만 기다려주세요.</p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    </div>
  );
} 