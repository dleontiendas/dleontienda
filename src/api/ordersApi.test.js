import { createOrder } from "./ordersApi";
import { httpsCallable } from "firebase/functions";
jest.mock("../Firebase", () => ({ functions: {} }));
jest.mock("firebase/functions", () => ({ httpsCallable: jest.fn() }));
test("preserves backend accessToken so the checkout can query confirmed payment", async () => {
  httpsCallable.mockReturnValue(async () => ({ data: { orderId: "order1", accessToken: "private-token" } }));
  expect(await createOrder({})).toEqual({ id: "order1", accessToken: "private-token" });
});
