import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {

  const { path, token } = req.query

  if ((token as string) !== process.env.REVALIDATION_TOKEN) {
    return res.status(401).json({message: "Invalid token"})
  } else if ((path as string).length === 0) {
    return res.status(401).json({message: "Path is required"})
  }

  try {
    await res.revalidate(path as string)
  } catch (err) {
    return res.status(500).send("Error revalidating page")
  }

  return res.status(200).json({
    revalidated: true,
    message: `Path ${path} revalidated successfully`
  })

}