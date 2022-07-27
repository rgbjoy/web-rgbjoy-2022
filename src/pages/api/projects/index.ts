import { NextApiRequest, NextApiResponse } from 'next'
import { sampleProjectData } from '../../../utils/sample-data'

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!Array.isArray(sampleProjectData)) {
      throw new Error('Cannot find project data')
    }

    res.status(200).json(sampleProjectData)
  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
