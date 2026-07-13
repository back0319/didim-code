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
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-8 leading-tight">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  알고리즘 문제 풀이와 AI 코드 피드백
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                Monaco Editor에서 Python 코드를 작성하고 실행 결과와 AI 피드백을 확인할 수 있습니다.
              </p>
              
              <div className="flex justify-center">
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
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                주요 기능
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">⌨️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Monaco 코드 편집기</h3>
                <p className="text-gray-600 leading-relaxed">
                  브라우저에서 Python 코드를 작성하고 문제별 테스트 케이스를 확인할 수 있습니다.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">▶️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">격리된 코드 실행</h3>
                <p className="text-gray-600 leading-relaxed">
                  Vercel Sandbox의 격리된 Python 환경에서 코드를 실행하고 결과를 비교합니다.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI 코드 피드백</h3>
                <p className="text-gray-600 leading-relaxed">
                  제출한 코드의 복잡도와 코드 품질, 개선할 부분을 AI 피드백으로 확인합니다.
                </p>
              </div>
            </div>
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
