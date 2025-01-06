import React from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from '@chakra-ui/react';

// Define the interface for a single breadcrumb item
interface BreadcrumbItemProps {
  name: string;
  href: string;
}

// Define the props for the Breadcrumbs component
interface BreadcrumbsProps {
  items: BreadcrumbItemProps[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => (
  <Breadcrumb
    separator="/"
    color="uap.orange"
    fontFamily="Tomorrow"
    fontWeight={600}
  >
    {items.map((item, index) => (
      <BreadcrumbItem key={index} isCurrentPage={index === items.length - 1}>
        <BreadcrumbLink href={item.href}>{item.name}</BreadcrumbLink>
      </BreadcrumbItem>
    ))}
  </Breadcrumb>
);

export default Breadcrumbs;
