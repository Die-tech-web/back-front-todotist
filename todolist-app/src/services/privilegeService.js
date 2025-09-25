// Service for managing privileges
const API_BASE_URL = "http://localhost:3000/todos";

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
};

export const privilegeService = {
  // Export decodeJWT for use in components
  decodeJWT,
  // Get all privileges for all tasks
  async getAllPrivileges(token) {
    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch privileges");
      }

      const todos = await response.json();
      return todos;
    } catch (error) {
      console.error("Error fetching privileges:", error);
      throw error;
    }
  },

  // Get all users for privilege assignment
  async getAllUsers(token) {
    try {
      const response = await fetch(`http://localhost:3000/auth/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const users = await response.json();
      return users;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Assign privilege to a user for a specific task
  async assignPrivilege(token, todoId, userId, canEdit, canDelete) {
    try {
      const response = await fetch(`${API_BASE_URL}/privilege`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todoId: parseInt(todoId),
          userId: parseInt(userId),
          canEdit,
          canDelete,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign privilege");
      }

      return await response.json();
    } catch (error) {
      console.error("Error assigning privilege:", error);
      throw error;
    }
  },

  // Remove privilege from a user for a specific task
  async removePrivilege(token, todoId, userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/privilege`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todoId: parseInt(todoId),
          userId: parseInt(userId),
          canEdit: false,
          canDelete: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to remove privilege");
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing privilege:", error);
      throw error;
    }
  },

  // Check if current user has privilege for a task
  async checkUserPrivilege(token, todoId) {
    try {
      const response = await fetch(`${API_BASE_URL}/todos/${todoId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Authentication error - clear auth data and throw specific error
          localStorage.removeItem("token");
          localStorage.removeItem("login");
          localStorage.removeItem("nom");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("login");
          sessionStorage.removeItem("nom");
          throw new Error("AUTHENTICATION_EXPIRED");
        }
        throw new Error("Failed to check privilege");
      }

      const todo = await response.json();
      const decodedToken = decodeJWT(token);
      const currentUserId = decodedToken?.userId;

      if (!currentUserId) {
        throw new Error("Invalid token or user not found");
      }

      // Owner always has full privileges
      if (todo.userId === currentUserId) {
        return {
          canEdit: true,
          canDelete: true,
          isOwner: true,
        };
      }

      // Check if user has privileges
      const privilege = todo.privileges?.find(
        (p) => p.userId === currentUserId
      );
      if (privilege) {
        return {
          canEdit: privilege.canEdit,
          canDelete: privilege.canDelete,
          isOwner: false,
        };
      }

      return {
        canEdit: false,
        canDelete: false,
        isOwner: false,
      };
    } catch (error) {
      console.error("Error checking privilege:", error);
      if (error.message === "AUTHENTICATION_EXPIRED") {
        throw error; // Re-throw authentication errors
      }
      throw error;
    }
  },
};
