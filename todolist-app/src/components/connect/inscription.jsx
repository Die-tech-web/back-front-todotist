import React, { useState } from "react";
import { UserPlus } from "lucide-react";

const Inscription = ({ onConnect }) => {
  const [nom, setNom] = useState("");
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
    if (!nom.trim()) newErrors.nom = "Le nom est requis.";
    if (!login.trim()) newErrors.login = "Le login est requis.";
    if (!password.trim()) newErrors.password = "Le mot de passe est requis.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, login, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Inscription réussie !");
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
        setMessage(data.message || "Erreur d'inscription");
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
        <UserPlus size={24} className="text-[#800020]" />
        <h2 className="text-xl font-bold text-[#800020]">Inscription</h2>
      </div>
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        placeholder="Nom"
        className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020]"
        disabled={isLoading}
      />
      {errors.nom && (
        <div className="text-xs text-red-600 mt-1">{errors.nom}</div>
      )}
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
        {isLoading ? "Inscription..." : "S'inscrire"}
      </button>
      {message && (
        <div className="text-center text-sm mt-2 text-[#800020]">{message}</div>
      )}
      <div className="text-center text-sm mt-2 text-gray-600">
        <button
          type="button"
          className="text-[#800020] font-semibold underline"
          onClick={onConnect}
        >
          Retour à la connexion
        </button>
      </div>
    </form>
  );
};

export default Inscription;
