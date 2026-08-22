import Cookies from "js-cookie";

const TOKEN_COOKIE = "gt_token";
const TOKEN_TTL_DAYS = 7;

export function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return Cookies.get(TOKEN_COOKIE);
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, { expires: TOKEN_TTL_DAYS, sameSite: "lax", path: "/" });
}

export function clearToken(): void {
  Cookies.remove(TOKEN_COOKIE, { path: "/" });
}

export { TOKEN_COOKIE };
