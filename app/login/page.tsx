'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { checkDuplicateLogin } from '../lib/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  // 저장된 로그인 정보 불러오기
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // 키보드가 나타날 때 자동으로 스크롤
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
      }, 300);
    };

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.addEventListener('focus', handleFocus);
    }

    return () => {
      if (passwordInput) {
        passwordInput.removeEventListener('focus', handleFocus);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. 먼저 이메일과 비밀번호로 인증
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
        
      // 2. 사용자 정보에서 관리자 권한 확인
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('kmc_adms')
          .select('adm_yn, adm_grade')
          .eq('email', email)
          .single();

        if (userError) {
          throw userError;
        }
        console.log(userData);
        // 관리자 권한 확인
        if (!userData || userData.adm_yn !== 'Y') {
          // 관리자 권한이 없는 경우 로그아웃 처리
          await supabase.auth.signOut();
          setError('관리자 권한이 없습니다. 관리자에게 승인을 요청하세요.');
          return;
        }

        // 중복 로그인 체크 및 다른 세션 로그아웃
        const hasOtherSessions = await checkDuplicateLogin(email);
        if (hasOtherSessions) {
          console.log('다른 기기에서 로그인된 세션이 로그아웃되었습니다.');
        }

        // 로그인 정보 저장
        if (rememberMe) {
          localStorage.setItem('savedEmail', email);
        } else {
          localStorage.removeItem('savedEmail');
        }

        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#1e3a8a] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] bg-white rounded-3xl p-8">
        {/* 햄버거 메뉴 */}
        <div className="flex justify-start mb-8">
          <button className="text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* 로그인 타이틀 */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-center text-gray-800">Log in</h1>
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* 로그인 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-gray-600">Email</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mculture.victor@gmail.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm text-gray-600">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                disabled={loading}
              >
                {showPassword ? (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 로그인 정보 저장 체크박스 */}
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600">
              로그인 정보 저장
            </label>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#2563eb] text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 비밀번호 찾기 */}
        <div className="mt-4 text-center">
          <a href="#" className="text-[#2563eb] text-sm hover:underline">
            비밀번호를 잊으셨나요?
          </a>
        </div>

        {/* 회원가입 링크 */}
        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600">계정이 없으신가요? </span>
          <Link href="/signup" className="text-[#2563eb] hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
} 