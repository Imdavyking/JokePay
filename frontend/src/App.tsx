import "./App.css";
import NavHeader from "./components/NavHeader";
import Router from "./router";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import ChatBot from "./components/chat-bot/Main.tsx";

function App() {
  return (
    <>
      <ToastContainer />
      <BrowserRouter>
        <ChatBot />
        <NavHeader />
        <Router />
      </BrowserRouter>
    </>
  );
}

export default App;
