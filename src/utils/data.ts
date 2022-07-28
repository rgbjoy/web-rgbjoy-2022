import { Client, Project } from '../interfaces'

/** Dummy project data. */
export const clientData: Client[] = [
  {
    name: 'The New Republic',
    slug: 'the-newrepublic',
    time: '10.2018 - Present',
    title: 'Contract',
    description: "Worked closely with editorial and product teams to help build frontend and backend components, print-to-web features, animation, video editing, and building/designing the new redesign in 2020.",
    technology: ["React", "GraphQL", "Postres", "Sequalize", "Heroku"],
    images:[
      "https://d33wubrfki0l68.cloudfront.net/dd23708ebc4053551bb33e18b7174e73b6e1710b/dea24/static/images/wallpapers/shared-colors@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/49de349d12db851952c5556f3c637ca772745316/cfc56/static/images/wallpapers/bridge-02@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/594de66469079c21fc54c14db0591305a1198dd6/3f4b1/static/images/wallpapers/bridge-01@2x.png"
    ]
  },
  {
    name: 'Code & Theory',
    slug: 'code-theory',
    time: '10.2010 - 05.2016',
    title: 'Senior Designer & Developer',
    description: "Worked with creative directors on creating various web experiences for DPSG brands (Dr Pepper, Motts, etc.). Flash/HTML5 development for the websites, designed/built games, and various advertising elements.",
    technology: ["HMTL5", "Flash", "Greensock"],
    images:[
      "https://d33wubrfki0l68.cloudfront.net/dd23708ebc4053551bb33e18b7174e73b6e1710b/dea24/static/images/wallpapers/shared-colors@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/49de349d12db851952c5556f3c637ca772745316/cfc56/static/images/wallpapers/bridge-02@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/594de66469079c21fc54c14db0591305a1198dd6/3f4b1/static/images/wallpapers/bridge-01@2x.png"
    ]
  },
  {
    name: 'Mammoth Advertising',
    slug: 'mammoth-advertising',
    time: '05.2008 - 05.2010',
    title: 'Production Designer/Developer',
    technology: ["Flash", "Greensock"],
    description: "Worked with producers to build and design various web experiences for various film marketing. Flash development for the web and advertising, social media (custom myspace lol).",
    images:[
      "https://d33wubrfki0l68.cloudfront.net/dd23708ebc4053551bb33e18b7174e73b6e1710b/dea24/static/images/wallpapers/shared-colors@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/49de349d12db851952c5556f3c637ca772745316/cfc56/static/images/wallpapers/bridge-02@2x.png",
      "https://d33wubrfki0l68.cloudfront.net/594de66469079c21fc54c14db0591305a1198dd6/3f4b1/static/images/wallpapers/bridge-01@2x.png"
    ]
  },
]

export const projectData: Project[] = [
  {
    name: 'Great American Properties',
    link: 'https://greatamericanproperties.net/',
    description: 'Branding, design, and Wordpress development',
  },
  {
    name: 'The Laughing Dog Gallery',
    link: 'https://thelaughingdoggallery.com/',
    description: 'Branding, design, and development',
  },
  {
    name: 'Open Resources',
    link: 'https://openupresources.org/',
    description: 'Wordpress development',
  },
  {
    name: 'Clemens Bruns Schaub',
    link: 'https://cbsarchs.com/',
    description: 'Branding, design, and Wordpress development',
  },
  {
    name: 'Orchid Island Brewery',
    link: 'https://www.instagram.com/p/CI1afnUHiZa/',
    description: 'Branding',
  },
  {
    name: 'Empower Artists',
    link: 'https://empowerartists.com/',
    description: 'Wordpress development',
  },
]
