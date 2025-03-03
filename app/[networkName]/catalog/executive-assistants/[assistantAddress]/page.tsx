import React from 'react';
import { Metadata } from 'next';
import {
  networkNameToIdMapping,
  supportedNetworks,
} from '@/constants/supportedNetworks';
import ExecutiveAssistantConfigureClient from '@/components/AssistantConfigureClient';
import { appMetadata } from '@/constants/appMetadata';

export async function generateMetadata({
  params,
}: {
  params: { networkName: string; assistantAddress: string };
}): Promise<Metadata> {
  const { url, title: appTitle, openGraph, twitter } = appMetadata;
  try {
    const network = supportedNetworks[
      networkNameToIdMapping[params.networkName]
    ] || {
      assistants: {},
    };
    const assistantInfo =
      network.assistants[params.assistantAddress.toLowerCase()] || null;

    if (!assistantInfo) {
      return {
        title: appTitle,
        description: 'Configure an executive assistant with advanced settings.',
        openGraph,
        twitter,
      };
    }
    const title = `${appTitle} - ${assistantInfo.name}`;
    const description = assistantInfo.description;
    const imageUrl = `${url}${assistantInfo.iconPath}`;
    const assistantUrl = `${url}/${params.networkName}/catalog/executive-assistants/${params.assistantAddress}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: assistantUrl,
        images: openGraph.images,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: twitter.images,
        site: assistantUrl,
      },
      other: {
        assistantName: title,
        assistantDescription: description,
        assistantImage: imageUrl,
      },
    };
  } catch (error) {
    console.error('Error fetching assistant details:', error);
    return {
      title: appTitle,
      description: 'Configure an executive assistant with advanced settings.',
      openGraph,
      twitter,
    };
  }
}

export default function ExecutiveAssistantConfigurePage({
  params,
}: {
  params: { networkName: string; assistantAddress: string };
}) {
  return (
    <ExecutiveAssistantConfigureClient
      networkName={params.networkName}
      assistantAddress={params.assistantAddress}
    />
  );
}
