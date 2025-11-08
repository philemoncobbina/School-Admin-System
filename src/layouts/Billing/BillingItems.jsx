import React, { useEffect, useState } from "react";
import { 
  fetchItems, 
  createItem, 
  fetchTemplates, 
  updateItem, 
  deleteItem,
  fetchItemLogs 
} from "../../services/billingService";

const BillingItems = () => {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [filteredItems, setFilteredItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemLogs, setItemLogs] = useState([]);
  const [selectedItemForLogs, setSelectedItemForLogs] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("items"); // "items" or "logs"

  const [form, setForm] = useState({
    billing_template: "",
    item_name: "",
    category: "",
    amount: "",
  });

  useEffect(() => {
    loadItems();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplateId) {
      const filtered = items.filter(item => 
        item.billing_template.toString() === selectedTemplateId.toString()
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems([]);
    }
  }, [selectedTemplateId, items]);

  const loadItems = async () => {
    try {
      const res = await fetchItems();
      setItems(res.data);
    } catch (error) {
      console.error("Failed to load items:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetchTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const loadItemLogs = async (itemId) => {
    setLoadingLogs(true);
    try {
      const res = await fetchItemLogs(itemId);
      setItemLogs(res.data);
      setSelectedItemForLogs(items.find(item => item.id === itemId));
      setShowLogsModal(true);
    } catch (error) {
      console.error("Failed to load item logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem(editingItem.id, form);
        setEditingItem(null);
      } else {
        await createItem(form);
      }
      setForm({ 
        billing_template: selectedTemplateId, 
        item_name: "", 
        category: "", 
        amount: "",
      });
      loadItems();
    } catch (error) {
      console.error("Failed to save item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      billing_template: item.billing_template.toString(),
      item_name: item.item_name,
      category: item.category,
      amount: item.amount.toString(),
    });
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(itemId);
        loadItems();
      } catch (error) {
        console.error("Failed to delete item:", error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setForm({ 
      billing_template: selectedTemplateId, 
      item_name: "", 
      category: "", 
      amount: "",
    });
  };

  const handleTemplateChange = (templateId) => {
    setSelectedTemplateId(templateId);
    setForm({ 
      billing_template: templateId, 
      item_name: "", 
      category: "", 
      amount: "",
    });
    setEditingItem(null);
    setActiveTab("items");
  };

  const getSelectedTemplateName = () => {
    const template = templates.find(t => t.id.toString() === selectedTemplateId.toString());
    return template ? `${template.class_name} - ${template.term} term (${template.academic_year})` : '';
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Billing Items Management</h2>

      {/* Template Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Billing Template
        </label>
        <select
          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">-- Choose a Billing Template --</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.class_name} - {template.term} term ({template.academic_year})
            </option>
          ))}
        </select>
      </div>

      {selectedTemplateId && (
        <>
          {/* Tab Navigation */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="flex space-x-8">
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "items"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("items")}
              >
                Billing Items
              </button>
              <button
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "logs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("logs")}
              >
                Change Logs
              </button>
            </nav>
          </div>

          {activeTab === "items" && (
            <>
              {/* Add/Edit Form */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingItem ? 'Edit Item' : 'Add New Item'} - {getSelectedTemplateName()}
                </h3>
                
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter item name"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.item_name}
                      onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <input
                      type="text"
                      placeholder="Enter category"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (GHS) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Enter amount"
                      className="w-full border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-3 flex gap-2">
                    <button 
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </button>
                    
                    {editingItem && (
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Items Table */}
              <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">
                    Items for {getSelectedTemplateName()} ({filteredItems.length} items)
                  </h3>
                </div>

                {filteredItems.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.item_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.category}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                              GHS {parseFloat(item.amount).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEdit(item)}
                                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => loadItemLogs(item.id)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  View Logs
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No billing items found for this template.</p>
                    <p className="text-sm mt-1">Add your first item using the form above.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "logs" && (
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">
                  Change Logs for {getSelectedTemplateName()}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select an item from the table below to view its change history
                </p>
              </div>

              {filteredItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Current Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.item_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            GHS {parseFloat(item.amount).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => loadItemLogs(item.id)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
                            >
                              View Change History
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No billing items found for this template.</p>
                  <p className="text-sm mt-1">Add items to see their change history.</p>
                </div>
              )}
            </div>
          )}

          {/* Logs Modal */}
          {showLogsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold">
                    Change History: {selectedItemForLogs?.item_name}
                  </h3>
                  <button
                    onClick={() => setShowLogsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {loadingLogs ? (
                    <div className="text-center py-8">
                      <p>Loading logs...</p>
                    </div>
                  ) : itemLogs.length > 0 ? (
                    <div className="space-y-4">
                      {itemLogs.map((log) => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">
                                {log.user_first_name} {log.user_last_name}
                              </p>
                              <p className="text-sm text-gray-600">{log.user_email}</p>
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Changed {log.field_name}:
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Old Value:</p>
                                <p className="font-medium">{log.old_value || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">New Value:</p>
                                <p className="font-medium text-green-600">{log.new_value || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No change history found for this item.</p>
                    </div>
                  )}
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => setShowLogsModal(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedTemplateId && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">Please select a billing template to view and manage its items.</p>
        </div>
      )}
    </div>
  );
};

export default BillingItems;