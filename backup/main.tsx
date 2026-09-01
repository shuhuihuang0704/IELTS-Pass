import { createRoot } from "react-dom/client";
import IeltsApp from "../app/IeltsApp";
import PwaSupport from "../app/PwaSupport";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("IELTS Pass root element is missing");

createRoot(root).render(<><IeltsApp /><PwaSupport /></>);
