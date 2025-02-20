import { Metadata } from 'next';
import LandingBox from '@/components/LandingBox';
import { CHAINS } from '@/constants/supportedNetworks';

export const metadata: Metadata = {
  title: 'UP Assistants - 🆙 Assistants Catalog',
};

export default function NetworkPage({
  params,
}: {
  params: { networkName: CHAINS };
}) {
  const { networkName } = params;

  return <LandingBox networkName={networkName} />;
}
