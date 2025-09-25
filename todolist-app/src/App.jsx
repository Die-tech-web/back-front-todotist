import React, { useState, useRef, useEffect } from "react";
import Header from "./components/header";
import Inscription from "./components/connect/inscription";
import Connexion from "./components/connect/connexion";
import CreateTache from "./components/create-tache";
import ListTaches from "./components/list-taches";
import HistoryModal from "./components/hystory";
import { authService } from "./services/authService";

const App = () => {
  const [showInscription, setShowInscription] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showForm, setShowForm] = useState(false); // État pour le modal de création
  const [refreshKey, setRefreshKey] = useState(0); // Pour forcer le refresh de la liste
  const [userNom, setUserNom] = useState("");
  const [userLogin, setUserLogin] = useState("");
  const [showHistory, setShowHistory] = useState(false); // État pour le modal d'historique
  const [selectedTacheId, setSelectedTacheId] = useState(null); // ID de la tâche sélectionnée pour l'historique
  const [selectedTacheTitre, setSelectedTacheTitre] = useState(""); // Titre de la tâche sélectionnée
  const refreshTasksRef = useRef(null);

  // Vérifier l'authentification au démarrage de l'application
  useEffect(() => {
    const checkAuthentication = async () => {
      if (authService.isAuthenticated()) {
        const isValid = await authService.validateToken();
        if (isValid) {
          // Token valide, restaurer l'état d'authentification
          setIsConnected(true);
          const { login, nom } = authService.getUserInfo();
          setUserLogin(login);
          setUserNom(nom);
        } else {
          // Token invalide, nettoyer le stockage
          authService.clearAuthData();
          setIsConnected(false);
        }
      }
    };

    checkAuthentication();
  }, []);

  const handleTacheCreated = () => {
    setShowForm(false); // Fermer le modal après création
    setRefreshKey((k) => k + 1); // Rafraîchir la liste
    // Also trigger refresh if available
    if (refreshTasksRef.current) {
      refreshTasksRef.current();
    }
  };

  const handleTaskUpdated = () => {
    setRefreshKey((k) => k + 1); // Rafraîchir la liste
    // Also trigger refresh if available
    if (refreshTasksRef.current) {
      refreshTasksRef.current();
    }
  };

  const handleConnect = () => {
    setIsConnected(true);
    const { login, nom } = authService.getUserInfo();
    setUserLogin(login);
    setUserNom(nom);
  };

  const handleLogout = () => {
    setIsConnected(false);
    setUserLogin("");
    setUserNom("");
    authService.clearAuthData();
  };

  const handleShowHistory = (tacheId, tacheTitre) => {
    setSelectedTacheId(tacheId);
    setSelectedTacheTitre(tacheTitre);
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setSelectedTacheId(null);
    setSelectedTacheTitre("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isConnected && (
        <Header
          onOpenForm={() => setShowForm(true)}
          onLogout={handleLogout}
          userLogin={userLogin}
          userNom={userNom}
        />
      )}

      <div className="flex flex-col items-center gap-8 mt-8">
        {!isConnected ? (
          // Section de connexion/inscription
          !showInscription ? (
            <Connexion
              onInscrire={() => setShowInscription(true)}
              onConnect={handleConnect}
            />
          ) : (
            <Inscription onConnect={() => setShowInscription(false)} />
          )
        ) : (
          // Section principale une fois connecté
          <>
            {/* Contenu flou quand le modal est ouvert */}
            <div
              className={
                showForm ? "blur-sm pointer-events-none select-none" : ""
              }
              //    className={
              //   showForm ? " pointer-events-none select-none" : ""
              // }
            >
              {/* <div className="text-center text-lg mb-8 text-[#800020]">
                Bienvenue !
              </div> */}
              <ListTaches
                refreshKey={refreshKey}
                onShowHistory={handleShowHistory}
                onRefresh={(refreshFn) => {
                  refreshTasksRef.current = refreshFn;
                }}
              />
            </div>

            {/* Modal de création de tâche */}
            {showForm && (
              <div className="fixed inset-0 flex justify-center items-center z-50">
                <div className="relative">
                  <button
                    onClick={() => setShowForm(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    ×
                  </button>
                  <CreateTache onCreated={handleTacheCreated} />
                </div>
              </div>
            )}

            {/* Modal d'historique */}
            {showHistory && (
              <HistoryModal
                tacheId={selectedTacheId}
                tacheTitre={selectedTacheTitre}
                onClose={handleCloseHistory}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default App;
