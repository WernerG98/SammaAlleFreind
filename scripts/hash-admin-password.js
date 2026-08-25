import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Nutzung: npm run seed:admin -- <dein-passwort>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log("\nADMIN_PASSWORD_HASH:");
console.log(hash);
console.log("\nDiesen Wert als Env-Var ADMIN_PASSWORD_HASH eintragen (lokal in .env, produktiv bei Vercel).\n");
