export const getData = async (query, variables = {}) => {
  const wordpressApiUrl = process.env.WORDPRESS_API_URL;

  if (!wordpressApiUrl) {
    throw new Error('WORDPRESS_API_URL is not defined');
  }
  const response = await fetch(wordpressApiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  return response.json();
}