import "@shopify/shopify-app-remix/server/adapters/node";
import {
  shopifyApp,
  ApiVersion,
  AppDistribution,
} from "@shopify/shopify-app-remix/server";
import { CustomPrismaSessionStorage } from "./session-storage";
import { PrismaClient } from "@prisma/client";
import { SHOP_QUERY } from "./graphql";

const prisma = new PrismaClient();
const sessionStorage = new CustomPrismaSessionStorage();

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(",") || ["read_products"],
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage,
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  isEmbeddedApp: true,
  auth: {
    offline: {
      accessMode: "offline",
      scopes: process.env.SCOPES?.split(",") || ["read_products"],
    },
  },
  hooks: {
    afterAuth: async ({ session, admin }) => {
      try {
        const response = await admin.graphql(SHOP_QUERY);
        const { data } = await response.json();
        const shop = data.shop;

        console.log("Shop data from GraphQL:", shop);

        // Add shop data to the session object with validation
        session.email = shop.email || null;
        session.name = shop.name || null;
        session.planDisplayName = shop.plan?.displayName || null;
        session.planShopifyPlus = shop.plan?.shopifyPlus ?? false;
        session.contactEmail = shop.contactEmail || null;
        session.shopId = shop.id ? shop.id.split("/").pop() : null;
        session.shopCreatedAt = shop.createdAt
          ? new Date(shop.createdAt)
          : null;
        session.timezoneAbbreviation = shop.timezoneAbbreviation || null;

        await sessionStorage.storeSession(session);
        console.log("Session saved with custom storage:", session);
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
export { sessionStorage };
export { prisma };

export async function getShopifySession(shop) {
  const sessionRecord = await prisma.session.findFirst({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (!sessionRecord) return undefined;

  return {
    id: sessionRecord.shopifySessionId,
    shop: sessionRecord.shop,
    state: sessionRecord.state,
    isOnline: sessionRecord.isOnline,
    scope: sessionRecord.scope,
    expires: sessionRecord.expires,
    accessToken: sessionRecord.accessToken,
    userId: sessionRecord.userId?.toString(),
    email: sessionRecord.email,
    locale: sessionRecord.locale,
    collaborator: sessionRecord.collaborator,
    emailVerified: sessionRecord.emailVerified,
    name: sessionRecord.name,
    planDisplayName: sessionRecord.planDisplayName,
    planShopifyPlus: sessionRecord.planShopifyPlus,
    contactEmail: sessionRecord.contactEmail,
    shopId: sessionRecord.shopId,
    shopCreatedAt: sessionRecord.shopCreatedAt,
    createdAt: sessionRecord.createdAt,
    timezoneAbbreviation: sessionRecord.timezoneAbbreviation,
  };
}
