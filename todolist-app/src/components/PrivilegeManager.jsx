import React, { useState, useEffect } from 'react';
import { X, User, Edit, Trash2, Users } from 'lucide-react';
import { privilegeService } from '../services/privilegeService';
import toast from 'react-hot-toast';

const PrivilegeManager = ({ onClose }) => {
  const [todos, setTodos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todosData, usersData] = await Promise.all([
        privilegeService.getAllPrivileges(token),
        privilegeService.getAllUsers(token)
      ]);
      setTodos(todosData);
      setUsers(usersData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPrivilege = async () => {
    if (!selectedTodo || !selectedUser) return;

    try {
      await privilegeService.assignPrivilege(
        token,
        selectedTodo.id,
        selectedUser,
        canEdit,
        canDelete
      );

      // Show success message
      toast.success('Privilège attribué avec succès');

      // Refresh data
      await fetchData();

      // Reset form
      setShowUserSelect(false);
      setSelectedUser('');
      setCanEdit(false);
      setCanDelete(false);
    } catch (err) {
      toast.error('Erreur lors de l\'attribution du privilège');
      console.error('Error assigning privilege:', err);
    }
  };

  const handleRemovePrivilege = async (todoId, userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce privilège ?')) return;

    try {
      await privilegeService.removePrivilege(token, todoId, userId);
      toast.success('Privilège retiré avec succès');
      await fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression du privilège');
      console.error('Error removing privilege:', err);
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.nom : `Utilisateur ${userId}`;
  };

  const getPrivilegeIcon = (privilege) => {
    if (privilege.canEdit && privilege.canDelete) {
      return <Users size={16} className="text-green-600" title="Édition et Suppression" />;
    } else if (privilege.canEdit) {
      return <Edit size={16} className="text-blue-600" title="Édition" />;
    } else if (privilege.canDelete) {
      return <Trash2 size={16} className="text-red-600" title="Suppression" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="text-[#800020]">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-[#800020] flex items-center gap-2">
            <Users size={24} />
            Gestion des Privilèges
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-gray-50 rounded-lg p-4 border"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#800020] text-lg">
                      {todo.title || todo.titre}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {todo.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Créé par: {todo.user?.nom || 'Utilisateur inconnu'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {todo.user?.nom || 'Inconnu'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Privilèges accordés:</h4>
                  <div className="space-y-2">
                    {todo.privileges && todo.privileges.length > 0 ? (
                      todo.privileges.map((privilege) => (
                        <div
                          key={privilege.id}
                          className="flex items-center justify-between bg-white p-2 rounded border"
                        >
                          <div className="flex items-center gap-2">
                            {getPrivilegeIcon(privilege)}
                            <span className="text-sm">
                              {getUserName(privilege.userId)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemovePrivilege(todo.id, privilege.userId)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Retirer le privilège"
                          >
                            Retirer
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Aucun privilège accordé
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedTodo(todo);
                    setShowUserSelect(true);
                  }}
                  className="w-full bg-[#800020] text-white px-3 py-2 rounded text-sm hover:bg-[#600018] transition"
                >
                  Attribuer un privilège
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal d'attribution de privilège */}
        {showUserSelect && selectedTodo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-[#800020] mb-4">
                Attribuer un privilège pour: {selectedTodo.title || selectedTodo.titre}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utilisateur:
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users
                      .filter(user => user.id !== selectedTodo.userId)
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.nom} ({user.login})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={canEdit}
                      onChange={(e) => setCanEdit(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Peut modifier</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={canDelete}
                      onChange={(e) => setCanDelete(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Peut supprimer</span>
                  </label>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    onClick={handleAssignPrivilege}
                    disabled={!selectedUser}
                    className="flex-1 bg-[#800020] text-white px-4 py-2 rounded hover:bg-[#600018] disabled:opacity-50"
                  >
                    Attribuer
                  </button>
                  <button
                    onClick={() => {
                      setShowUserSelect(false);
                      setSelectedUser('');
                      setCanEdit(false);
                      setCanDelete(false);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default PrivilegeManager;
