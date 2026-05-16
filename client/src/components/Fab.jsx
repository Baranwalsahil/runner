import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";

export default function Fab({ to = "/dashboard", label = "Start Session" }) {
  const navigate = useNavigate();
  return (
    <button
      data-testid="fab"
      onClick={() => navigate(to)}
      className="fixed bottom-md right-md bg-primary-fixed text-on-primary-fixed p-md rounded-full shadow-xl hover:scale-110 active:scale-95 transition-all z-50 flex items-center justify-center group"
    >
      <Icon name="add" className="text-3xl" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-label-bold uppercase whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
