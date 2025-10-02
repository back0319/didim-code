import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';

interface User {
  id: number;
  username: string;
  rank: number;
  score: number;
  solvedProblems: number;
  avatar: string;
  country: string;
  badge: string;
  recentActivity: string;
}

interface RankingPageProps {
  users: User[];
  currentUser: User | null;
}

export default function RankingPage({ users, currentUser }: RankingPageProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('전체');
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const periods = ['전체', '주간', '월간', '연간'];
  const categories = ['전체', '알고리즘', '자료구조', 'DP', '그래프'];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    if (rank <= 10) return '🏆';
    if (rank <= 50) return '🎖️';
    return '🔹';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank === 2) return 'from-gray-300 to-gray-500';
    if (rank === 3) return 'from-orange-400 to-orange-600';
    if (rank <= 10) return 'from-purple-400 to-purple-600';
    return 'from-blue-400 to-blue-600';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              글로벌 랭킹
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              전 세계 개발자들과 실력을 겨뤄보고 순위를 확인하세요
            </p>
          </div>

          {/* Current User Stats */}
          {currentUser && (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl">
                    {currentUser.avatar}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentUser.username}</h3>
                    <p className="text-purple-100">#{currentUser.rank} 글로벌 랭킹</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{currentUser.score.toLocaleString()}</div>
                  <div className="text-purple-100">포인트</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentUser.solvedProblems}</div>
                  <div className="text-purple-100 text-sm">해결한 문제</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentUser.badge}</div>
                  <div className="text-purple-100 text-sm">획득 배지</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{currentUser.country}</div>
                  <div className="text-purple-100 text-sm">국가</div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">기간</label>
                <div className="flex flex-wrap gap-2">
                  {periods.map(period => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedPeriod === period
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Podium */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏆 Top 3</h2>
            <div className="flex justify-center items-end space-x-4">
              {/* 2nd Place */}
              {users[1] && (
                <div className="text-center">
                  <div className="bg-gradient-to-t from-gray-300 to-gray-500 rounded-t-2xl p-6 text-white mb-4 h-32 flex flex-col justify-end">
                    <div className="text-3xl mb-2">🥈</div>
                    <div className="font-bold">2위</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <div className="text-2xl mb-2">{users[1].avatar}</div>
                    <div className="font-bold text-gray-900">{users[1].username}</div>
                    <div className="text-gray-600 text-sm">{users[1].score.toLocaleString()} pts</div>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {users[0] && (
                <div className="text-center">
                  <div className="bg-gradient-to-t from-yellow-400 to-yellow-600 rounded-t-2xl p-6 text-white mb-4 h-40 flex flex-col justify-end">
                    <div className="text-4xl mb-2">🥇</div>
                    <div className="font-bold text-lg">1위</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <div className="text-3xl mb-2">{users[0].avatar}</div>
                    <div className="font-bold text-gray-900 text-lg">{users[0].username}</div>
                    <div className="text-gray-600">{users[0].score.toLocaleString()} pts</div>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {users[2] && (
                <div className="text-center">
                  <div className="bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-2xl p-6 text-white mb-4 h-24 flex flex-col justify-end">
                    <div className="text-2xl mb-2">🥉</div>
                    <div className="font-bold">3위</div>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-lg">
                    <div className="text-xl mb-2">{users[2].avatar}</div>
                    <div className="font-bold text-gray-900">{users[2].username}</div>
                    <div className="text-gray-600 text-sm">{users[2].score.toLocaleString()} pts</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Full Ranking List */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">전체 랭킹</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <div 
                  key={user.id} 
                  className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    currentUser?.id === user.id ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRankColor(user.rank)} flex items-center justify-center text-white font-bold`}>
                        {user.rank <= 3 ? getRankBadge(user.rank) : user.rank}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900">{user.username}</h3>
                          <span className="text-sm text-gray-500">{user.country}</span>
                          {user.badge && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{user.recentActivity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-8 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{user.score.toLocaleString()}</div>
                      <div className="text-gray-500">포인트</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900">{user.solvedProblems}</div>
                      <div className="text-gray-500">해결</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Load More Button */}
          <div className="text-center mt-8">
            <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
              더 보기
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // 샘플 데이터 - 실제로는 API에서 가져옴
  const users: User[] = [
    {
      id: 1,
      username: "AlgoMaster",
      rank: 1,
      score: 95420,
      solvedProblems: 1247,
      avatar: "👑",
      country: "🇰🇷",
      badge: "Grand Master",
      recentActivity: "2시간 전 Hard 문제 해결"
    },
    {
      id: 2,
      username: "CodeNinja",
      rank: 2,
      score: 89230,
      solvedProblems: 1098,
      avatar: "🥷",
      country: "🇺🇸",
      badge: "Master",
      recentActivity: "4시간 전 Medium 문제 해결"
    },
    {
      id: 3,
      username: "DataStructGuru",
      rank: 3,
      score: 87650,
      solvedProblems: 987,
      avatar: "🧠",
      country: "🇨🇳",
      badge: "Expert",
      recentActivity: "6시간 전 강의 완료"
    },
    {
      id: 4,
      username: "PythonPro",
      rank: 4,
      score: 82340,
      solvedProblems: 876,
      avatar: "🐍",
      country: "🇮🇳",
      badge: "Expert",
      recentActivity: "1일 전 Easy 문제 해결"
    },
    {
      id: 5,
      username: "JavaJedi",
      rank: 5,
      score: 79180,
      solvedProblems: 823,
      avatar: "☕",
      country: "🇯🇵",
      badge: "Advanced",
      recentActivity: "1일 전 Medium 문제 해결"
    },
    {
      id: 6,
      username: "CPlusPlusChamp",
      rank: 6,
      score: 76920,
      solvedProblems: 798,
      avatar: "⚡",
      country: "🇩🇪",
      badge: "Advanced",
      recentActivity: "2일 전 Hard 문제 해결"
    },
    {
      id: 7,
      username: "JSWizard",
      rank: 7,
      score: 74560,
      solvedProblems: 756,
      avatar: "🧙‍♂️",
      country: "🇫🇷",
      badge: "Advanced",
      recentActivity: "2일 전 강의 시청"
    },
    {
      id: 8,
      username: "RustRocket",
      rank: 8,
      score: 72340,
      solvedProblems: 689,
      avatar: "🚀",
      country: "🇷🇺",
      badge: "Intermediate",
      recentActivity: "3일 전 Easy 문제 해결"
    },
    {
      id: 9,
      username: "GoGopher",
      rank: 9,
      score: 69870,
      solvedProblems: 642,
      avatar: "🐹",
      country: "🇬🇧",
      badge: "Intermediate",
      recentActivity: "3일 전 Medium 문제 해결"
    },
    {
      id: 10,
      username: "SwiftEagle",
      rank: 10,
      score: 67450,
      solvedProblems: 598,
      avatar: "🦅",
      country: "🇨🇦",
      badge: "Intermediate",
      recentActivity: "4일 전 강의 완료"
    }
  ];

  // 현재 사용자 (실제로는 세션에서 가져옴)
  const currentUser: User = {
    id: 50,
    username: "YoungCoder",
    rank: 42,
    score: 12450,
    solvedProblems: 87,
    avatar: "🌟",
    country: "🇰🇷",
    badge: "Beginner",
    recentActivity: "1시간 전 Easy 문제 해결"
  };

  return {
    props: {
      users,
      currentUser
    }
  };
};