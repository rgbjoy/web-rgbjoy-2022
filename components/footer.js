import styles from './layout.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="social">
        <a href="https://instagram.com/rgbjoy" target="_blank" rel="noopener noreferrer nofollow">Instagram</a>
        <a href="https://www.linkedin.com/in/rgbjoy/" target="_blank" rel="noopener noreferrer nofollow">Linkedin</a>
        <a href="https://twitter.com/rgbjoy" target="_blank" rel="noopener noreferrer nofollow">Twitter</a>
      </div>
      <div className="copyright">&copy; 2022 Tom Fletcher. All rights reserved.</div>
    </footer>
  );
}