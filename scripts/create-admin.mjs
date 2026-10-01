// Creates (or resets) an admin account. Usage:
//   node --env-file=.env.local scripts/create-admin.mjs admin@example.com "Full Name"
// Prompts for the password (min 12 chars) so it never lands in shell history.
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { MongoClient } from "mongodb";

const [email, name = "Admin"] = process.argv.slice(2);
if (!email || !process.env.MONGODB_URI) {
  console.error("Usage: node --env-file=.env.local scripts/create-admin.mjs <email> [name]  (MONGODB_URI required)");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = process.env.ADMIN_PASSWORD ?? (await rl.question("Password (min 12 chars): "));
rl.close();
if (password.length < 12) {
  console.error("Password must be at least 12 characters.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = await new Promise((res, rej) =>
  scrypt(password.normalize("NFKC"), salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))),
);
const passwordHash = ["scrypt", 16384, 8, 1, salt.toString("base64"), hash.toString("base64")].join("$");

const client = await new MongoClient(process.env.MONGODB_URI).connect();
const users = client.db(process.env.MONGODB_DB ?? "badminton").collection("users");
await users.createIndex({ email: 1 }, { unique: true });
await users.updateOne(
  { email: email.trim().toLowerCase() },
  { $set: { name, role: "admin", passwordHash }, $setOnInsert: { createdAt: new Date() } },
  { upsert: true },
);
console.log(`Admin ready: ${email.trim().toLowerCase()}`);
await client.close();
