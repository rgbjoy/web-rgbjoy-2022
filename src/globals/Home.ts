import { GlobalConfig } from 'payload'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Home Page',
  typescript: {
    interface: 'Home',
  },
  graphQL: {
    name: 'Home',
  },
  admin: {
    group: 'Content',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'header',
      type: 'text',
      label: 'Header',
    },
    {
      name: 'subhead',
      type: 'text',
      label: 'Subheading',
    },
    {
      name: 'intro',
      type: 'textarea',
      label: 'Introduction',
    },
    {
      name: 'button',
      type: 'text',
      label: 'Button Text',
    },
  ],
}
