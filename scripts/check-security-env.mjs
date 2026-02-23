import "dotenv/config";

const requireBasicAuth =
  process.env.REQUIRE_BASIC_AUTH === "1" || process.argv.includes("--require-basic-auth");

const required = ["TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN"];
if (requireBasicAuth) {
  required.push("APP_BASIC_AUTH_USER", "APP_BASIC_AUTH_PASS");
}

const missing = required.filter((key) => {
  const value = process.env[key];
  return !value || value.trim().length === 0;
});

if (missing.length > 0) {
  console.error("Missing required security environment variables:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log("Security env check passed.");
