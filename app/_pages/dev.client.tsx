"use client"

import PageWrapper from '@/components/pageWrapper';
import style from "./dev.module.scss"
import { SplitText } from '@/components/splitText';
import { DevData } from 'models/types';

export default function Dev(data: { page: DevData }) {

  const {
    page: { dev },
  } = data;

  const GetProjects = () => {
    return (
      <ul className={style.list}>
        {dev.pastProjects?.map((value, i) => {
          const title = value["title"];
          const description = value["description"];
          const link = value["link"]["url"];

          return (
            <li className={style.item} key={"projects" + i}>
              <a className="link" href={link} target="_blank" rel="noreferrer">
                <div className={style.name}>{title}</div>
                <div className={style.description}>{description}</div>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <PageWrapper className={style.dev}>
      <h1 className={style.header}>
        <SplitText>
          Development
        </SplitText>
      </h1>

      <div dangerouslySetInnerHTML={{ __html: data.page.content }} />

      <h2 className={style.sectionTitle}>Projects</h2>
      <GetProjects />

    </PageWrapper>
  )
}