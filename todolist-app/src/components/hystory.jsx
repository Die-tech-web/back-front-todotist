import React, { useState, useEffect } from "react";
import { Clock, Calendar, User, FileText, CheckCircle, Loader2, Circle } from "lucide-react";
   
const getStatutIcon = (statut) => {
  if (statut === "Terminé")
    return <CheckCircle className="text-green-600" size={16} />;
  if (statut === "En cours")
    return <Loader2 className="text-yellow-600 animate-spin" size={16} />;
  return <Circle className="text-gray-400" size={16} />;
};

const HistoryModal = ({ tacheId, tacheTitre, onClose }) => {
  const [historique, setHistorique] = useState([]);
  const [tacheInfo, setTacheInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!tacheId) return;

      setLoading(true);
      setError("");

      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        // Récupérer les informations de la tâche
        const tacheResponse = await fetch(`http://localhost:3000/todos/${tacheId}`, {
          method: "GET",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        // Récupérer l'historique
        const historiqueResponse = await fetch(`http://localhost:3000/actions/todo/${tacheId}`, {
          method: "GET",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        let tacheData = null;
        let historiqueData = [];

        if (tacheResponse.ok) {
          tacheData = await tacheResponse.json();
          setTacheInfo(tacheData);
        }

        if (historiqueResponse.ok) {
          historiqueData = await historiqueResponse.json();
          setHistorique(historiqueData);
        } else if (historiqueResponse.status === 404) {
          // Pas d'historique pour les anciennes tâches, c'est normal
          setHistorique([]);
        } else {
          const errorText = await historiqueResponse.text();
          console.warn("Erreur lors de la récupération de l'historique:", errorText);
          setHistorique([]);
        }

      } catch (err) {
        setError("Erreur serveur");
        setHistorique([]);
        setTacheInfo(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tacheId]);

  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUserDisplayName = (user) => {
    if (!user) return "Utilisateur inconnu";
    if (typeof user === 'string') return user;
    if (user.nom) return user.nom;
    if (user.login) return user.login;
    if (user.email) return user.email;
    return "Utilisateur inconnu";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock size={20} />
              Historique de la tâche
            </h2>
            <p className="text-white/80 text-sm mt-1">{tacheTitre}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl font-bold"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="animate-spin text-[#800020] mx-auto mb-2" size={32} />
              <p className="text-gray-600">Chargement de l'historique...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Informations de la tâche */}
              {tacheInfo && (
                <div className="bg-gray-50 border-l-4 border-gray-300 rounded-r-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Informations de la tâche
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        ID: {tacheId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Utilisateur</p>
                        <p className="text-xs text-gray-500">{getUserDisplayName(tacheInfo.user || tacheInfo.utilisateur)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-600">Date de création</p>
                        <p className="text-xs text-gray-500">{formatDate(tacheInfo.createdAt || tacheInfo.date_creation)}</p>
                      </div>
                    </div>
                    {tacheInfo.statut && (
                      <div className="flex items-center gap-2">
                        {getStatutIcon(tacheInfo.statut)}
                        <div>
                          <p className="text-xs font-medium text-gray-600">Statut actuel</p>
                          <p className="text-xs text-gray-500">{tacheInfo.statut}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Historique des actions */}
              <div>
                <h3 className="font-medium text-gray-600 mb-3 flex items-center gap-2">
                  <Clock size={16} />
                  Historique des actions
                </h3>

                {historique.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 bg-gray-50 rounded-lg">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune action enregistrée pour cette tâche.</p>
                    <p className="text-xs mt-1 opacity-75">Les actions récentes apparaîtront ici lors des modifications.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historique.map((action, index) => (
                      <div
                        key={index}
                        className="border-l-4 border-gray-300 bg-gray-50 rounded-r-lg p-3 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatutIcon(action.statut)}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {formatDate(action.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <User size={12} className="text-gray-400" />
                              <span className="text-xs font-medium text-gray-600">
                                {action.action || action.type || "Action"}
                              </span>
                            </div>
                            {action.description && (
                              <p className="text-gray-500 text-xs">{action.description}</p>
                            )}
                            {action.details && (
                              <div className="mt-2 text-xs text-gray-400 bg-white p-2 rounded border">
                                <strong>Détails:</strong> {action.details}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
