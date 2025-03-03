import LandingBox from '@/components/LandingBox';
import { CHAINS } from '@/constants/supportedNetworks';

export default function NetworkPage({
  params,
}: {
  params: { networkName: CHAINS };
}) {
  const { networkName } = params;

  return <LandingBox networkName={networkName} />;
}
