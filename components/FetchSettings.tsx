import { getData } from "@/utilities/getData";

export async function fetchSettings() {
  'use server'
  const query = `
    query GetDev {
      siteSettings {
        options {
          footerLinks {
            link {
              title
              url
            }
          }
          badge
        }
      }
    }
  `;
  const { data: {siteSettings: { options } } } = await getData(query);
  return options;
}