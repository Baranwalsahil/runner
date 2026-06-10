import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function Fab({ to = "/dashboard", label = "Start Session" }) {
  const navigate = useNavigate();
  return (
    <button
      data-testid="fab"
      onClick={() => navigate(to)}
      className="fixed bottom-md right-md bg-primary-fixed text-on-primary-fixed p-md shadow-[0_0_25px_rgba(195,244,0,0.4)] [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,12px_100%,0_calc(100%-12px))] hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group"
    >
      <Icon name="add" className="text-3xl" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-hud-mono font-bold uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
