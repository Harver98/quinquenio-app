"use client";

import { useState } from "react";

export default function InscritoForm() {
  const [acompanantes, setAcompanantes] = useState(0);
  const [tipo, setTipo] = useState("socio");
  const [botonExtra, setBotonExtra] = useState(false);

  const total =
    (tipo === "socio" ? 100000 : 150000) +
    acompanantes * 80000 +
    (botonExtra ? 15000 : 0);

  return (
    <form className="bg-white p-6 rounded-xl shadow-md space-y-4 max-w-3xl">
      <input
        placeholder="Nombre"
        className="w-full border p-3 rounded-lg"
      />

      <input
        placeholder="Cédula"
        className="w-full border p-3 rounded-lg"
      />

      <input
        placeholder="Correo"
        className="w-full border p-3 rounded-lg"
      />

      <select
        className="w-full border p-3 rounded-lg"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
      >
        <option value="socio">
          Egresado Socio ASEDUIS
        </option>

        <option value="nosocio">
          Egresado No Socio
        </option>
      </select>

      <input
        type="number"
        placeholder="Acompañantes"
        className="w-full border p-3 rounded-lg"
        value={acompanantes}
        onChange={(e) =>
          setAcompanantes(Number(e.target.value))
        }
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={botonExtra}
          onChange={(e) =>
            setBotonExtra(e.target.checked)
          }
        />

        Botón extra
      </label>

      <div className="text-2xl font-bold">
        Total: ${total.toLocaleString()}
      </div>

      <button className="bg-black text-white px-6 py-3 rounded-lg">
        Guardar
      </button>
    </form>
  );
}