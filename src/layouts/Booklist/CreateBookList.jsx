import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBookList, CLASS_OPTIONS } from '../../services/booklistService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CreateBookList = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    academic_year: '',
    class_name: '',
    status: 'draft',
    description: '',
    items: [createEmptyItem()]
  });

  // Helper function to create an empty item
  function createEmptyItem() {
    return {
      name: '',
      description: '',
      price: 0,
      quantity: 1,
      is_required: true,
      order: 0
    };
  }

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item field changes
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...formData.items];
    
    if (name === 'is_required') {
      // For checkbox
      updatedItems[index] = { ...updatedItems[index], [name]: e.target.checked };
    } else if (name === 'price' || name === 'quantity') {
      // For numeric fields
      updatedItems[index] = { ...updatedItems[index], [name]: parseFloat(value) || 0 };
    } else {
      updatedItems[index] = { ...updatedItems[index], [name]: value };
    }
    
    // Update order based on index
    updatedItems[index].order = index;
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Handle checkbox changes for items
  const handleItemCheckboxChange = (index, checked) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], is_required: checked };
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
    }));
  };

  // Remove item
  const removeItem = (index) => {
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

  // Calculate total price
  const calculateTotalPrice = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Validate academic year format (e.g., 2024-2025)
  const isValidAcademicYear = (year) => {
    return /^\d{4}-\d{4}$/.test(year);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    
    if (!formData.class_name) {
      setError('Class is required.');
      return;
    }
    
    if (!formData.academic_year) {
      setError('Academic year is required.');
      return;
    }
    
    if (!isValidAcademicYear(formData.academic_year)) {
      setError('Academic year must be in the format "YYYY-YYYY" (e.g., 2024-2025).');
      return;
    }
    
    // Validate items
    const invalidItems = formData.items.filter(item => !item.name.trim() || item.price <= 0);
    if (invalidItems.length > 0) {
      setError('All items must have a name and a price greater than zero.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Always save as draft
      const bookListToSave = {
        ...formData,
        status: 'draft'
      };
      
      await createBookList(bookListToSave);
      
      setSuccessMessage('Book list saved as draft successfully!');
      
      // Reset form or navigate away
      setTimeout(() => {
        navigate(`/dashboard/booklists/`);
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create book list. Please try again.');
      console.error('Error creating book list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border border-gray-100 bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-2xl text-gray-800">Create New Book List</CardTitle>
            <CardDescription className="text-gray-600">
              Create a new book list for your class. All saved lists will start as drafts.
            </CardDescription>
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
                    <Label htmlFor="class_name" className="text-sm  font-medium text-gray-700">
                      Class <span className="text-red-500">*</span>
                    </Label>
                    <Select className="bg-white border-gray-400"
                      id="class_name"                                                                                               
                      value={formData.class_name} 
                      onValueChange={(value) => handleSelectChange('class_name', value)}
                    >
                      <SelectTrigger className="mt-1 border-gray-200 bg-white">
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
                {formData.items.map((item, index) => (
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
                ))}
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
              onClick={() => navigate('/booklists')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? 'Saving...' : 'Save as Draft'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CreateBookList;