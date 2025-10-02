import React from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                AlgoTutor
              </Link>
              <span className="ml-2 text-sm text-gray-500">AI 알고리즘 학습 플랫폼</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                홈
              </Link>
              <Link 
                href="/problems" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/problems') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                문제
              </Link>
              <Link 
                href="/learn" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/learn') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                학습
              </Link>
              <Link 
                href="/ranking" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/ranking') 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                랭킹
              </Link>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                로그인
              </button>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AlgoTutor</h3>
              <p className="text-gray-600 text-sm">
                AI 기반 알고리즘 학습 플랫폼으로<br />
                효율적인 코딩 학습을 지원합니다.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">서비스</h4>
              <ul className="space-y-2">
                <li><Link href="/problems" className="text-gray-600 hover:text-gray-900 text-sm">문제</Link></li>
                <li><Link href="/learn" className="text-gray-600 hover:text-gray-900 text-sm">학습</Link></li>
                <li><Link href="/ranking" className="text-gray-600 hover:text-gray-900 text-sm">랭킹</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">지원</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">FAQ</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">문의하기</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">도움말</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">회사</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">소개</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">채용</a></li>
                <li><a href="#" className="text-gray-600 hover:text-gray-900 text-sm">이용약관</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-center text-gray-500 text-sm">
              © 2025 AlgoTutor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
};

export default Layout;