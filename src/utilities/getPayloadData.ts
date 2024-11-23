export async function getData(query: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_CMS_URL}/api/graphql`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
      }),
      next: { tags: ['footer'] }, // Optional: For Next.js cache tagging
    }
  )

  if (!response.ok) {
    throw new Error('Failed to fetch data')
  }

  return response.json()
}
