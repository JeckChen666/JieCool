import styles from "./page.module.css";
import VisitTracker from "@/components/features/visit/VisitTracker";
import DailySentence from "@/components/features/daily/DailySentence";

export default function Home() {
  return (
    <div className={styles.container}>
      <VisitTracker />
      <DailySentence />
    </div>
  );
}
