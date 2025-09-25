import React, { useState } from "react";
import { Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { privilegeService } from "../../services/privilegeService";

const EditerTache = ({ tache, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(tache.title || tache.titre || "");
  const [description, setDescription] = useState(tache.description || "");
  const [statut, setStatut] = useState(tache.statut);
  const [loading, setLoading] = useState(false);
  const [hasPrivilege, setHasPrivilege] = useState(true);
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const checkPrivilege = async () => {
    try {
      const privilege = await privilegeService.checkUserPrivilege(
        token,
        tache.id
      );
      setHasPrivilege(privilege.canEdit);
      return privilege.canEdit;
    } catch (error) {
      console.error("Error checking privilege:", error);
      if (error.message === "AUTHENTICATION_EXPIRED") {
        toast.error("Session expirée. Veuillez vous reconnecter.", {
          style: { background: "white", color: "green" },
        });
        // Clear authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("login");
        localStorage.removeItem("nom");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("login");
        sessionStorage.removeItem("nom");
        // Reload to go to login page
        window.location.reload();
        return false;
      }
      setHasPrivilege(false);
      return false;
    }
  };

  const handleEditClick = async () => {
    const canEdit = await checkPrivilege();
    if (canEdit) {
      setIsEditing(true);
    } else {
      toast.error("Vous n'avez pas les droits pour modifier cette tâche.", {
        style: { background: "white", color: "green" },
      });
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/todos/${tache.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ title: title, description, statut }),
      });

      if (res.ok) {
        toast.success("Tâche modifiée avec succès", {
          style: { background: "white", color: "green" },
        });
        setIsEditing(false);
        if (onEdit) onEdit();
        // Reset page to 1 after edit
        setTimeout(() => {
          window.location.hash = "#top";
        }, 500);
      } else if (res.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.", {
          style: { background: "white", color: "green" },
        });
        // Clear authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("login");
        localStorage.removeItem("nom");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("login");
        sessionStorage.removeItem("nom");
        // Reload to go to login page
        window.location.reload();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors de la modification", {
          style: { background: "white", color: "green" },
        });
      }
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Erreur serveur. Veuillez réessayer.", {
        style: { background: "white", color: "green" },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        className={`p-2 rounded transition ${
          hasPrivilege
            ? "text-[#800020] hover:text-[#600018]"
            : "text-gray-400 cursor-not-allowed"
        }`}
        onClick={handleEditClick}
        title={hasPrivilege ? "Éditer" : "Pas de droits d'édition"}
        disabled={!hasPrivilege}
      >
        <Pencil size={18} />
      </button>
    );
  }

  return (
    <form onSubmit={handleEdit} className="flex flex-col gap-2 mt-2 w-full">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
        disabled={loading}
        placeholder="Titre de la tâche"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
        rows={2}
        disabled={loading}
        placeholder="Description"
      />
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-full"
        disabled={loading}
      >
        <option value="fait">Fait</option>
        <option value="en cours">En cours</option>
        <option value="terminer">Terminé</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-[#800020] text-white px-3 py-1 rounded text-sm"
          disabled={loading}
        >
          Sauvegarder
        </button>
        <button
          type="button"
          className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm"
          onClick={() => setIsEditing(false)}
          disabled={loading}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default EditerTache;
