import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { Toaster } from "react-hot-toast";

export function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route index element={<Dashboard />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
