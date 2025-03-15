export const SHOP_QUERY = `
  query {
    shop {
      name
      email
      plan {
        displayName
        shopifyPlus
        partnerDevelopment
      }
      contactEmail
      id
      createdAt
      timezoneAbbreviation
    }
  }
`;
