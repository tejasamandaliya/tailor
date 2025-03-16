import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import shopify, { getShopifySession } from "../shopify.server";

// export async function loader({ request }) {
//   const shop = (await shopify.session.getCurrent({ request })).shop;
//   const session = await getSession(shop);
//   if (!session) {
//     throw new Response("Session not found", { status: 404 });
//   }
//   return json({ session });
// }
export async function loader({ request }) {
  // Extract shop from request headers or URL (example assumes header)
  const shop =
    new URL(request.url).searchParams.get("shop") ||
    request.headers.get("x-shopify-shop-domain");
  if (!shop) {
    throw new Response("Shop not found in request", { status: 400 });
  }

  const session = await getShopifySession(shop);
  if (!session) {
    throw new Response("Session not found", { status: 404 });
  }

  return json({ shop: session.shop });
}

export default function Index() {
  const { session } = useLoaderData();
  return (
    <div>
      <h1>Welcome to {session.name}</h1>
      <p>Email: {session.email}</p>
      <p>Plan: {session.planDisplayName}</p>
    </div>
  );
}
