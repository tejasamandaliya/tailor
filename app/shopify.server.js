import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { SHOP_QUERY } from "./graphql"; // Import Shop's data from graphql query after installation

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: null, // Still used for retrieval
  //sessionStorage: new PrismaSessionStorage(prisma), // Still used for retrieval
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  // Explicitly request an online token
  isEmbeddedApp: true,
  auth: {
    offline: {
      accessMode: "offline", // Offline token for shop-level access
      scopes: process.env.SCOPES?.split(",") || ["read_products", "read_shop"],
    },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      try {
        const response = await admin.graphql(SHOP_QUERY);
        const { data } = await response.json();
        const shop = data.shop;

        console.log("Shop data from GraphQL:", shop);

        const savedSession = await prisma.session.upsert({
          where: { shopifySessionId: session.id },
          update: {
            shop: session.shop,
            state: session.state,
            isOnline: session.isOnline,
            scope: session.scope,
            expires: session.expires,
            accessToken: session.accessToken,
            email: shop.email,
            locale: session.locale,
            collaborator: session.collaborator,
            emailVerified: session.emailVerified,
            name: shop.name,
            planDisplayName: shop.plan.displayName,
            planShopifyPlus: shop.plan.shopifyPlus,
            planPartnerDevelopment: shop.plan.partnerDevelopment,
            contactEmail: shop.contactEmail,
            shopId: shop.id.split("/").pop(),
            createdAt: shop.createdAt ? new Date(shop.createdAt) : null,
            timezoneAbbreviation: shop.timezoneAbbreviation,
          },
          create: {
            shopifySessionId: session.id,
            shop: session.shop,
            state: session.state,
            isOnline: session.isOnline,
            scope: session.scope,
            expires: session.expires,
            accessToken: session.accessToken,
            email: shop.email,
            locale: session.locale,
            collaborator: session.collaborator,
            emailVerified: session.emailVerified,
            name: shop.name,
            planDisplayName: shop.plan.displayName,
            planShopifyPlus: shop.plan.shopifyPlus,
            planPartnerDevelopment: shop.plan.partnerDevelopment,
            contactEmail: shop.contactEmail,
            shopId: shop.id.split("/").pop(),
            createdAt: shop.createdAt ? new Date(shop.createdAt) : null,
            timezoneAbbreviation: shop.timezoneAbbreviation,
          },
        });

        console.log("Session saved with auto-incremented ID:", savedSession);
      } catch (error) {
        console.error("Error in afterAuth hook:", error);
      }
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
export { prisma };

// Custom session retrieval function
export async function getSession(shop) {
  const session = await prisma.session.findFirst({
    where: { shop },
    orderBy: { id: "desc" }, // Get the latest session for the shop
  });
  return session;
}
