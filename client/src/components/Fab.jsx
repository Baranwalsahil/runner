import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function Fab({ to = "/dashboard", label = "Start Session" }) {
  const navigate = useNavigate();
  return (
    <button
      data-testid="fab"
      onClick={() => navigate(to)}
      className="fixed bottom-md right-md bg-secondary-container text-on-secondary p-md rounded-full shadow-[0_0_30px_rgba(0,219,233,0.45)] hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group"
    >
      <Icon name="add" className="text-3xl" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-scifi font-medium uppercase tracking-[0.15em] whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
