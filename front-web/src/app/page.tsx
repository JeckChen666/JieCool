import styles from "./page.module.css";
import VisitTracker from "@/components/VisitTracker";
import DailySentence from "@/components/DailySentence";

export default function Home() {
  return (
    <div className={styles.container}>
      <VisitTracker />
      <DailySentence />
    </div>
  );
}
