import styles from "./page.module.css";
import VisitTracker from "@/components/VisitTracker";

export default function Home() {
  return (
    <div className={styles.container}>
      <VisitTracker />
      <h1 className={styles.artText}>Hello World</h1>
    </div>
  );
}
