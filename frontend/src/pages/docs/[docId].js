import { useRouter } from 'next/router';
import { useEffect } from 'react';
import DocsPage from './index';

export default function DocPage() {
  const router = useRouter();
  
  // 使用文档页面组件
  return <DocsPage />;
}

// 告诉 Next.js 这是一个服务器端渲染页面
export async function getServerSideProps() {
  return {
    props: {}
  };
} 