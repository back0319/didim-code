import React from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section with Gradient Background */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
          <div className="absolute inset-0">
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
          
          <div className="relative px-4 py-20 md:py-32">
            <div className="max-w-7xl mx-auto text-center">
              <div className="mb-8">
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mb-6">
                  🚀 AI 기반 알고리즘 학습 플랫폼
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  스마트 알고리즘 학습
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                개인 맞춤형 AI 튜터와 함께 단계별 학습, 실시간 피드백, 
                <br className="hidden md:block" />
                시각적 분석으로 알고리즘을 완벽하게 마스터하세요.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link 
                  href="/problems" 
                  className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    문제 풀어보기
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </Link>
                
                <Link 
                  href="/learn" 
                  className="group border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold py-4 px-10 rounded-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center justify-center">
                    학습 시작하기
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </span>
                </Link>
              </div>
              
              <div className="mt-16 flex justify-center">
                <div className="flex items-center space-x-8 text-gray-500">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                    <span>실시간 AI 피드백</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                    <span>개인 맞춤 학습</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                    <span>무료 이용</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                혁신적인 학습 경험
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                AI 기술과 최신 교육 방법론을 결합한 차세대 알고리즘 학습 플랫폼
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI 코드 분석</h3>
                <p className="text-gray-600 leading-relaxed">
                  고급 AI가 작성한 코드를 실시간으로 분석하여 최적화 방안, 성능 개선점, 
                  그리고 더 나은 알고리즘을 제안합니다
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">📊</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">알고리즘 시각화</h3>
                <p className="text-gray-600 leading-relaxed">
                  복잡한 알고리즘의 실행 과정을 인터랙티브한 애니메이션으로 시각화하여 
                  직관적인 이해를 돕습니다
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">⚡</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">실시간 피드백</h3>
                <p className="text-gray-600 leading-relaxed">
                  코드 작성 중 실시간으로 스마트한 힌트와 오류 수정 방안을 제공하여 
                  효율적인 학습을 지원합니다
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-indigo-600 mb-2">1000+</div>
                <div className="text-gray-600">알고리즘 문제</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
                <div className="text-gray-600">학습 트랙</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-green-600 mb-2">98%</div>
                <div className="text-gray-600">학습 만족도</div>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600">AI 튜터 지원</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              지금 바로 시작해보세요
            </h2>
            <p className="text-xl text-indigo-100 mb-10">
              수천 명의 개발자들이 이미 AlgoTutor와 함께 성장하고 있습니다
            </p>
            <Link 
              href="/problems" 
              className="inline-flex items-center bg-white text-indigo-600 font-bold py-4 px-10 rounded-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              무료로 시작하기
              <svg className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};