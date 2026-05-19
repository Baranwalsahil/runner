import { Outlet, useLocation } from "react-router-dom";
import TopNavBar from "./TopNavBar.jsx";
import AlertBar from "./AlertBar.jsx";
import Footer from "./Footer.jsx";
import Fab from "./Fab.jsx";

export default function AppLayout() {
  const { pathname } = useLocation();
  const alertMessage =
    pathname === "/dashboard"
      ? "SECTOR B-4: CONTESTED BY @RUNNER_X"
      : null;

  return (
    <>
      <TopNavBar />
      <AlertBar message={alertMessage} ctaLabel={alertMessage ? "RECLAIM" : undefined} />
      <main className="pt-28 pb-xl">
        <Outlet />
      </main>
      <Footer />
      <Fab to="/dashboard" />
    </>
  );
}
