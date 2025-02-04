// app/page.tsx
import { permanentRedirect } from 'next/navigation';
import { CHAINS } from '@/constants/supportedNetworks';

export default function HomePage() {
  // This will perform a server-side redirect to '/lukso'
  permanentRedirect(`/${CHAINS.LUKSO_TESTNET}`);
  // The component returns nothing since redirect() never allows further rendering.
  return null;
}
