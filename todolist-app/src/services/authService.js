// Service utilitaire pour gérer l'authentification
export const authService = {
  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    return !!token;
  },

  // Récupérer les informations utilisateur
  getUserInfo: () => {
    const login =
      localStorage.getItem("login") ||
      sessionStorage.getItem("login") ||
      "ab_user";
    const nom =
      localStorage.getItem("nom") || sessionStorage.getItem("nom") || "";
    return { login, nom };
  },

  // Stocker les informations d'authentification
  setAuthData: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("login", user.login);
    localStorage.setItem("nom", user.nom);

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("login", user.login);
    sessionStorage.setItem("nom", user.nom);
  },

  // Nettoyer les données d'authentification
  clearAuthData: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("login");
    localStorage.removeItem("nom");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("login");
    sessionStorage.removeItem("nom");
  },

  // Vérifier la validité du token en faisant un appel API
  validateToken: async () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      return false;
    }

    try {
      const response = await fetch("http://localhost:3000/todos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      return false;
    }
  },
};
