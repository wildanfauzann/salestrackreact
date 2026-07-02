import { hashPassword } from "better-auth/utils";
async function main() {
  const hash = await hashPassword("mysecretpassword");
  console.log("HASH:", hash);
  process.exit(0);
}
main();
