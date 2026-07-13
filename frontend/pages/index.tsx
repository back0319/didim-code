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
              <h1 className="max-w-6xl mx-auto text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 leading-tight">
                <span className="sm:hidden bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="block">알고리즘 문제 풀이</span>
                  <span className="block mt-1">실행 과정 시각화</span>
                  <span className="block mt-1">한 가지 핵심 피드백</span>
                </span>
                <span className="hidden sm:block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  <span className="block">알고리즘 문제 풀이부터</span>
                  <span className="block mt-2">실행 시각화와 핵심 피드백까지</span>
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                DidimCode는 Monaco Editor에서 Python 알고리즘 문제를 풀고, 코드의 실행 흐름을 단계별로 시각화하며, 정답 대신 한 가지 핵심 힌트로 풀이를 개선하는 학습 사이트입니다.
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
                DidimCode의 특징
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">⌨️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">직접 풀어보는 학습</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monaco Editor에서 Python 코드를 직접 작성하고 실행하며 풀이를 확인합니다.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">▶️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">단계별 실행 시각화</h3>
                <p className="text-gray-600 leading-relaxed">
                  반복, 분기, 함수 호출과 변수 변화를 실제 실행 순서대로 확인합니다.
                </p>
              </div>
              
              <div className="group bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100">
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">🤖</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">한 가지 핵심 힌트</h3>
                <p className="text-gray-600 leading-relaxed">
                  정답 코드 대신 가장 먼저 확인할 힌트 하나를 받아 스스로 풀이를 개선합니다.
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
