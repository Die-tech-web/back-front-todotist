import React, { useEffect, useState, useRef } from "react";
import {
  CheckCircle,
  Loader2,
  Circle,
  History,
  Users,
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import SupprimerTache from "./actions/SupprimerTache";
import EditerTache from "./actions/EditerTache";
import { privilegeService } from "../services/privilegeService";

const getStatutIcon = (statut) => {
  if (statut === "Terminé")
    return <CheckCircle className="text-green-600" size={18} />;
  if (statut === "En cours")
    return <Loader2 className="text-yellow-600 animate-spin" size={18} />;
  return <Circle className="text-gray-400" size={18} />;
};

const ListTaches = ({ refreshKey, onShowHistory, onRefresh }) => {
  const [taches, setTaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [userPrivileges, setUserPrivileges] = useState({});
  const [prevTaskCount, setPrevTaskCount] = useState(0); // Pour suivre le nombre précédent de tâches
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef(new Map());
  const tachesParPage = 8;
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  // Expose refresh function to parent components
  React.useEffect(() => {
    if (onRefresh) {
      onRefresh(() => {
        fetchTaches();
      });
    }
  }, [onRefresh]);

  const getCurrentUserId = () => {
    if (!token) return null;
    try {
      const decodedToken = privilegeService.decodeJWT(token);
      return decodedToken?.userId || null;
    } catch (error) {
      console.error("Error getting current user ID:", error);
      return null;
    }
  };

  const currentUserId = getCurrentUserId();

  // Set up audio ref for a task
  const setAudioRef = (taskId, ref) => {
    if (ref) {
      audioRefs.current.set(taskId, ref);
    } else {
      audioRefs.current.delete(taskId);
    }
  };

  // Handle audio play/pause
  const handleAudioToggle = (taskId, audioUrl) => {
    const audioRef = audioRefs.current.get(taskId);

    if (playingAudioId === taskId) {
      // Pause current audio
      if (audioRef) {
        audioRef.pause();
      }
      setPlayingAudioId(null);
    } else {
      // Stop any currently playing audio
      if (playingAudioId && audioRefs.current.get(playingAudioId)) {
        audioRefs.current.get(playingAudioId).pause();
      }

      // Play new audio
      if (audioRef) {
        audioRef.play();
        setPlayingAudioId(taskId);
      }
    }
  };

  // Handle audio ended
  const handleAudioEnded = (taskId) => {
    if (playingAudioId === taskId) {
      setPlayingAudioId(null);
    }
  };

  const checkUserPrivilege = (todo) => {
    // Owner always has full privileges
    if (todo.userId === parseInt(currentUserId)) {
      return { canEdit: true, canDelete: true, isOwner: true };
    }

    // Check if user has privileges
    const privilege = todo.privileges?.find(
      (p) => p.userId === parseInt(currentUserId)
    );
    if (privilege) {
      return {
        canEdit: privilege.canEdit,
        canDelete: privilege.canDelete,
        isOwner: false,
      };
    }

    return { canEdit: false, canDelete: false, isOwner: false };
  };

  const fetchTaches = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3000/todos", {
        method: "GET",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError(errorText || "Erreur lors de la récupération des tâches");
        setTaches([]);
      } else {
        const data = await response.json();
        setTaches(data);

        // Vérifier si une nouvelle tâche a été ajoutée et ajuster la page
        const totalPages = Math.ceil(data.length / tachesParPage);
        if (data.length > prevTaskCount && totalPages > 1) {
          setPage(totalPages);
        }
        setPrevTaskCount(data.length);

        // Check privileges for each task
        const privileges = {};
        data.forEach((todo) => {
          privileges[todo.id] = checkUserPrivilege(todo);
        });
        setUserPrivileges(privileges);
      }
    } catch (err) {
      setError("Erreur serveur");
      setTaches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaches();
  }, [refreshKey, token]);

  // Nouvelle fonction pour terminer une tâche
  const handleTerminerTache = async (tacheId) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`http://localhost:3000/todos/${tacheId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ statut: "terminer" }), // valeur en minuscule
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du statut");
      }
      await fetchTaches(); // Recharge la liste immédiatement
    } catch (error) {
      console.error(error);
      // Affiche un toast d'erreur si tu utilises react-hot-toast
      if (window.toast) {
        window.toast.error("Impossible de terminer la tâche");
      }
    }
  };

  // Pagination
  const totalPages = Math.ceil(taches.length / tachesParPage);
  const startIdx = (page - 1) * tachesParPage;
  const endIdx = startIdx + tachesParPage;
  const tachesPage = taches.slice(startIdx, endIdx);

  if (loading) {
    return (
      <div className="text-center mt-8 text-[#800020]">
        Chargement des tâches...
      </div>
    );
  }
  if (error) {
    return <div className="text-center mt-8 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto mt-8">
      {taches.length === 0 ? (
        <div className="text-center text-gray-500">Aucune tâche trouvée.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tachesPage.map((t) => {
              const privilege = userPrivileges[t.id] || {
                canEdit: false,
                canDelete: false,
                isOwner: false,
              };
              const hasAnyPrivilege =
                privilege.canEdit || privilege.canDelete || privilege.isOwner;

              // Formatage des dates
              const formatDate = (dateStr) => {
                if (!dateStr) return "-";
                const date = new Date(dateStr);
                return date.toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              };

              return (
                <div
                  key={t.id}
                  className={`bg-white rounded-xl shadow p-4 flex flex-col gap-2 border border-gray-100`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatutIcon(t.statut)}
                    <span className="font-semibold text-gray-800">
                      {t.title}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-1">
                    {t.description}
                  </div>

                  {/* Affichage des dates */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 mb-2">
                    <span>
                      Date début :{" "}
                      <span className="font-mono">
                        {formatDate(t.dateDebut)}
                      </span>
                    </span>
                    <span>
                      Date fin :{" "}
                      <span className="font-mono">{formatDate(t.dateFin)}</span>
                    </span>
                  </div>

                  <div className="mb-2 flex gap-2 items-center">
                    {/* Remplacement du cercle par le badge Terminer */}
                    {t.statut === "en cours" ? (
                      <button
                        onClick={() => handleTerminerTache(t.id)}
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-semibold hover:bg-gray-400 transition-colors"
                        title="Marquer comme terminé"
                      >
                        Terminer
                      </button>
                    ) : (
                      getStatutIcon(t.statut)
                    )}

                    {privilege.canEdit && (
                      <EditerTache
                        tache={t}
                        onEdit={() => setRefreshKey((prev) => prev + 1)}
                      />
                    )}

                    {privilege.canDelete && (
                      <SupprimerTache
                        tacheId={t.id}
                        onDelete={() => setRefreshKey((prev) => prev + 1)}
                      />
                    )}

                    <button
                      onClick={() => onShowHistory(t.id, t.title)}
                      className="p-1 text-[#800020] hover:text-[#600018] hover:bg-[#800020] hover:bg-opacity-10 rounded transition-colors"
                      title="Voir l'historique"
                      aria-label="Voir l'historique"
                    >
                      <History size={18} />
                    </button>

                    {/* Show privilege indicator */}
                    {t.privileges && t.privileges.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={14} />
                        <span>{t.privileges.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="font-semibold text-[#800020] text-lg">
                    {t.title}
                    {privilege.isOwner && (
                      <span className="ml-2 text-xs bg-[#800020] text-white px-2 py-1 rounded">
                        Propriétaire
                      </span>
                    )}
                  </div>

                  <div className="text-gray-600 text-sm">{t.description}</div>

                  <div className="text-xs mt-1 text-gray-500">
                    Statut : {t.statut}
                  </div>

                  <div className="text-xs text-gray-500">
                    Créé par: {t.user?.nom || "Utilisateur inconnu"}
                  </div>

                  {/* Dates de début et de fin */}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 mt-1">
                    <span>
                      Date début :{" "}
                      <span className="font-medium">
                        {formatDate(t.dateDebut)}
                      </span>
                    </span>
                    <span>
                      Date fin :{" "}
                      <span className="font-medium">
                        {formatDate(t.dateFin)}
                      </span>
                    </span>
                  </div>

                  {/* Show privilege status */}
                  {!hasAnyPrivilege && (
                    <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-2">
                      Lecture seule
                    </div>
                  )}

                  {t.image && (
                    <img
                      src={t.image}
                      alt="tache"
                      className="w-14 h-14 object-cover rounded-lg border mt-2"
                    />
                  )}

                  {t.audioUrl && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => handleAudioToggle(t.id, t.audioUrl)}
                        className="flex items-center justify-center w-8 h-8 bg-[#800020] hover:bg-[#600018] text-white rounded-full transition-colors"
                        title={playingAudioId === t.id ? "Pause" : "Lecture"}
                      >
                        {playingAudioId === t.id ? (
                          <Pause size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>
                      <span className="text-xs text-gray-600 flex-1">
                        Message vocal
                      </span>
                      <audio
                        ref={(ref) => setAudioRef(t.id, ref)}
                        src={t.audioUrl}
                        onEnded={() => handleAudioEnded(t.id)}
                        onPause={() => setPlayingAudioId(null)}
                        onPlay={() => setPlayingAudioId(t.id)}
                        preload="metadata"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 rounded bg-[#800020] text-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </button>
            <span className="mx-2 text-sm text-gray-700">
              Page {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded bg-[#800020] text-white disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ListTaches;
