import React from 'react';
import { GetServerSideProps } from 'next';
import Layout from '../components/Layout';
import Link from 'next/link';

const Home: React.FC = () => {
  return (
    <Layout>
      <main className="min-h-screen bg-white">
        <section className="bg-white">
          <div className="px-4 py-20 sm:py-24 md:py-28">
            <div className="max-w-7xl mx-auto text-center">
              <h1 className="max-w-5xl mx-auto text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-950 mb-7 leading-tight">
                <span className="sm:hidden">
                  <span className="block">알고리즘 문제 풀이</span>
                  <span className="block mt-1">실행 과정 시각화</span>
                  <span className="block mt-1">한 가지 핵심 피드백</span>
                </span>
                <span className="hidden sm:block">
                  <span className="block">알고리즘 문제 풀이부터</span>
                  <span className="block mt-1">실행 시각화와 핵심 피드백까지</span>
                </span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                <span className="block">DidimCode는 Python 알고리즘 문제를 풀고,</span>
                <span className="block">코드의 실행 흐름을 단계별로 시각화하며,</span>
                <span className="block">정답 대신 한 가지 핵심 힌트로 풀이를 개선하는 학습 사이트입니다.</span>
              </p>
              
              <div className="flex justify-center">
                <Link 
                  href="/problems" 
                  className="group inline-flex items-center justify-center rounded-lg bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  문제 풀어보기
                  <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white pb-24 pt-12 sm:pt-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-950">
                DidimCode의 특징
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <article className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                <p className="mb-4 text-sm font-semibold text-indigo-600">01</p>
                <h3 className="text-xl font-semibold text-gray-950 mb-3">직접 풀어보는 학습</h3>
                <p className="text-gray-600 leading-relaxed">
                  Monaco Editor에서 Python 코드를 직접 작성하고 실행하며 풀이를 확인합니다.
                </p>
              </article>
              
              <article className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                <p className="mb-4 text-sm font-semibold text-indigo-600">02</p>
                <h3 className="text-xl font-semibold text-gray-950 mb-3">단계별 실행 시각화</h3>
                <p className="text-gray-600 leading-relaxed">
                  반복, 분기, 함수 호출과 변수 변화를 실제 실행 순서대로 확인합니다.
                </p>
              </article>
              
              <article className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                <p className="mb-4 text-sm font-semibold text-indigo-600">03</p>
                <h3 className="text-xl font-semibold text-gray-950 mb-3">한 가지 핵심 힌트</h3>
                <p className="text-gray-600 leading-relaxed">
                  정답 코드 대신 가장 먼저 확인할 힌트 하나를 받아 스스로 풀이를 개선합니다.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {}
  };
};
