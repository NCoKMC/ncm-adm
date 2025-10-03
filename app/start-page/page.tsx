'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function StartPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/login');
  };

  return (
    <div 
      className="min-h-screen bg-white flex items-center justify-center cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-64 sm:w-80 md:w-96 relative">
        <Image
          src="/images/saejungang-logo.png"
          alt="새중앙교회 로고"
          width={500}
          height={200}
          priority
          className="w-full h-auto"
        />
      </div>
    </div>
  );
} 