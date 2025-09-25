import React, { useState, useEffect } from "react";
import { ListTodo, Plus, LogOut } from "lucide-react";
import PrivilegeManager from "./PrivilegeManager";

const Header = ({ onOpenForm, onLogout, userLogin, userNom }) => {
  const [showPrivilegeManager, setShowPrivilegeManager] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch("http://localhost:3000/todos/notifications/count", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setNotifCount(data.count || 0));
  }, []);

  return (
    <>
      <header className="bg-[#800020] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            {/* ✅ Titre simple sans carré */}
            <div className="flex items-center ">
              <h1 className="text-2xl font-bold tracking-tight">AppToDo</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={onOpenForm}
                className="flex items-center gap-2 bg-white text-[#800020] px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition"
              >
                <Plus size={18} />
                Créer tâche
              </button>

              <button
                onClick={() => setShowPrivilegeManager(true)}
                className="flex items-center gap-2 bg-white text-[#800020] px-4 py-2 rounded-lg font-semibold shadow hover:bg-gray-100 transition"
                title="Gérer les privilèges"
              >
                Privilege
              </button>

              {/* ✅ Nom utilisateur sans cercle */}
              <div className="hidden sm:block text-sm opacity-90">
                <span className="font-medium">
                  {userNom || userLogin || "Utilisateur"}
                </span>
              </div>

              {/* Badge de notification */}
              <div className="relative mr-2">
                <span className="font-semibold">Notifications</span>
                {notifCount > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-600 text-white rounded-full px-2 py-1 text-xs font-bold animate-bounce">
                    {notifCount}
                  </span>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1 bg-white text-[#800020] px-3 py-2 rounded-full font-semibold shadow hover:bg-gray-100 transition"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {showPrivilegeManager && (
        <PrivilegeManager onClose={() => setShowPrivilegeManager(false)} />
      )}
    </>
  );
};

export default Header;
