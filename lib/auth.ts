export function usernameToEmail(username: string) {
  const domain = process.env.NEXT_PUBLIC_USERNAME_EMAIL_DOMAIN || "sanmartin.local";
  const u = (username || "").trim().toLowerCase();
  return u ? `${u}@${domain}` : "";
}
