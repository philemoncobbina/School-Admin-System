import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getBookList,
  updateBookList,
  deleteBookList,
  CLASS_OPTIONS
} from '../../services/booklistService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const EditBookList = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    academic_year: '',
    class_name: '',
    status: 'draft',
    scheduled_date: null,
    publish_date: null,
    description: '',
    items: []
  });

  // Format helper functions
  const formatDateForInput = date => date ? new Date(date).toISOString().split('T')[0] : '';
  const formatTimeForInput = date => {
    if (!date) return '12:00';
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Helper function to create an empty item
  function createEmptyItem() {
    return {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      is_required: true,
      order: formData.items.length
    };
  }

  // Load data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const bookList = await getBookList(parseInt(id));
        
        setFormData({
          ...bookList,
          scheduled_date: bookList.scheduled_date ? new Date(bookList.scheduled_date) : null,
          publish_date: bookList.publish_date ? new Date(bookList.publish_date) : null
        });
      } catch (err) {
        setError('Failed to load data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Event handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    if (name === 'status') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        scheduled_date: value !== 'scheduled' ? null : prev.scheduled_date
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleScheduledDateChange = e => {
    const { name, value } = e.target;
    const currentDate = formData.scheduled_date ? new Date(formData.scheduled_date) : new Date();
    let newDate;
    
    if (name === 'scheduled_date') {
      newDate = new Date(value);
      if (formData.scheduled_date) {
        newDate.setHours(currentDate.getHours(), currentDate.getMinutes());
      }
    } else if (name === 'scheduled_time') {
      const [hours, minutes] = value.split(':').map(Number);
      newDate = new Date(currentDate);
      newDate.setHours(hours, minutes);
    }
    
    setFormData(prev => ({ ...prev, scheduled_date: newDate }));
  };

  const handleItemChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updatedItems = [...formData.items];
    
    if (type === 'checkbox') {
      updatedItems[index] = { ...updatedItems[index], [name]: checked };
    } else if (name === 'price' || name === 'quantity') {
      updatedItems[index] = { ...updatedItems[index], [name]: parseFloat(value) || 0 };
    } else {
      updatedItems[index] = { ...updatedItems[index], [name]: value };
    }
    
    updatedItems[index].order = index;
    
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const handleItemCheckboxChange = (index, checked) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], is_required: checked };
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
    }));
  };

  const removeItem = index => {
    if (formData.items.length === 1) {
      setError('Book list must have at least one item.');
      return;
    }

    const updatedItems = formData.items.filter((_, i) => i !== index);
    
    // Update order for remaining items
    updatedItems.forEach((item, i) => {
      item.order = i;
    });
    
    setFormData(prev => ({ 
      ...prev, 
      items: updatedItems 
    }));
  };

  const calculateTotalPrice = () => {
    return formData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Delete handling
  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const handleDeleteCancel = () => setShowDeleteConfirm(false);
  
  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      setError(null);
      
      await deleteBookList(parseInt(id));
      setSuccessMessage('Book list deleted successfully!');
      
      setTimeout(() => navigate('/dashboard/booklists'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete book list. Please try again.');
      console.error('Error deleting book list:', err);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Form submission
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!id) return;
    
    // Form validation
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    
    if (!formData.class_name || !formData.academic_year) {
      setError('Class and academic year are required.');
      return;
    }

    // Validate academic year format (e.g., 2024-2025)
    if (!/^\d{4}-\d{4}$/.test(formData.academic_year)) {
      setError('Academic year must be in the format "YYYY-YYYY" (e.g., 2024-2025).');
      return;
    }
    
    if (formData.status === 'scheduled') {
      if (!formData.scheduled_date) {
        setError('Scheduled date is required when status is "Scheduled".');
        return;
      }
      
      if (formData.scheduled_date <= new Date()) {
        setError('Scheduled date must be in the future.');
        return;
      }
    }
    
    if (formData.items.some(item => !item.name.trim() || item.price <= 0)) {
      setError('All items must have a name and a price greater than zero.');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const submissionData = {
        ...formData,
        scheduled_date: formData.scheduled_date ? formData.scheduled_date.toISOString() : null,
        publish_date: formData.publish_date ? formData.publish_date.toISOString() : null
      };
      
      await updateBookList(parseInt(id), submissionData);
      setSuccessMessage('Book list updated successfully!');
      
      setTimeout(() => navigate('/dashboard/booklists'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update book list. Please try again.');
      console.error('Error updating book list:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Format published date for display
  const formatPublishedDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border border-gray-100 bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl text-gray-800">Edit Book List</CardTitle>
                <CardDescription className="text-gray-600">
                  Update your book list information and items.
                </CardDescription>
              </div>
              <Button 
                type="button" 
                onClick={handleDeleteClick} 
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Book List
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {error && (
              <Alert variant="destructive" className="border border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {successMessage && (
              <Alert className="border border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            {/* Basic Information Section */}
            <div className="space-y-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <h3 className="text-base font-medium text-gray-700 mb-3">Basic Information</h3>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Class 1 First Term Book List"
                    className="mt-1 border-gray-200"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="class_name" className="text-sm font-medium text-gray-700">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.class_name} 
                      onValueChange={(value) => handleSelectChange('class_name', value)}
                    >
                      <SelectTrigger id="class_name" className="mt-1 border-gray-200 bg-white">
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {CLASS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                                                                                                                                         
                  <div>
                    <Label htmlFor="academic_year" className="text-sm font-medium text-gray-700">
                      Academic Year <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="academic_year"
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleChange}
                      placeholder="e.g., 2024-2025"
                      className="mt-1 border-gray-200"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: YYYY-YYYY (e.g., 2024-2025)
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Status <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger id="status" className="mt-1 border-gray-200 bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.status === 'scheduled' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-4">
                    <div className="flex items-start mb-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Scheduled Publication</h4>
                        <p className="text-xs text-blue-700">Set when this book list should be automatically published.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <Label htmlFor="scheduled_date" className="text-sm font-medium text-gray-700">
                          Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          id="scheduled_date"
                          name="scheduled_date"
                          value={formatDateForInput(formData.scheduled_date)}
                          onChange={handleScheduledDateChange}
                          className="mt-1 border-gray-200"
                          min={formatDateForInput(new Date())}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled_time" className="text-sm font-medium text-gray-700">
                          Time <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="time"
                          id="scheduled_time"
                          name="scheduled_time"
                          value={formatTimeForInput(formData.scheduled_date)}
                          onChange={handleScheduledDateChange}
                          className="mt-1 border-gray-200"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {formData.status === 'published' && formData.publish_date && (
                  <div className="bg-green-50 border border-green-100 rounded-md p-4">
                    <div className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-green-800">Published</h4>
                        <p className="text-sm text-green-700 mt-1">
                          This book list was published on {formatPublishedDate(formData.publish_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ''}
                    onChange={handleChange}
                    placeholder="Optional description for this book list"
                    className="mt-1 border-gray-200"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Book Items Section */}
            <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-700">Book Items</h3>
                <Button 
                  type="button" 
                  onClick={addItem} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {formData.items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-md border border-dashed border-gray-300">
                    <p>No items added yet. Click "Add Item" to start.</p>
                  </div>
                ) : (
                  formData.items.map((item, index) => (
                    <Card key={index} className="bg-gray-50 border border-gray-200">
                      <CardHeader className="pb-2 pt-3 px-4 bg-gray-100 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base text-gray-700">
                            Item #{index + 1}
                            {item.is_required && (
                              <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700 border border-blue-200">
                                Required
                              </Badge>
                            )}
                          </CardTitle>
                          <Button 
                            type="button" 
                            onClick={() => removeItem(index)} 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4 px-4 py-3 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor={`item-name-${index}`} className="text-sm text-gray-700">
                              Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`item-name-${index}`}
                              name="name"
                              value={item.name}
                              onChange={(e) => handleItemChange(index, e)}
                              placeholder="e.g., Mathematics Textbook"
                              className="mt-1 border-gray-200"
                              required
                            />
                          </div>
                          
                          <div className="flex items-end md:items-center">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`is-required-${index}`}
                                name="is_required"
                                checked={item.is_required}
                                onCheckedChange={(checked) => handleItemCheckboxChange(index, checked)}
                                className="border-gray-300 text-blue-600"
                              />
                              <Label htmlFor={`is-required-${index}`} className="text-sm text-gray-700">
                                Required Item
                              </Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`item-price-${index}`} className="text-sm text-gray-700">
                              Price <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id={`item-price-${index}`}
                              name="price"
                              type="number"
                              value={item.price}
                              onChange={(e) => handleItemChange(index, e)}
                              className="mt-1 border-gray-200"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`item-quantity-${index}`} className="text-sm text-gray-700">
                              Quantity
                            </Label>
                            <Input
                              id={`item-quantity-${index}`}
                              name="quantity"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, e)}
                              className="mt-1 border-gray-200"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor={`item-description-${index}`} className="text-sm text-gray-700">
                            Description
                          </Label>
                          <Textarea
                            id={`item-description-${index}`}
                            name="description"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, e)}
                            placeholder="Optional description"
                            className="mt-1 border-gray-200"
                            rows={2}
                          />
                        </div>
                      </CardContent>
                      
                      <CardFooter className="flex justify-end p-3 bg-gray-50 border-t border-gray-200">
                        <Badge className="bg-gray-100 text-gray-700 border border-gray-300">
                          Item Total: {(item.price * item.quantity).toFixed(2)}
                        </Badge>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Total Price */}
            <div className="flex justify-end">
              <Badge variant="outline" className="text-lg font-semibold py-1 px-3 border-2 border-gray-300 bg-white shadow-sm text-gray-800">
                Total Price: {calculateTotalPrice().toFixed(2)}
              </Badge>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-3 pt-2 pb-6 bg-gray-50 border-t border-gray-100">
            <Button
              type="button"
              onClick={() => navigate('/dashboard/booklists')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this book list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="border-gray-300 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditBookList;