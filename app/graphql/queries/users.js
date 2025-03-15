// GraphQL query to fetch current user details
export const CURRENT_USER_QUERY = `
  query {
    currentUser {
      id
      firstName
      lastName
      email
      emailVerified
      locale
      isAccountOwner
    }
  }
`;

// Optional: Add more user-related queries here
export const ALL_USERS_QUERY = `
  query {
    users(first: 1) {
      edges {
        node {
          id
          firstName
          lastName
          email
          emailVerified
          locale
          isAccountOwner
        }
      }
    }
  }
`;

// TODO this way you can dynamically get fields as well
// export const USER_FIELDS_FRAGMENT = `
//   fragment UserFields on User {
//     id
//     firstName
//     lastName
//     email
//     emailVerified
//     locale
//     isAccountOwner
//   }
// `;

// export const CURRENT_USER_QUERY = `
//   ${USER_FIELDS_FRAGMENT}
//   query {
//     currentUser {
//       ...UserFields
//     }
//   }
// `;
