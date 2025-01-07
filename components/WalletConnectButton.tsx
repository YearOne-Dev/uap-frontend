'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatAddress } from '@/utils/utils';

const WalletConnectButton = ({
  callToAction = 'Connect',
}: {
  callToAction?: string;
}) => {
  const [previousStatus, setPreviousStatus] = useState<string>();
  const [previousAddress, setPreviousAddress] = useState<string>();

  const { address, status } = useAppKitAccount();
  const [buttonText, setButtonText] = useState<string>('...');

  useEffect(() => {
    if (
      previousStatus &&
      previousStatus !== status &&
      previousStatus !== 'loading'
    ) {
      window.location.reload();
    } else {
      setPreviousStatus(status);
    }
  }, [status]);

  useEffect(() => {
    if (status === 'connecting' || status === 'reconnecting') {
      setButtonText('...');
    } else if (status === 'connected' && address) {
      setButtonText(formatAddress(address));
    } else {
      setButtonText(callToAction);
    }
  }, [status, address]);

  useEffect(() => {
    //handle switching network within the reown connect modal
    if (address && previousAddress) {
      if (address !== previousAddress) {
        window.location.reload();
      }
    } else if (address) {
      setPreviousAddress(address);
    }
  }, [address]);

  return <w3m-connect-button label={buttonText} size={'sm'} />;
};

export default WalletConnectButton;
