import { auth } from './src/auth';

async function main() {
  try {
    const res = await auth.api.setPassword({
      body: {
        newPassword: 'mysecretpassword123',
        userId: 'm6C2L85PJXyZDYuCaPPL0QGnptyqLpJH'
      },
      headers: new Headers()
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
main();
