import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    window.location.href = 'https://ziyao.tech';
  }, []);

  return null;
}
