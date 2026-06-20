import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "yahoo-finance2", "nodemailer"],
};

export default nextConfig;
