import { NextApiRequest, NextApiResponse } from 'next'
import { projectData } from '../../../utils/data'

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!Array.isArray(projectData)) {
      throw new Error('Cannot find project data')
    }

    res.status(200).json(projectData)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
