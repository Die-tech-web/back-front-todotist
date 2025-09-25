import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { privilegeService } from "../../services/privilegeService";

const SupprimerTache = ({ tacheId, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [hasPrivilege, setHasPrivilege] = useState(true);
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const checkPrivilege = async () => {
    try {
      const privilege = await privilegeService.checkUserPrivilege(
        token,
        tacheId
      );
      setHasPrivilege(privilege.canDelete);
      return privilege.canDelete;
    } catch (error) {
      console.error("Error checking privilege:", error);
      if (error.message === "AUTHENTICATION_EXPIRED") {
        toast.error("Session expirée. Veuillez vous reconnecter.", {
          style: { background: "white", color: "green" },
        });
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
        return false;
      }
      setHasPrivilege(false);
      return false;
    }
  };

  const handleDeleteClick = async () => {
    const canDelete = await checkPrivilege();
    if (!canDelete) {
      toast.error("Vous n'avez pas les droits pour supprimer cette tâche.", {
        style: { background: "white", color: "green" },
      });
      return;
    }

    // ✅ Affiche un toast avec un bouton pour confirmer
    toast(
      (t) => (
        <span>
          Confirmer la suppression ?{" "}
          <button
            className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
            onClick={() => {
              toast.dismiss(t.id);
              performDelete(); // on lance la suppression
            }}
          >
            Oui
          </button>
        </span>
      ),
      { style: { background: "white", color: "black" } }
    );
  };

  const performDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/todos/${tacheId}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        toast.success("Tâche supprimée avec succès", {
          style: { background: "white", color: "green" },
        });
        onDelete?.();
        setTimeout(() => {
          window.location.hash = "#top";
        }, 500);
      } else if (res.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.", {
          style: { background: "white", color: "green" },
        });
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Erreur lors de la suppression", {
          style: { background: "white", color: "green" },
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erreur serveur. Veuillez réessayer.", {
        style: { background: "white", color: "green" },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`p-2 rounded transition ${
        hasPrivilege
          ? "text-red-600 hover:text-red-800"
          : "text-gray-400 cursor-not-allowed"
      }`}
      onClick={handleDeleteClick}
      disabled={loading || !hasPrivilege}
      title={
        hasPrivilege
          ? "Supprimer"
          : "Vous n'avez pas le droit de suppremer cette tâche"
      }
    >
      <Trash2 size={18} />
    </button>
  );
};

export default SupprimerTache;
