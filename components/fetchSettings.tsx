import { getData } from "@/utilities/getData";
import { SiteSettings } from '@/models/types';

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
          home {
            homeHeader
            homeSubhead
            intro
            buttonText
          }
        }
      }
    }
  `;
  const response = await getData(query);
  const options:SiteSettings = response.data.siteSettings.options;
  return options;
}