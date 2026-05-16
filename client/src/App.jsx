import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import Landing from "./routes/Landing.jsx";
import Dashboard from "./routes/Dashboard.jsx";
import Battlefield from "./routes/Battlefield.jsx";
import Leaderboard from "./routes/Leaderboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/battlefield" element={<Battlefield />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
