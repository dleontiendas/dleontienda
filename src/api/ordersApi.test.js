import { createOrder, revokeOrderMetaConsent } from "./ordersApi";
import { httpsCallable } from "firebase/functions";
jest.mock("../Firebase", () => ({ functions: {} }));
jest.mock("firebase/functions", () => ({ httpsCallable: jest.fn() }));
test("preserves backend accessToken so the checkout can query confirmed payment", async () => {
  const metaPayment = { eventId: "payment:order1", data: { content_ids: ["v:SKU"] } };
  httpsCallable.mockReturnValue(async () => ({ data: { orderId: "order1", accessToken: "private-token", metaPayment } }));
  expect(await createOrder({})).toEqual({ id: "order1", accessToken: "private-token", metaPayment });
});

test("revokes server-side Meta consent using the private order token", async () => {
  const callable = jest.fn(async () => ({ data: { success: true, alreadySent: false } }));
  httpsCallable.mockReturnValue(callable);
  await expect(revokeOrderMetaConsent("order1", "private-token")).resolves.toEqual({ success: true, alreadySent: false });
  expect(httpsCallable).toHaveBeenCalledWith({}, "revokeOrderMetaConsent");
  expect(callable).toHaveBeenCalledWith({ orderId: "order1", accessToken: "private-token" });
});
