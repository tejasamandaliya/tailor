import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class CustomPrismaSessionStorage {
  async storeSession(session) {
    try {
      console.log("Session data to store:", JSON.stringify(session, null, 2));

      const data = {
        shopifySessionId: session.id,
        shop: session.shop,
        state: session.state,
        isOnline: session.isOnline,
        scope: session.scope,
        expires: session.expires ? new Date(session.expires) : null,
        accessToken: session.accessToken,
        userId: session.userId ? BigInt(session.userId) : null,
        email: session.email,
        locale: session.locale,
        collaborator: session.collaborator,
        emailVerified: session.emailVerified,
        name: session.name,
        planDisplayName: session.planDisplayName,
        planShopifyPlus: session.planShopifyPlus,
        contactEmail: session.contactEmail,
        shopId: session.shopId,
        shopCreatedAt: session.createdAt || null,
        timezoneAbbreviation: session.timezoneAbbreviation,
      };

      console.log("Data prepared for upsert:", JSON.stringify(data, null, 2));

      const savedSession = await prisma.session.upsert({
        where: { shopifySessionId: session.id },
        update: data,
        create: data,
      });

      console.log("Stored session:", savedSession);
      return true;
    } catch (error) {
      console.error("Error storing session:", error);
      return false;
    }
  }

  async loadSession(id) {
    try {
      const sessionRecord = await prisma.session.findUnique({
        where: { shopifySessionId: id },
      });

      if (!sessionRecord) return undefined;

      const session = {
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

      // Add isActive() method to the session object
      session.isActive = function () {
        return this.accessToken && (!this.expires || this.expires > new Date());
      };

      console.log("Loaded session:", session);
      return session;
    } catch (error) {
      console.error("Error loading session:", error);
      return undefined;
    }
  }

  async deleteSession(id) {
    try {
      await prisma.session.delete({
        where: { shopifySessionId: id },
      });
      console.log(`Deleted session with shopifySessionId: ${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  async deleteSessions(ids) {
    try {
      await prisma.session.deleteMany({
        where: { shopifySessionId: { in: ids } },
      });
      console.log(`Deleted sessions with shopifySessionIds: ${ids}`);
      return true;
    } catch (error) {
      console.error("Error deleting sessions:", error);
      return false;
    }
  }
}
