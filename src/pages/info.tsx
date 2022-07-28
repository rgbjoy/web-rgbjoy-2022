import Image from 'next/image'
import Head from 'next/head'
import Layout from '../components/Layout';
import style from './info.module.scss'
import selfie from '../../public/selfie.jpg'

const Info = () => (
  <Layout page="info">
    <Head><title>Info</title></Head>
    <div className={style.selfie}>
      <h1>— Info</h1>
      <div className={style.selfieWrapper}>
        <Image
          alt="Selfie"
          src={selfie}
          layout="responsive"
          width={640}
          height={1004}
        />
      </div>
    </div>

    <p><a href="m&#97;ilto&#58;%74%&#54;F%6&#68;&#37;40&#114;gbjoy&#46;co&#109;">Email</a> — <a href="">Résumé</a> — <a href="https://www.linkedin.com/in/rgbjoy/" target="_blank" rel="noreferrer">Linkedin</a></p>

    <p>
      I&apos;m currently working freelance with <a href="https://newrepublic.com/" target="_blank" rel="noreferrer">The New Republic</a>. I&apos;m based in Vero Beach, FL. My passion lies in web development, design, 3D, game design, motion, and technology. When I
      get the chance to get off a computer, I&apos;m either surfing or traveling for surf.
    </p>

    <div className={style.strengths}>
      <div>Development</div>
      <div className={style.detail}>React, Next.js, GraphQL, Sequelize, Postgres, ThreeJS, Greensock, Heroku, Vercel, Docker, Imgix, Processing, Unity / C#</div>
    </div>

    <div className={style.strengths}>
      <div>Creative</div>
      <div className={style.detail}>Cinema 4D with Octane renderer, After Effects, Photoshop, Illustrator, Figma, XD, and Asana</div>
    </div>
  </Layout>
)

export default Info
