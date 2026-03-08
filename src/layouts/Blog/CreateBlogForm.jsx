import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Upload, 
  User, 
  Tag, 
  ImageIcon, 
  Camera,
  Clock,
  Calendar,
  Save,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CreateBlogPost = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    status: 'DRAFT',
    scheduled_date: '',
    published_date: '',
    author_data: {
      name: '',
      bio: '',
    },
    categories_data: [],
    text_blocks_data: [],
  });

  const [categoryInput, setCategoryInput] = useState('');
  const [textBlocks, setTextBlocks] = useState(['']);

  // Initialize scheduled date to tomorrow at 9 AM
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    // Format for datetime-local input
    const formattedDate = tomorrow.toISOString().slice(0, 16);
    
    setFormData(prev => ({
      ...prev,
      scheduled_date: formattedDate
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStatusChange = (value) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleAuthorChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      author_data: {
        ...prev.author_data,
        [name]: value
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
  };

  const handleCategoryInput = (e) => {
    setCategoryInput(e.target.value);
  };

  const addCategory = () => {
    if (categoryInput.trim()) {
      const newCategory = categoryInput.trim();
      if (!formData.categories_data.some(cat => cat.name === newCategory)) {
        setFormData(prev => ({
          ...prev,
          categories_data: [...prev.categories_data, { name: newCategory }]
        }));
      }
      setCategoryInput('');
    }
  };

  const removeCategory = (index) => {
    setFormData(prev => ({
      ...prev,
      categories_data: prev.categories_data.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory();
    }
  };

  const handleTextBlockChange = (index, value) => {
    const newTextBlocks = [...textBlocks];
    newTextBlocks[index] = value;
    setTextBlocks(newTextBlocks);
    
    const validBlocks = newTextBlocks.filter(block => block.trim() !== '');
    setFormData(prev => ({
      ...prev,
      text_blocks_data: validBlocks
    }));
  };

  const addTextBlock = () => {
    setTextBlocks([...textBlocks, '']);
  };

  const removeTextBlock = (index) => {
    if (textBlocks.length === 1) {
      setError('Blog post must have at least one text block.');
      return;
    }

    const newTextBlocks = textBlocks.filter((_, i) => i !== index);
    setTextBlocks(newTextBlocks);
    
    const validBlocks = newTextBlocks.filter(block => block.trim() !== '');
    setFormData(prev => ({
      ...prev,
      text_blocks_data: validBlocks
    }));
  };

  const validateForm = () => {
    setError(null);
    
    if (!formData.title.trim()) {
      setError('Title is required.');
      return false;
    }
    
    if (!formData.author_data.name.trim()) {
      setError('Author name is required.');
      return false;
    }
    
    if (formData.categories_data.length === 0) {
      setError('Please add at least one category.');
      return false;
    }
    
    if (!imageFile) {
      setError('Please upload a featured image for the blog post.');
      return false;
    }
    
    if (formData.text_blocks_data.length === 0) {
      setError('Please add at least one text block.');
      return false;
    }
    
    // Validate scheduled date if status is SCHEDULED
    if (formData.status === 'SCHEDULED') {
      if (!formData.scheduled_date) {
        setError('Scheduled date is required for scheduled posts.');
        return false;
      }
      
      const scheduledDate = new Date(formData.scheduled_date);
      const now = new Date();
      
      if (scheduledDate <= now) {
        setError('Scheduled date must be in the future.');
        return false;
      }
    }
    
    return true;
  };

  const prepareFormData = () => {
    const formDataToSend = new FormData();
    
    // Add basic fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('status', formData.status);
    
    // Add dates based on status
    if (formData.status === 'SCHEDULED' && formData.scheduled_date) {
      formDataToSend.append('scheduled_date', formData.scheduled_date + ':00'); // Add seconds
    }
    
    if (formData.status === 'PUBLISHED') {
      const now = new Date().toISOString();
      formDataToSend.append('published_date', now);
    }
    
    // Add main image file
    if (imageFile) {
      formDataToSend.append('image', imageFile, imageFile.name);
    }
    
    // Prepare author data
    const authorData = {
      name: formData.author_data.name,
      bio: formData.author_data.bio || ''
    };
    
    // Add author data as JSON
    formDataToSend.append('author_data', JSON.stringify(authorData));
    
    // Add categories as JSON
    formDataToSend.append('categories_data', JSON.stringify(formData.categories_data));
    
    // Add text blocks as JSON array
    formDataToSend.append('text_blocks_data', JSON.stringify(formData.text_blocks_data));
    
    // Add profile image file separately
    if (profileImageFile) {
      formDataToSend.append('author_profile_image', profileImageFile, profileImageFile.name);
    }
    
    return formDataToSend;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      const formDataToSend = prepareFormData();
      
      console.log('Submitting blog post...');
      console.log('Status:', formData.status);
      console.log('Scheduled Date:', formData.scheduled_date);
      
      // Get token from localStorage (adjust based on your auth implementation)
      const token = localStorage.getItem('access_token');
      
      // Make the API call directly with proper headers
      const response = await fetch('http://localhost:8000/api/posts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // DON'T set Content-Type - let browser set it with boundary
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { data: errorData } };
      }
      
      const data = await response.json();
      
      const statusMessages = {
        'DRAFT': 'Blog post saved as draft!',
        'SCHEDULED': `Blog post scheduled for ${formatDate(formData.scheduled_date)}!`,
        'PUBLISHED': 'Blog post published successfully!'
      };
      
      setSuccessMessage(statusMessages[formData.status] || 'Blog post created successfully!');
      
      setTimeout(() => {
        navigate(`/blog/${data.slug}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating blog post:', err);
      
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          const errorMessages = [];
          Object.entries(data).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errorMessages.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              errorMessages.push(`${field}: ${errors}`);
            }
          });
          setError(errorMessages.join('\n') || 'Failed to create blog post.');
        } else if (typeof data === 'string') {
          setError(data);
        } else {
          setError('Failed to create blog post. Please check your input.');
        }
      } else {
        setError('Failed to create blog post. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        icon: <EyeOff className="h-4 w-4" />
      },
      SCHEDULED: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: <Clock className="h-4 w-4" />
      },
      PUBLISHED: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <Eye className="h-4 w-4" />
      }
    };
    
    return badges[status] || badges.DRAFT;
  };

  const getButtonText = () => {
    switch(formData.status) {
      case 'DRAFT':
        return (
          <>
            <Save className="h-4 w-4" />
            Save as Draft
          </>
        );
      case 'SCHEDULED':
        return (
          <>
            <Clock className="h-4 w-4" />
            Schedule Post
          </>
        );
      case 'PUBLISHED':
        return (
          <>
            <Send className="h-4 w-4" />
            Publish Now
          </>
        );
      default:
        return 'Create Post';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit}>
        <Card className="shadow-lg border border-gray-100 bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-gray-800">Create New Blog Post</CardTitle>
                <CardDescription className="text-gray-600">
                  Create a new blog post with author details, categories, and content.
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={`px-3 py-1 ${getStatusBadge(formData.status).bg} ${getStatusBadge(formData.status).text} ${getStatusBadge(formData.status).border} flex items-center gap-1`}
                >
                  {getStatusBadge(formData.status).icon}
                  {formData.status.charAt(0) + formData.status.slice(1).toLowerCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {error && (
              <Alert variant="destructive" className="border border-red-200 bg-red-50 text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
              </Alert>
            )}
            
            {successMessage && (
              <Alert className="border border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}
            
            {/* Publishing Status Section */}
            <div className="space-y-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Publishing Options
              </h3>
              
              <Tabs defaultValue="DRAFT" value={formData.status} onValueChange={handleStatusChange}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="DRAFT" className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                    <EyeOff className="h-4 w-4 mr-2" />
                    Draft
                  </TabsTrigger>
                  <TabsTrigger value="SCHEDULED" className="data-[state=active]:bg-yellow-50 data-[state=active]:text-yellow-900">
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule
                  </TabsTrigger>
                  <TabsTrigger value="PUBLISHED" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-900">
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="DRAFT" className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Save as draft to work on it later. It won't be visible to readers.</span>
                  </div>
                </TabsContent>
                
                <TabsContent value="SCHEDULED" className="space-y-4">
                  <div>
                    <Label htmlFor="scheduled_date" className="text-sm font-medium text-gray-700">
                      Scheduled Date & Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="mt-2">
                      <Input
                        id="scheduled_date"
                        name="scheduled_date"
                        type="datetime-local"
                        value={formData.scheduled_date}
                        onChange={handleChange}
                        className="border-gray-200"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Will be published automatically on: <span className="font-medium">{formatDate(formData.scheduled_date)}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>The post will automatically become published when the scheduled time arrives.</span>
                  </div>
                </TabsContent>
                
                <TabsContent value="PUBLISHED" className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Publish immediately. The post will be visible to all readers.</span>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Basic Information Section */}
            <div className="space-y-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                Blog Post Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Blog Post Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Getting Started with Django REST Framework"
                    className="mt-1 border-gray-200"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Featured Image <span className="text-red-500">*</span>
                  </Label>
                  <div className="mt-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="border-gray-200"
                          required
                        />
                      </div>
                      {imagePreview && (
                        <div className="w-24 h-24 rounded-md overflow-hidden border border-gray-200 shadow-sm">
                          <img 
                            src={imagePreview} 
                            alt="Blog preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 1200x630px (will be used as the main blog image)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Author Information Section */}
            <div className="space-y-4 bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Author Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="author_name" className="text-sm font-medium text-gray-700">
                    Author Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="author_name"
                    name="name"
                    value={formData.author_data.name}
                    onChange={handleAuthorChange}
                    placeholder="e.g., John Smith"
                    className="mt-1 border-gray-200"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="author_bio" className="text-sm font-medium text-gray-700">
                    Author Bio
                  </Label>
                  <Textarea
                    id="author_bio"
                    name="bio"
                    value={formData.author_data.bio}
                    onChange={handleAuthorChange}
                    placeholder="Brief description about the author..."
                    className="mt-1 border-gray-200 min-h-[80px]"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Author Profile Image
                  </Label>
                  <div className="mt-1 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="border-gray-200"
                          id="profile_image"
                        />
                      </div>
                      
                      {profileImagePreview ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-blue-200 shadow-sm">
                          <img 
                            src={profileImagePreview} 
                            alt="Author profile preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={removeProfileImage}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
                          <Camera className="h-8 w-8 text-gray-400" />
                          <span className="text-xs text-gray-500 mt-1">No image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Optional. Recommended size: 200x200px (square image works best)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Categories Section */}
            <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <h3 className="text-base font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-blue-600" />
                Categories
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={categoryInput}
                    onChange={handleCategoryInput}
                    onKeyPress={handleCategoryKeyPress}
                    placeholder="Enter a category (e.g., Technology, Programming)"
                    className="flex-1 border-gray-200"
                  />
                  <Button 
                    type="button" 
                    onClick={addCategory}
                    variant="outline"
                    className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.categories_data.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.categories_data.map((category, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"
                      >
                        {category.name}
                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No categories added yet. Categories help readers find your post.
                  </p>
                )}
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Press Enter or click the + button to add a category</span>
                </div>
              </div>
            </div>
            
            <Separator className="bg-gray-200" />
            
            {/* Content Section */}
            <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-medium text-gray-700">Content</h3>
                <Button 
                  type="button" 
                  onClick={addTextBlock} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" /> Add Paragraph
                </Button>
              </div>
              
              <div className="space-y-4">
                {textBlocks.map((text, index) => (
                  <Card key={index} className="bg-gray-50 border border-gray-200">
                    <CardHeader className="pb-2 pt-3 px-4 bg-gray-100 border-b border-gray-200">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base text-gray-700">
                          Paragraph #{index + 1}
                        </CardTitle>
                        {textBlocks.length > 1 && (
                          <Button 
                            type="button" 
                            onClick={() => removeTextBlock(index)} 
                            variant="ghost" 
                            size="sm"
                            className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="px-4 py-3 bg-white">
                      <Textarea
                        value={text}
                        onChange={(e) => handleTextBlockChange(index, e.target.value)}
                        placeholder="Enter paragraph content..."
                        className="border-gray-200 min-h-[100px]"
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Writing Tips</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Keep paragraphs focused and concise</li>
                  <li>• Use clear headings and subheadings</li>
                  <li>• Add images between paragraphs for visual breaks</li>
                  <li>• Use bullet points for lists</li>
                </ul>
              </div>
            </div>
            
            {/* Stats Preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="text-center space-y-1">
                <div className="text-sm text-gray-500">Status</div>
                <Badge 
                  className={`px-3 ${getStatusBadge(formData.status).bg} ${getStatusBadge(formData.status).text} ${getStatusBadge(formData.status).border}`}
                >
                  {formData.status}
                </Badge>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-gray-500">Categories</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formData.categories_data.length}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-gray-500">Paragraphs</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formData.text_blocks_data.length}
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-sm text-gray-500">Total Words</div>
                <div className="text-lg font-semibold text-gray-800">
                  {formData.text_blocks_data.reduce((total, block) => 
                    total + (block ? block.split(/\s+/).length : 0), 0
                  )}
                </div>
              </div>
              
              {formData.status === 'SCHEDULED' && formData.scheduled_date && (
                <div className="col-span-2 md:col-span-4 text-center space-y-1 mt-2">
                  <div className="text-sm text-gray-500">Scheduled For</div>
                  <div className="text-lg font-semibold text-yellow-700">
                    {formatDate(formData.scheduled_date)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between gap-3 pt-2 pb-6 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                {formData.status === 'DRAFT' && 'Post will be saved as draft and not visible to readers.'}
                {formData.status === 'SCHEDULED' && `Post will be published on ${formatDate(formData.scheduled_date)}.`}
                {formData.status === 'PUBLISHED' && 'Post will be published immediately and visible to all readers.'}
              </span>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => navigate('/blog')}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
                className={`
                  flex items-center gap-2
                  ${formData.status === 'DRAFT' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                  ${formData.status === 'SCHEDULED' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                  ${formData.status === 'PUBLISHED' ? 'bg-green-600 hover:bg-green-700' : ''}
                  text-white
                `}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  getButtonText()
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default CreateBlogPost;