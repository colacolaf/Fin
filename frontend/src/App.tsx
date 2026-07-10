import { useEffect, useState } from "react";
import { API_BASE, BACKEND_PORT } from "@fin/shared";
import type { HealthResponse } from "@fin/shared";
import "./App.css";

const API_URL = `http://localhost:${BACKEND_PORT}${API_BASE}`;

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Fin</h1>
      {error && <p className="error">Error: {error}</p>}
      {health && <p>Backend: {health.status}</p>}
      {!health && !error && <p>Connecting...</p>}
    </main>
  );
}

export default App;