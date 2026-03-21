const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL não definida");
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("admin_token")
      : null;

  /**
   * usamos Record<string,string>
   * para permitir indexação segura
   */
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  /**
   * headers adicionais
   */
  if (options?.headers && typeof options.headers === "object") {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  /**
   * token JWT
   */
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {

    if (response.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }

    let message = "API error";

    try {
      const errorData = await response.json();

      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "message" in errorData
      ) {
        message = String((errorData as { message: unknown }).message);
      }

    } catch {
      // fallback silencioso
    }

    throw new Error(message);
  }

  const data = (await response.json()) as T;

  return data;
}