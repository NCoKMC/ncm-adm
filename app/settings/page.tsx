'use client';
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 shadow-lg relative">
        <button 
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
          aria-label="돌아가기"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>    
          돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">설정</h1>
        <p className="text-gray-600">준비중입니다</p>
      </div>
    </div>
  );
} 