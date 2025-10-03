import { supabase } from './supabase';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// 인증 상태를 확인하는 함수
export async function checkAuth() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.log('인증 확인 중 오류 발생:', error);
    // 로그인되지 않은 경우 로그인 페이지로 리디렉션
    redirect('/login');
  }
  console.log('인증 확인 완료:', session);
  return session;
}

// 중복 로그인 체크 및 다른 세션 로그아웃 함수
export async function checkDuplicateLogin(email: string) {
  try {
    // 현재 세션 가져오기
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession) {
      return false;
    }

    // 현재 사용자의 모든 세션 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return false;
    }

    // 현재 세션을 제외한 다른 세션 로그아웃
    const { error } = await supabase.auth.signOut({
      scope: 'others'
    });
    
    if (error) {
      console.error('다른 세션 로그아웃 중 오류 발생:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('중복 로그인 체크 중 오류 발생:', error);
    return false;
  }
}

// 클라이언트 컴포넌트에서 사용할 수 있는 인증 확인 훅
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // 세션이 있으면 사용자 정보 설정
        setUser(session.user);
        setUserEmail(session.user.email || null);
        setIsAuthenticated(true);
        
        // 사용자 이름 가져오기
        if (session.user.email) {
          fetchUserName(session.user.email);
        }
      } else {
        // 세션이 없으면 로그인 페이지로 리디렉션 (start-page 제외)
        if (pathname !== '/start-page') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    // 인증 상태 변경 이벤트 리스너
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          // 로그인 시 사용자 정보 설정
          setUser(session?.user || null);
          setUserEmail(session?.user?.email || null);
          setIsAuthenticated(true);
          
          if (session?.user?.email) {
            // 사용자 이름 가져오기
            fetchUserName(session.user.email);
          }
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 사용자 정보 초기화
          setUser(null);
          setUserEmail(null);
          setUserName(null);
          setIsAuthenticated(false);
          
          // start-page가 아닌 경우에만 로그인 페이지로 리디렉션
          if (pathname !== '/start-page') {
            router.push('/login');
          }
        }
      }
    );
    
    // 컴포넌트 언마운트 시 이벤트 리스너 정리
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);
  
  // 사용자 이름 가져오기 함수
  const fetchUserName = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('kmc_adms')
        .select('name')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('사용자 이름 가져오기 오류:', error);
        return;
      }
      
      if (data) {
        setUserName(data.name);
      }
    } catch (error) {
      console.error('사용자 이름 가져오기 오류:', error);
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      throw error;
    }
  };
  
  return { isAuthenticated, loading, user, userEmail, userName, updatePassword };
} 