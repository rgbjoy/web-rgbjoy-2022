"use server"
export const getData = async (query, variables = {}) => {
  const wordpressApiUrl = process.env.WORDPRESS_API_URL;

  try {
    if (!wordpressApiUrl) {
      throw new Error('WORDPRESS_API_URL is not defined');
    }

    const response = await fetch(wordpressApiUrl, {
      next: { revalidate: 3600 },
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status code ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}