import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';

interface Course {
  id: number;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  progress: number;
  topics: string[];
  instructor: string;
  rating: number;
  studentsCount: number;
}

interface LearnPageProps {
  courses: Course[];
}

export default function LearnPage({ courses }: LearnPageProps) {
  const [selectedLevel, setSelectedLevel] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');

  const levels = ['전체', 'Beginner', 'Intermediate', 'Advanced'];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === '전체' || course.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              알고리즘 학습
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              체계적인 강의를 통해 알고리즘의 기초부터 고급까지 단계별로 학습하세요
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="강의를 검색하세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div className="flex flex-wrap gap-3">
              {levels.map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedLevel === level
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level === '전체' ? '전체' : level}
                </button>
              ))}
            </div>

            {/* Filter Summary */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredCourses.length}개의 강의가 검색되었습니다
            </div>
          </div>

          {/* Learning Path Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">추천 학습 경로</h2>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">알고리즘 마스터 트랙</h3>
                  <p className="text-blue-100 mb-4">
                    기초부터 고급까지 체계적으로 알고리즘을 마스터하는 완전한 코스입니다.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L10 9.586V6z" />
                      </svg>
                      총 24시간
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      12개 강의
                    </span>
                  </div>
                </div>
                <div className="ml-8">
                  <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors">
                    시작하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                <div className="p-6">
                  {/* Course Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border mb-3 ${getLevelColor(course.level)}`}>
                        {course.level}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Course Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>

                  {/* Course Metadata */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">강사</span>
                      <span className="font-medium text-gray-900">{course.instructor}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">수강 시간</span>
                      <span className="font-medium text-gray-900">{course.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">수강생</span>
                      <span className="font-medium text-gray-900">{course.studentsCount.toLocaleString()}명</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= course.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{course.rating.toFixed(1)}</span>
                  </div>

                  {/* Progress Bar */}
                  {course.progress > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>진행률</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Topics */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">주요 주제</h4>
                    <div className="flex flex-wrap gap-1">
                      {course.topics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {topic}
                        </span>
                      ))}
                      {course.topics.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                          +{course.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {course.progress > 0 ? '이어서 학습' : '강의 시작'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600">다른 검색어나 필터를 시도해보세요.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  // 샘플 데이터 - 실제로는 API에서 가져옴
  const courses: Course[] = [
    {
      id: 1,
      title: "알고리즘 기초 완전정복",
      description: "프로그래밍을 처음 시작하는 분들을 위한 알고리즘 입문 강의입니다. 기본적인 자료구조부터 정렬, 탐색 알고리즘까지 체계적으로 학습합니다.",
      level: 'Beginner',
      duration: '8시간',
      progress: 75,
      topics: ['배열', '정렬', '탐색', '시간복잡도'],
      instructor: '김알고',
      rating: 4.8,
      studentsCount: 1250
    },
    {
      id: 2,
      title: "동적 프로그래밍 마스터",
      description: "동적 프로그래밍의 핵심 개념과 다양한 문제 패턴을 학습하고, 실전 문제 해결 능력을 기릅니다.",
      level: 'Intermediate',
      duration: '12시간',
      progress: 30,
      topics: ['DP', '메모이제이션', '최적화', '점화식'],
      instructor: '박코딩',
      rating: 4.9,
      studentsCount: 890
    },
    {
      id: 3,
      title: "그래프 알고리즘 심화",
      description: "그래프 이론의 기초부터 고급 알고리즘까지, DFS, BFS, 최단경로, 최소신장트리 등을 다룹니다.",
      level: 'Advanced',
      duration: '16시간',
      progress: 0,
      topics: ['DFS', 'BFS', '다익스트라', 'MST'],
      instructor: '이개발',
      rating: 4.7,
      studentsCount: 567
    },
    {
      id: 4,
      title: "문자열 알고리즘",
      description: "문자열 처리의 핵심 알고리즘들을 학습합니다. KMP, 라빈-카프, 트라이 등을 다룹니다.",
      level: 'Intermediate',
      duration: '10시간',
      progress: 0,
      topics: ['KMP', '라빈카프', '트라이', '문자열 매칭'],
      instructor: '최알고',
      rating: 4.6,
      studentsCount: 432
    },
    {
      id: 5,
      title: "트리 자료구조 완전정복",
      description: "이진트리부터 고급 트리 구조까지, 트리의 모든 것을 학습하는 종합 강의입니다.",
      level: 'Beginner',
      duration: '14시간',
      progress: 100,
      topics: ['이진트리', 'BST', 'AVL', '세그먼트 트리'],
      instructor: '정프로',
      rating: 4.8,
      studentsCount: 978
    },
    {
      id: 6,
      title: "고급 알고리즘 특강",
      description: "네트워크 플로우, 매칭 알고리즘, 고급 수학적 알고리즘 등 최고 난이도의 알고리즘을 다룹니다.",
      level: 'Advanced',
      duration: '20시간',
      progress: 0,
      topics: ['네트워크 플로우', '매칭', '수학적 알고리즘', '고급 최적화'],
      instructor: '한마스터',
      rating: 4.9,
      studentsCount: 234
    }
  ];

  return {
    props: {
      courses
    }
  };
};