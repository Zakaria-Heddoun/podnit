export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Podnit',
    url: 'http://podnit.com',
    logo: 'http://podnit.com/images/podnitlogo.png',
    description: 'Print on demand platform for custom t-shirts, hoodies, and apparel',
    sameAs: [
      'https://www.facebook.com/podnit',
      'https://twitter.com/podnit',
      'https://www.instagram.com/podnit',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@podnit.com',
    },
  };
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Podnit',
    url: 'http://podnit.com',
    description: 'Print on demand platform for creating and selling custom products',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'http://podnit.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'MAD',
      availability: 'https://schema.org/InStock',
    },
  };
}
