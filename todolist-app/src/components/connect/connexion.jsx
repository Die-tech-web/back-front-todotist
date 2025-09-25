import React, { useState } from "react";
import { LogIn } from "lucide-react";

const Connexion = ({ onInscrire, onConnect }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setErrors({});
    // Validation personnalisée
    const newErrors = {};
    if (!login.trim()) newErrors.login = "Le login est obligatoire.";
    if (!password.trim())
      newErrors.password = "Le mot de passe est obligatoire.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Connexion réussie !");
        if (onConnect) onConnect();

        // Stocker les informations d'authentification
        localStorage.setItem("token", data.token);
        localStorage.setItem("login", data.user.login);
        localStorage.setItem("nom", data.user.nom);

        // Stocker aussi en sessionStorage comme fallback
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("login", data.user.login);
        sessionStorage.setItem("nom", data.user.nom);
      } else {
        setMessage(data.message || "Erreur de connexion");
      }
    } catch (err) {
      setMessage("Erreur serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full min-w-[320px] flex flex-col gap-4 mx-auto mt-16"
    >
      <div className="flex items-center gap-2 mb-2">
        <LogIn size={24} className="text-[#800020]" />
        <h2 className="text-xl font-bold text-[#800020]">Connexion</h2>
      </div>
      <input
        type="text"
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        placeholder="Login"
        className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020]"
        disabled={isLoading}
      />
      {errors.login && (
        <div className="text-xs text-red-600 mt-1">{errors.login}</div>
      )}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020]"
        disabled={isLoading}
      />
      {errors.password && (
        <div className="text-xs text-red-600 mt-1">{errors.password}</div>
      )}
      <button
        type="submit"
        className="bg-[#800020] text-white rounded px-4 py-2 text-base font-semibold mt-2 w-full"
        disabled={isLoading}
      >
        {isLoading ? "Connexion..." : "Se connecter"}
      </button>
      {message && (
        <div className="text-center text-sm mt-2 text-[#800020]">{message}</div>
      )}
      <div className="text-center text-sm mt-2 text-gray-600">
        Pas encore de compte ?{" "}
        <button
          type="button"
          className="text-[#800020] font-semibold underline"
          onClick={onInscrire}
        >
          Inscrivez-vous
        </button>
      </div>
    </form>
  );
};

export default Connexion;
