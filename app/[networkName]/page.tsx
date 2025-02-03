import { Metadata } from 'next';
import LandingBox from '@/components/LandingBox';
import { CHAINS, networkNameToIdMapping } from '@/constants/supportedNetworks';

export const metadata: Metadata = {
    title: 'UPAC - 🆙 Assistants Catalog',
    description: 'tbd',
  };

export default function NetworkPage({
    params,
  }: {
    params: { networkName: CHAINS };
  }) {
  const { networkName } = params;

  return (
    <LandingBox networkName={networkName} />
  );
}
