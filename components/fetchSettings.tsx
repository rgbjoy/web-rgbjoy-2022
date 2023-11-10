import { getData } from "@/utilities/getData";

export async function fetchSettings() {
  const query = `
    query GetOptions {
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