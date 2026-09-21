// src/api/client.ts
const API_BASE_URL = "http://localhost:8000/api/";

export async function fetchStandardRecommendation(query: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch recommendation:", error);
    throw error;
  }
}