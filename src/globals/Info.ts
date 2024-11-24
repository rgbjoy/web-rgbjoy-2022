import { GlobalConfig } from 'payload'
import {
  lexicalEditor,
  HTMLConverterFeature,
  lexicalHTML,
} from '@payloadcms/richtext-lexical'
import { revalidateGlobal } from '../hooks/revalidateGlobal'

export const Info: GlobalConfig = {
  slug: 'info',
  label: 'Info Page',
  typescript: {
    interface: 'Info',
  },
  graphQL: {
    name: 'Info',
  },
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: 'header',
      type: 'text',
      label: 'Page Title',
    },
    {
      name: 'profileImage',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      labels: {
        singular: 'Link',
        plural: 'Links',
      },
      fields: [
        {
          name: 'link',
          type: 'group',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'url',
              type: 'text',
              required: true,
              hooks: {
                beforeValidate: [
                  ({ value }) => {
                    if (!value) return value
                    if (value.startsWith('mailto:')) return value
                    if (!value.startsWith('https://')) {
                      return `https://${value}`
                    }
                    return value
                  },
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Page Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          HTMLConverterFeature({}),
        ],
      }),
    },
    lexicalHTML('content', { name: 'content_html' }),
    {
      name: 'strengths',
      type: 'array',
      label: 'Strengths Sections',
      labels: {
        singular: 'Strength Section',
        plural: 'Strength Sections',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'strengthsList',
          type: 'text',
          label: 'Strengths',
          required: true,
        },
      ],
    },
  ],
}
