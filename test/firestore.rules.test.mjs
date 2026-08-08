import fs from "node:fs/promises";
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, collectionGroup, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error("FIRESTORE_EMULATOR_HOST es obligatorio.");
const [host, portText] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
let environment;

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: "demo-dleon",
    firestore: {
      host,
      port: Number(portText),
      rules: await fs.readFile(new URL("../firestore.rules", import.meta.url), "utf8"),
    },
  });
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "productos/ropa/items/CKG0002"), { sku: "CKG0002", active: true });
    await setDoc(doc(db, "orders/ORDER-1"), { paymentStatus: "APPROVED", customer: { email: "privado@example.com" } });
    await setDoc(doc(db, "users/admin-1"), { uid: "admin-1", role: "admin", active: true });
    await setDoc(doc(db, "users/customer-1"), { uid: "customer-1", role: "customer", active: true });
    await setDoc(doc(db, "users/customer-2"), { uid: "customer-2", role: "customer", active: true });
  });
});

after(async () => environment?.cleanup());

test("productos activos son legibles públicamente pero nadie escribe directamente", async () => {
  const anonymous = environment.unauthenticatedContext().firestore();
  const admin = environment.authenticatedContext("admin-1").firestore();
  assert.equal((await assertSucceeds(getDoc(doc(anonymous, "productos/ropa/items/CKG0002")))).exists(), true);
  assert.equal((await assertSucceeds(getDocs(collectionGroup(anonymous, "items")))).size, 1);
  await assertFails(updateDoc(doc(anonymous, "productos/ropa/items/CKG0002"), { active: false }));
  await assertFails(updateDoc(doc(admin, "productos/ropa/items/CKG0002"), { active: false }));
});

test("pedidos y datos personales no pueden leerse ni escribirse desde clientes", async () => {
  const anonymous = environment.unauthenticatedContext().firestore();
  const customer = environment.authenticatedContext("customer-1").firestore();
  const admin = environment.authenticatedContext("admin-1").firestore();
  await assertFails(getDoc(doc(anonymous, "orders/ORDER-1")));
  await assertFails(getDocs(collection(customer, "orders")));
  await assertFails(getDocs(collection(admin, "orders")));
  await assertFails(setDoc(doc(customer, "orders/INJECTED"), { paymentStatus: "APPROVED" }));
});

test("usuario solo puede leer su propio perfil", async () => {
  const customer = environment.authenticatedContext("customer-1").firestore();
  const admin = environment.authenticatedContext("admin-1").firestore();
  await assertSucceeds(getDoc(doc(customer, "users/customer-1")));
  await assertFails(getDoc(doc(customer, "users/customer-2")));
  await assertSucceeds(getDoc(doc(admin, "users/customer-2")));
});

test("registro permite perfil customer propio pero impide autoasignarse admin", async () => {
  const newCustomer = environment.authenticatedContext("new-customer").firestore();
  await assertSucceeds(setDoc(doc(newCustomer, "users/new-customer"), {
    uid: "new-customer",
    email: "nuevo@example.com",
    name: "Nuevo",
    role: "customer",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const attacker = environment.authenticatedContext("attacker").firestore();
  await assertFails(setDoc(doc(attacker, "users/attacker"), {
    uid: "attacker",
    email: "atacante@example.com",
    name: "Atacante",
    role: "admin",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
});

test("cliente no puede elevar su rol mediante actualización", async () => {
  const customer = environment.authenticatedContext("customer-1").firestore();
  await assertFails(updateDoc(doc(customer, "users/customer-1"), { role: "admin" }));
  await assertSucceeds(updateDoc(doc(customer, "users/customer-1"), { name: "Nombre actualizado", updatedAt: new Date() }));
});
