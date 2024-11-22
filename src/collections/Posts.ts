import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature, lexicalHTML, HTMLConverterFeature, HTMLConverter, SerializedBlockNode } from '@payloadcms/richtext-lexical'

const BlockHtmlConverter: HTMLConverter<SerializedBlockNode> = {
  converter({ node }) {
    switch (node.fields.blockType) {
      case "embed":
        const id = `embed-container-${node.fields.id}`
        const width = node.fields.width + "px" || 'auto'
        const height = node.fields.height + "px" || 'auto'
        return `
          <div class="embed" id="${id}" style="width:${width}; height:${height};">
            ${node.fields.embed_code}
          </div>
        `
      default:
        return `<span>unknown node.</span>`
    }
  },
  nodeTypes: ["block"],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    preview: (doc, { locale }) => {
      if (doc?.slug) {
        return `/posts/${doc.slug}?locale=${locale}`
      }

      return null
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'contentRichText',
      type: 'richText',
      label: 'Content',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [
              {
                slug: 'embed',
                fields: [
                  {
                    name: 'embed_code',
                    label: 'Embed Code',
                    type: 'textarea',
                  },
                  {
                    name: 'width',
                    label: 'Width',
                    type: 'text',
                  },
                  {
                    name: 'height',
                    label: 'Height',
                    type: 'text',
                  },
                ],
              },
            ],
          }),
          HTMLConverterFeature({
            converters: ({ defaultConverters }) => [
              ...defaultConverters,
              BlockHtmlConverter,
            ] as HTMLConverter[],
          }),
        ],
      }),
    },
    lexicalHTML('contentRichText', { name: 'contentRichText_html' }),
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}

export default Posts