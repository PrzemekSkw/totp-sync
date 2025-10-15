import { useState } from 'react';
import { Plus, Upload, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import TOTPCard from '../components/TOTPCard';
import AddEntryModal from '../components/AddEntryModal';
import ImportModal from '../components/ImportModal';
import ExportModal from '../components/ExportModal';

export default function Dashboard() {
  const { entries, isLoadingEntries, deleteEntry } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle pojedynczego wpisu
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Toggle wszystkich
  const toggleSelectAll = () => {
    if (selectedIds.length === entries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(entries.map((e) => e.id));
    }
  };

  // Usuń zaznaczone
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    if (!confirm(`Delete ${selectedIds.length} selected entries?`)) return;

    setIsDeleting(true);
    
    for (const id of selectedIds) {
      await deleteEntry(id);
    }
    
    setSelectedIds([]);
    setIsDeleting(false);
    toast.success(`Deleted ${selectedIds.length} entries`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <Navbar />

      {/* Action Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Your Accounts
              </h2>
              
              {entries.length > 0 && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === entries.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    Select All {selectedIds.length > 0 && `(${selectedIds.length})`}
                  </span>
                </label>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Delete Selected */}
              {selectedIds.length > 0 && (
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={handleDeleteSelected}
                  loading={isDeleting}
                >
                  Delete ({selectedIds.length})
                </Button>
              )}
              
              {/* Import/Export */}
              <Button
                variant="secondary"
                icon={Upload}
                onClick={() => setShowImportModal(true)}
              >
                Import
              </Button>
              <Button
                variant="secondary"
                icon={Download}
                onClick={() => setShowExportModal(true)}
              >
                Export
              </Button>

              {/* Add Entry */}
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowAddModal(true)}
              >
                Add Entry
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingEntries ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card h-48 skeleton" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No entries yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add your first TOTP entry to get started
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowAddModal(true)}
            >
              Add Entry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry) => (
              <TOTPCard 
                key={entry.id} 
                entry={entry}
                isSelected={selectedIds.includes(entry.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddEntryModal onClose={() => setShowAddModal(false)} />
      )}
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} />
      )}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}
