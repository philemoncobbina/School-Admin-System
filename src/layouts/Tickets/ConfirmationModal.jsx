// components/ConfirmationModal.jsx
import React from 'react';

const ConfirmationModal = ({ showModal, onClose, onConfirm, message }) => {
    if (!showModal) return null; // Don't render if modal is not visible

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-96 p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Confirm Action</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; // Make sure this line is present
