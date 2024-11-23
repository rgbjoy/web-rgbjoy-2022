import { GlobalConfig } from 'payload'

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
    group: "Content",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'links',
      type: 'array',
      label: 'Links',
      minRows: 1,
      maxRows: 10,
      labels: {
        singular: 'Link',
        plural: 'Links',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
        },
        {
          name: 'link',
          type: 'text',
          hooks: {
            beforeValidate: [
              ({ value }) => {
                if (value && !value.startsWith('https://')) {
                  return `https://${value}`;
                }
                return value;
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