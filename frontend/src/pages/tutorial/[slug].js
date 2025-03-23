import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function TutorialPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!slug) return;

    // 从public/assets目录加载对应的markdown文件
    fetch(`/assets/${slug}.md`)
      .then(res => res.text())
      .then(text => setContent(text))
      .catch(err => console.error('Error loading tutorial:', err));
  }, [slug]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
} 