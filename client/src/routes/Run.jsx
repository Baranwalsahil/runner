import { useEffect } from "react";
import RunTracker from "../components/run/RunTracker.jsx";

export default function Run() {
  useEffect(() => {
    document.title = "Territory Run — Session";
  }, []);
  return <RunTracker />;
}
