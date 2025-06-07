import { auth } from "./firebase";

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Increased retry logic for auth state
  let retries = 10; // Increased from 3 to 10
  let waitTime = 100;

  while (retries > 0) {
    const user = auth.currentUser;

    if (user) {
      try {
        console.log("Making authenticated request to:", url);
        // Force token refresh to avoid stale token issues
        const token = await user.getIdToken(true);
        console.log("Got auth token, length:", token.length);

        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
          ...options.headers,
        };

        // Only set Content-Type for non-FormData requests
        if (!(options.body instanceof FormData)) {
          (headers as Record<string, string>)["Content-Type"] =
            "application/json";
        }

        const response = await fetch(url, {
          ...options,
          headers,
        });

        console.log("Response status:", response.status);
        return response;
      } catch (error) {
        console.error("Error making authenticated request:", error);
        // If it's a permission error, try refreshing the token once more
        if (error instanceof Error && error.message.includes("permission")) {
          console.log("Attempting token refresh due to permission error...");
          try {
            await user.getIdToken(true); // Force refresh
            retries--; // Retry with fresh token
            continue;
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
          }
        }
        throw error;
      }
    }

    console.log("Waiting for auth state, retries left:", retries);
    // Wait progressively longer for auth state to be ready
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    waitTime = Math.min(waitTime * 1.2, 1000); // Progressive backoff, max 1 second
    retries--;
  }

  console.error("Authentication failed - no user found after retries");
  throw new Error("User not authenticated or auth state not ready");
}

export async function authenticatedJsonFetch(
  url: string,
  options: RequestInit = {}
): Promise<unknown> {
  try {
    console.log("Starting authenticatedJsonFetch for:", url);
    const response = await authenticatedFetch(url, options);

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      const errorData = await response
        .json()
        .catch(() => ({ error: "Request failed" }));
      throw new Error(
        errorData.error || `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Successfully got JSON response");
    return data;
  } catch (error) {
    console.error("Error in authenticatedJsonFetch:", error);
    throw error;
  }
}
