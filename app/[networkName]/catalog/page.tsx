import React from 'react';
import { Metadata } from 'next';
import { appMetadata } from '@/constants/appMetadata';
import CatalogClient from '@/components/CatalogClient';

const { title, openGraph, twitter } = appMetadata;
const description =
  'Engage your personal digital assistant for Web3 transactions.';

export const metadata: Metadata = {
  title: `${title} - Catalog`,
  description,
  openGraph: {
    ...openGraph,
    title: `${title} - Catalog`,
    description,
  },
  twitter: {
    ...twitter,
    title: `${title} - Catalog`,
    description,
  },
};

export default function CatalogPage({
  params,
}: {
  params: { networkName: string };
}) {
  return <CatalogClient networkName={params.networkName} />;
}
