import { GlobalConfig } from 'payload'
import { revalidateGlobal } from '../hooks/revalidateGlobal'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  typescript: {
    interface: 'Footer',
  },
  graphQL: {
    name: 'Footer',
  },
  admin: {
    group: 'Site Settings',
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  fields: [
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      minRows: 1,
      maxRows: 4,
      labels: {
        singular: 'Link',
        plural: 'Links',
      },
      admin: {
        components: {
          RowLabel: '../components/RowLabel',
        },
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'link',
          type: 'text',
          hooks: {
            beforeValidate: [
              ({ value }) => {
                if (value && !value.startsWith('https://')) {
                  return `https://${value}`
                }
                return value
              },
            ],
          },
          admin: {
            placeholder: 'https://',
          },
        },
      ],
    },
  ],
}
