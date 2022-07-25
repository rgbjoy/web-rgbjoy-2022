import styles from './layout.module.scss';
import utilStyles from '../styles/utils.module.scss';
import Link from 'next/link';

const name = 'RGBJOY';

export default function Header() {
  return (
    <header className={styles.header}>
      <>
        <h2 className={utilStyles.headingLg}>
          <Link href="/">
            <a className={utilStyles.colorInherit}>{name}</a>
          </Link>
        </h2>
      </>
    </header>
  );
}