import { NextApiRequest, NextApiResponse } from 'next'
import { clientData } from '../../../data/client'

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!Array.isArray(clientData)) {
      throw new Error('Cannot find project data')
    }

    res.status(200).json(clientData)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
