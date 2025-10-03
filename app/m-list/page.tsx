'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Navigation from '../components/Navigation';
import { useRouter } from 'next/navigation';

interface MissionaryListItem {
  id: number;
  missionary_id: string;
  korean_name: string;
  gender: string;
  mobile_phone: string;
  email1: string;
  mission_name: string;
  created_at: string;
}

export default function MListPage() {
  const [missionaries, setMissionaries] = useState<MissionaryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();

  useEffect(() => {
    fetchMissionaries();
  }, [sortBy, sortOrder]);

  const fetchMissionaries = async () => {
    try {
      setLoading(true);
      setError(null);

      // 사역자 기본 정보와 연락처 정보를 조인하여 가져오기
      const { data, error } = await supabase
        .from('ncm_m10001')
        .select(`
          id,
          missionary_id,
          korean_name,
          gender,
          mission_name,
          created_at,
          ncm_m10002!inner (
            mobile_phone,
            email1
          )
        `)
        .order(sortBy === 'name' ? 'korean_name' : 'created_at', { ascending: sortOrder === 'asc' });

      if (error) {
        console.error('Error fetching missionaries:', error);
        setError('사역자 목록을 불러오는 중 오류가 발생했습니다.');
        return;
      }

      // 데이터 구조 변환
      const transformedData = data?.map(item => ({
        id: item.id,
        missionary_id: item.missionary_id,
        korean_name: item.korean_name,
        gender: item.gender,
        mobile_phone: item.ncm_m10002?.mobile_phone || '',
        email1: item.ncm_m10002?.email1 || '',
        mission_name: item.mission_name || '',
        created_at: item.created_at
      })) || [];

      setMissionaries(transformedData);
    } catch (error) {
      console.error('Error:', error);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleMissionaryClick = (missionaryId: string) => {
    // 사역자 상세 정보 페이지로 이동 (편집 모드)
    router.push(`/tycichus?edit=${missionaryId}`);
  };

  const handleAddNew = () => {
    // 새 사역자 등록 페이지로 이동
    router.push('/tycichus');
  };

  const filteredMissionaries = missionaries.filter(missionary =>
    missionary.korean_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    missionary.mission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    missionary.missionary_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGenderText = (gender: string) => {
    return gender === 'male' ? '남' : gender === 'female' ? '여' : gender;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-6 max-w-6xl">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">사역자 목록을 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">사역자 목록</h1>
          <button
            onClick={handleAddNew}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium"
          >
            새 사역자 등록
          </button>
        </div>

        {/* 검색 및 정렬 */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="사역자명, 사역지, 사역자ID로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at')}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">등록일순</option>
                <option value="name">이름순</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* 사역자 목록 */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredMissionaries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 사역자가 없습니다</h3>
              <p className="text-gray-500 mb-4">새로운 사역자를 등록해보세요.</p>
              <button
                onClick={handleAddNew}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium"
              >
                사역자 등록하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사역자 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사역지
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      성별
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      핸드폰
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMissionaries.map((missionary) => (
                    <tr
                      key={missionary.id}
                      onClick={() => handleMissionaryClick(missionary.missionary_id)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {missionary.korean_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {missionary.korean_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {missionary.missionary_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {missionary.mission_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          missionary.gender === 'male' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {getGenderText(missionary.gender)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {missionary.mobile_phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {missionary.email1 || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(missionary.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 통계 정보 */}
        {filteredMissionaries.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {filteredMissionaries.length}
                </div>
                <div className="text-sm text-gray-500">총 사역자 수</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredMissionaries.filter(m => m.gender === 'male').length}
                </div>
                <div className="text-sm text-gray-500">남성 사역자</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-pink-600">
                  {filteredMissionaries.filter(m => m.gender === 'female').length}
                </div>
                <div className="text-sm text-gray-500">여성 사역자</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

