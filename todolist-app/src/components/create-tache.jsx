import React, { useState, useRef, useEffect } from "react";
import { Image, Mic, Square, Play, Pause } from "lucide-react";
import toast from "react-hot-toast";
import { audioService, AudioService } from "../services/audioService";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo

const CreateTache = ({ onCreated }) => {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState("en cours");
  const [image, setImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStopping, setIsStopping] = useState(false); // Prevent multiple stop calls
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [dateError, setDateError] = useState("");
  const audioPreviewRef = useRef(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) {
        AudioService.revokePreviewUrl(audioPreviewUrl);
      }
      audioService.cleanup();
    };
  }, [audioPreviewUrl]);

  // Recording duration timer - handled by audioService

  const handleStartRecording = async () => {
    if (!AudioService.isSupported()) {
      toast.error("Votre navigateur ne supporte pas l'enregistrement audio", {
        style: { background: "white", color: "red" },
      });
      return;
    }

    try {
      // Start recording with 30-second limit and callbacks
      await audioService.startRecording(
        30, // 30 seconds max
        (elapsed) => {
          // Update duration display
          setRecordingDuration(elapsed);
        },
        () => {
          // Auto-stop callback - recording completed at 30 seconds
          console.log("Recording auto-stopped after 30 seconds");
          // Use the same stopping mechanism to prevent conflicts
          if (!isStopping) {
            handleStopRecording();
          }
        }
      );
      setIsRecording(true);
      setRecordingDuration(0);
      toast.success("Enregistrement démarré - cliquez pour arrêter", {
        style: { background: "white", color: "green" },
      });
    } catch (error) {
      console.error("Recording error:", error);
      toast.error(`Erreur d'enregistrement: ${error.message}`, {
        style: { background: "white", color: "red" },
      });
    }
  };

  const handleStopRecording = async () => {
    // Prevent multiple stop calls
    if (isStopping) {
      console.log("Stop already in progress, ignoring...");
      return;
    }

    setIsStopping(true);

    try {
      // Only stop if currently recording (handles both manual and auto-stop)
      if (audioService.isRecording) {
        await audioService.stopRecording();
      }

      // Check if we have audio data
      if (!audioService.audioBlob || audioService.audioBlob.size === 0) {
        console.log("No audio data available");
        return;
      }

      const file = audioService.getAudioFile(
        `voice_message_${Date.now()}.webm`
      );
      setAudioFile(file);

      // Create preview URL
      const previewUrl = audioService.createPreviewUrl();
      if (previewUrl) {
        setAudioPreviewUrl(previewUrl);
      }

      setIsRecording(false);
      setRecordingDuration(0);

      // Show 30 seconds since we know it was a 30-second recording
      const actualDuration = 30;
      toast.success(
        `Enregistrement terminé (${AudioService.formatDuration(
          actualDuration
        )})`,
        {
          style: { background: "white", color: "green" },
        }
      );
    } catch (error) {
      console.error("Stop recording error:", error);
      toast.error(`Erreur lors de l'arrêt: ${error.message}`, {
        style: { background: "white", color: "red" },
      });
    } finally {
      setIsStopping(false);
    }
  };

  const handlePlayPreview = () => {
    if (audioPreviewRef.current) {
      if (isPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    if (audioPreviewUrl) {
      AudioService.revokePreviewUrl(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setIsPlaying(false);
    audioService.cleanup();
    toast.success("Message vocal supprimé", {
      style: { background: "white", color: "green" },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDateError("");
    // Validation titre obligatoire
    if (!titre.trim()) {
      toast.error("Le titre est obligatoire.", {
        style: { background: "white", color: "red" },
      });
      setIsLoading(false);
      return;
    }
    // Validation date
    if (dateDebut && dateFin && new Date(dateFin) <= new Date(dateDebut)) {
      setDateError("La date de fin doit être supérieure à la date de début.");
      setIsLoading(false);
      return;
    }
    // Vérification taille et type des fichiers
    if (image) {
      if (image.size > MAX_FILE_SIZE) {
        toast.error("L'image est trop volumineuse (max 10 Mo)", {
          style: { background: "white", color: "red" },
        });
        setIsLoading(false);
        return;
      }
      if (!image.type.startsWith("image/")) {
        toast.error("Le fichier image n'est pas valide.", {
          style: { background: "white", color: "red" },
        });
        setIsLoading(false);
        return;
      }
    }
    if (audioFile) {
      if (audioFile.size > MAX_FILE_SIZE) {
        toast.error("Le fichier audio est trop volumineux (max 10 Mo)", {
          style: { background: "white", color: "red" },
        });
        setIsLoading(false);
        return;
      }
      if (!audioFile.type.startsWith("audio/")) {
        toast.error("Le fichier audio n'est pas valide.", {
          style: { background: "white", color: "red" },
        });
        setIsLoading(false);
        return;
      }
    }
    try {
      console.log("Début de la soumission...");
      const formData = new FormData();
      // Ajout du champ nom (récupéré du localStorage/sessionStorage)
      const nom = localStorage.getItem("nom") || sessionStorage.getItem("nom");
      formData.append("nom", nom || "");
      formData.append("title", titre);
      formData.append("description", description);
      formData.append("statut", statut);
      if (dateDebut) formData.append("dateDebut", dateDebut);
      if (dateFin) formData.append("dateFin", dateFin);
      // Add files to FormData with the same key to create an array
      if (image) {
        formData.append("files", image);
        console.log("Fichier image ajouté:", image.name);
      }
      if (audioFile) {
        formData.append("files", audioFile);
        console.log("Fichier audio ajouté:", audioFile.name);
      }
      // Récupérer votre token d'authentification
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      console.log("Token trouvé:", token ? "Oui" : "Non");
      console.log("Nom trouvé:", nom ? nom : "Non");
      console.log("Envoi de la requête...");
      const response = await fetch("http://localhost:3000/todos", {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Ne pas définir Content-Type ici !
        },
        body: formData,
      });
      console.log("Statut de la réponse:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur du serveur:", errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      const result = await response.json();
      console.log("Tâche créée avec succès:", result);
      // Réinitialiser le formulaire
      setTitre("");
      setDescription("");
      setStatut("en cours"); // Correction: statut par défaut
      setImage(null);
      setAudioFile(null);
      setIsRecording(false);
      setRecordingDuration(0);
      setIsPlaying(false);
      setDateDebut("");
      setDateFin("");
      setDateError("");
      if (audioPreviewUrl) {
        AudioService.revokePreviewUrl(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      audioService.cleanup();
      toast.success("Tâche créée avec succès !", {
        style: { background: "white", color: "green" },
      });
      // Fermer le modal et actualiser
      if (onCreated) {
        onCreated();
      }
    } catch (error) {
      console.error("Erreur complète:", error);
      toast.error(`Erreur lors de la création: ${error.message}`, {
        style: { background: "white", color: "red" }, // Correction couleur
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full min-w-[320px] flex flex-col gap-4"
    >
      <h2 className="text-xl font-bold text-[#800020] mb-2">Créer une tâche</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre *
        </label>
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Titre de la tâche"
          className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description de la tâche"
          className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Statut
        </label>
        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          disabled={isLoading}
        >
          <option value="en cours">En cours</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de début (optionnelle)
        </label>
        <input
          type="datetime-local"
          value={dateDebut}
          onChange={(e) => setDateDebut(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          disabled={isLoading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date de fin (optionnelle)
        </label>
        <input
          type="datetime-local"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm focus:ring-2 focus:ring-[#800020] focus:border-[#800020]"
          disabled={isLoading}
        />
      </div>
      {dateError && (
        <div className="text-red-600 text-sm mb-2">{dateError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image (optionnel)
        </label>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
            <Image size={18} className="text-[#800020]" />
          </span>
          <input
            type="file"
            accept="image/*"
            className="ml-2 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#800020] file:text-white hover:file:bg-[#600018]"
            onChange={(e) => setImage(e.target.files[0])}
            disabled={isLoading}
          />
          <span className="text-gray-500 text-sm">
            {image ? image.name : "Aucun fichier choisi"}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message vocal (optionnel)
        </label>
        <div className="flex items-center gap-2">
          {!audioFile ? (
            <>
              <button
                type="button"
                onClick={
                  isRecording ? handleStopRecording : handleStartRecording
                }
                disabled={isLoading || isStopping}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isRecording
                    ? isStopping
                      ? "bg-gray-500"
                      : "bg-red-500 hover:bg-red-600"
                    : "bg-[#800020] hover:bg-[#600018]"
                } text-white disabled:opacity-50`}
                title={
                  isRecording
                    ? isStopping
                      ? "Arrêt en cours..."
                      : "Arrêter l'enregistrement"
                    : "Démarrer l'enregistrement"
                }
              >
                {isRecording ? (
                  isStopping ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Square size={18} />
                  )
                ) : (
                  <Mic size={18} />
                )}
              </button>
              <span
                className={`text-sm font-medium ${
                  isRecording && recordingDuration >= 25
                    ? "text-red-500 animate-pulse"
                    : isRecording
                    ? "text-orange-500"
                    : "text-gray-500"
                }`}
              >
                {isRecording
                  ? `Enregistrement... ${AudioService.formatDuration(
                      recordingDuration
                    )}/0:30`
                  : "Cliquez pour enregistrer (arrêt manuel ou auto à 30s)"}
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePlayPreview}
                className="inline-flex items-center justify-center w-8 h-8 bg-[#800020] hover:bg-[#600018] text-white rounded-full transition-colors"
                title={isPlaying ? "Pause" : "Lecture"}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="text-gray-500 text-sm">
                {audioFile.name} ({AudioService.formatDuration(30)})
              </span>
              <button
                type="button"
                onClick={handleRemoveAudio}
                className="text-red-500 hover:text-red-700 text-sm underline"
                disabled={isLoading}
              >
                Supprimer
              </button>
            </>
          )}
        </div>

        {/* Hidden audio element for preview */}
        {audioPreviewUrl && (
          <audio
            ref={audioPreviewRef}
            src={audioPreviewUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            className="hidden"
          />
        )}
      </div>

      <button
        type="submit"
        className="bg-[#800020] text-white rounded px-4 py-2 text-base font-semibold mt-2 w-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#600018] transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Création en cours...
          </span>
        ) : (
          "Créer la tâche"
        )}
      </button>
    </form>
  );
};

export default CreateTache;
