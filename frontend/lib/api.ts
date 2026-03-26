export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("bs_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  /**
   * merge headers externos
   */
  if (options?.headers) {
    const extraHeaders =
      options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string>);

    Object.assign(headers, extraHeaders);
  }

  /**
   * auth
   */
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  /**
   * tratamento profissional de erro
   */
  if (!response.ok) {
    let message = "Erro na API";

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
