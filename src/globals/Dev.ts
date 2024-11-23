import { GlobalConfig } from 'payload'

export const Dev: GlobalConfig = {
  slug: 'dev',
  label: 'Dev Page',
  typescript: {
    interface: 'Dev',
  },
  graphQL: {
    name: 'Dev',
  },
  admin: {
    group: "Content",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'content',
      type: 'richText',
      label: 'Page Content',
    },
    {
      name: 'pastProjects',
      type: 'array',
      label: 'Past Projects',
      labels: {
        singular: 'Project',
        plural: 'Projects',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'link',
          type: 'group',
          fields: [
            {
              name: 'url',
              type: 'text',
              required: true,
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
            },
          ],
        },
        {
          name: 'description',
          type: 'textarea',
        },
      ],
    },
  ],
}
