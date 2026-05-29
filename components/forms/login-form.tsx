"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md"
    >
      <h1 className="text-3xl font-bold mb-6 text-center">
        Quinquenios UIS
      </h1>

      <div className="mb-4">
        <label className="block mb-2 font-medium">
          Correo
        </label>

        <input
          type="email"
          className="w-full border rounded-lg p-3"
          placeholder="correo@evento.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">
          Contraseña
        </label>

        <input
          type="password"
          className="w-full border rounded-lg p-3"
          placeholder="********"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}