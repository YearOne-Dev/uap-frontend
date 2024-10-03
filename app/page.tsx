import { Metadata } from 'next';
import LandingBox from '@/components/LandingBox';

export const metadata: Metadata = {
  title: 'UPAC - 🆙 Assistants Catalog',
  description: 'tbd',
};

export default function Home() {
  return <LandingBox />;
}
