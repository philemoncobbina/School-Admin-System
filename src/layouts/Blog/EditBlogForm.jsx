import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Upload,
  Trash2,
  ArrowLeft,
  Save,
  Calendar,
  Tag,
  User,
  FileText,
  AlertCircle,
  Image as ImageIcon,
  Pencil,
  Eye,
  CalendarClock,
  X,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

/* ---------------------------------------------
   Helper utilities
--------------------------------------------- */
const emptyAuthor = { name: "", bio: "", profile_image: null };

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft", icon: <FileText className="h-4 w-4" /> },
  { value: "SCHEDULED", label: "Scheduled", icon: <CalendarClock className="h-4 w-4" /> },
  { value: "PUBLISHED", label: "Published", icon: <Eye className="h-4 w-4" /> },
];

const STATUS_COLORS = {
  DRAFT: "bg-gray-200 text-gray-800",
  SCHEDULED: "bg-yellow-200 text-yellow-800",
  PUBLISHED: "bg-green-200 text-green-800",
};

/* ---------------------------------------------
   Category Chip Component
--------------------------------------------- */
const CategoryChip = ({ category, onRemove }) => (
  <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
    <Tag className="h-3 w-3" />
    {category.name}
    <button
      type="button"
      onClick={() => onRemove(category.id)}
      className="ml-1 hover:text-destructive"
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
);

/* ---------------------------------------------
   Image Preview Component with external controls
--------------------------------------------- */
const ImagePreviewWithControls = ({ preview, onRemove, onChange, type, imageRef, label }) => {
  const isAuthor = type === "author";
  const imageUrl = isAuthor ? preview.author : preview.blog;
  
  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <div className="border-2 border-dashed rounded-lg p-4">
            {imageUrl ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    className={`rounded-lg max-h-60 ${isAuthor ? 'rounded-full w-40 h-40 object-cover' : 'w-auto'}`}
                    alt={`${type} preview`}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageRef.current.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={onRemove}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer text-center py-8"
                onClick={() => imageRef.current.click()}
              >
                {isAuthor ? (
                  <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                ) : (
                  <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                )}
                <p className="text-muted-foreground mb-2">
                  Click to upload {isAuthor ? 'author' : 'blog'} image
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAuthor ? 'Square image recommended (1:1 ratio)' : 'Recommended: 1200×630px, max 5MB'}
                </p>
              </div>
            )}
            <input
              ref={imageRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => e.target.files[0] && onChange(e.target.files[0], type)}
            />
          </div>
        </div>
        
        {isAuthor && (
          <div className="flex-1 space-y-2">
            <p className="text-sm font-medium">Image Requirements:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Square image recommended (1:1 ratio)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Minimum size: 200×200px
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Max file size: 5MB
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Formats: JPG, PNG, WebP
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------------------------
   Main Component
--------------------------------------------- */
const EditBlogForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const blogImgRef = useRef(null);
  const authorImgRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [preview, setPreview] = useState({ blog: null, author: null });

  const [form, setForm] = useState({
    title: "",
    status: "DRAFT",
    scheduled_date: "",
    image: null,
    author: emptyAuthor,
    content: [{ id: 1, text: "", order: 1 }],
  });

  /* ---------------------------------------------
     Fetch blog data
  --------------------------------------------- */
  useEffect(() => {
    loadBlog();
  }, [slug]);

  const loadBlog = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/posts/${slug}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      // Parse text_blocks from the API response
      let contentBlocks = [];
      if (data.text_blocks && data.text_blocks.length > 0) {
        contentBlocks = data.text_blocks.map((block, index) => {
          // The content field contains the actual text
          let contentText = "";
          
          if (typeof block.content === 'string') {
            contentText = block.content;
          } else if (block.content && typeof block.content === 'object') {
            // If it's an object, extract the content property
            contentText = block.content.content || JSON.stringify(block.content);
          }
          
          return {
            id: block.id || index + 1,
            text: contentText,
            order: block.order || index + 1
          };
        });
      }

      // If no content blocks were created, create a default one
      if (contentBlocks.length === 0) {
        contentBlocks = [{ id: 1, text: "", order: 1 }];
      }

      setForm({
        title: data.title || "",
        status: data.status || "DRAFT",
        scheduled_date: data.scheduled_date
          ? format(new Date(data.scheduled_date), "yyyy-MM-dd'T'HH:mm")
          : "",
        image: null,
        author: data.author || emptyAuthor,
        content: contentBlocks,
      });

      // Set selected categories from blog data
      setSelectedCategories(data.categories || []);

      setPreview({
        blog: data.image,
        author: data.author?.profile_image,
      });
    } catch (err) {
      console.error("Error loading blog:", err);
      setError("Failed to load blog post");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------------------
     Handlers
  --------------------------------------------- */
  const update = (key, value) =>
    setForm((p) => ({ ...p, [key]: value }));

  const updateAuthor = (key, value) =>
    setForm((p) => ({
      ...p,
      author: { ...p.author, [key]: value },
    }));

  // Handle status change with automatic scheduled_date clearing
  const handleStatusChange = (newStatus) => {
    setForm((prev) => ({
      ...prev,
      status: newStatus,
      // Clear scheduled_date if status is not SCHEDULED
      scheduled_date: newStatus === "SCHEDULED" ? prev.scheduled_date : "",
    }));
  };

  const handleImage = (file, type) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () =>
      setPreview((p) => ({ ...p, [type]: reader.result }));

    reader.readAsDataURL(file);

    if (type === "blog") {
      update("image", file);
    } else {
      updateAuthor("profile_image", file);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;

    // Check if category already exists in selected categories
    const exists = selectedCategories.some(
      cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
    );

    if (exists) {
      setError("This category is already added");
      return;
    }

    // Create a temporary category object
    const tempCategory = {
      id: `temp-${Date.now()}`,
      name: newCategory.trim(),
      temp: true
    };
    setSelectedCategories([...selectedCategories, tempCategory]);
    
    setNewCategory("");
    setError(""); // Clear any previous errors
  };

  const handleRemoveCategory = (categoryId) => {
    setSelectedCategories(selectedCategories.filter(cat => cat.id !== categoryId));
  };

  const removeImage = (type) => {
    if (type === "blog") {
      update("image", null);
      setPreview((p) => ({ ...p, blog: null }));
    } else {
      updateAuthor("profile_image", null);
      setPreview((p) => ({ ...p, author: null }));
    }
  };

  // Content blocks management
  const addContentBlock = () => {
    const newId = form.content.length > 0 
      ? Math.max(...form.content.map(block => block.id)) + 1 
      : 1;
    
    setForm(prev => ({
      ...prev,
      content: [
        ...prev.content,
        { id: newId, text: "", order: prev.content.length + 1 }
      ]
    }));
  };

  const updateContentBlock = (id, text) => {
    setForm(prev => ({
      ...prev,
      content: prev.content.map(block => 
        block.id === id ? { ...block, text } : block
      )
    }));
  };

  const removeContentBlock = (id) => {
    if (form.content.length === 1) {
      // Don't remove the last block, just clear it
      setForm(prev => ({
        ...prev,
        content: [{ id: 1, text: "", order: 1 }]
      }));
    } else {
      setForm(prev => ({
        ...prev,
        content: prev.content
          .filter(block => block.id !== id)
          .map((block, index) => ({ ...block, order: index + 1 }))
      }));
    }
  };

  const validate = () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return false;
    }
    if (!form.author.name.trim()) {
      setError("Author name is required");
      return false;
    }
    
    // Check if any content block has text
    const hasContent = form.content.some(block => block.text.trim());
    if (!hasContent) {
      setError("At least one content block with text is required");
      return false;
    }
    
    if (!preview.blog) {
      setError("Blog image is required");
      return false;
    }
    if (!preview.author) {
      setError("Author image is required");
      return false;
    }
    if (selectedCategories.length === 0) {
      setError("At least one category is required");
      return false;
    }
    if (form.status === "SCHEDULED" && !form.scheduled_date) {
      setError("Scheduled date is required for scheduled posts");
      return false;
    }
    return true;
  };

  /* ---------------------------------------------
     Submit
  --------------------------------------------- */
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!validate()) return;

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("status", form.status);
    
    // Only append scheduled_date if status is SCHEDULED and date exists
    if (form.status === "SCHEDULED" && form.scheduled_date) {
      fd.append("scheduled_date", form.scheduled_date);
    }
    
    // Author data
    fd.append("author_data", JSON.stringify({
      name: form.author.name.trim(),
      bio: form.author.bio || "",
    }));
    
    // Categories data - only include names
    const categoriesData = selectedCategories.map(cat => ({
      name: cat.name
    }));
    fd.append("categories_data", JSON.stringify(categoriesData));
    
    // Text blocks - Send only the content string, not wrapped in an object
    const textBlocks = form.content
      .filter(block => block.text.trim())
      .map(block => block.text.trim());
    
    fd.append("text_blocks_data", JSON.stringify(textBlocks));

    // Handle images
    if (form.image) {
      fd.append("image", form.image);
    }
    if (form.author.profile_image) {
      fd.append("author_profile_image", form.author.profile_image);
    }

    try {
      setSaving(true);
      const res = await fetch(
        `http://localhost:8000/api/posts/${slug}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
          body: fd,
        }
      );

      const data = await res.json();
      
      if (!res.ok) {
        // Handle validation errors
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          throw new Error(errorMessages);
        }
        throw new Error(data.detail || "Failed to update blog");
      }

      setSuccess("Blog updated successfully!");
      setTimeout(() => navigate("/dashboard/blog"), 1200);
    } catch (error) {
      setError(error.message || "Failed to update blog");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------------------------------------
     Delete
  --------------------------------------------- */
  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(
        `http://localhost:8000/api/posts/${slug}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );

      if (!res.ok) throw new Error();

      setSuccess("Blog deleted successfully");
      setTimeout(() => navigate("/dashboard/blog"), 1000);
    } catch {
      setError("Failed to delete blog");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  /* ---------------------------------------------
     UI
  --------------------------------------------- */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Blog Post</h1>
          <p className="text-muted-foreground">
            Update your blog post details and content
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={`${STATUS_COLORS[form.status]} px-3 py-1`}>
            {form.status}
          </Badge>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the blog post.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      <form onSubmit={submit} className="space-y-8">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Set up your blog post title and status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Blog Title *</Label>
              <Input
                id="title"
                placeholder="Enter blog title"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </div>

            {/* Status and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.status === "SCHEDULED" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="scheduled_date"
                      type="datetime-local"
                      value={form.scheduled_date}
                      onChange={(e) => update("scheduled_date", e.target.value)}
                      required={form.status === "SCHEDULED"}
                      min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleStatusChange("DRAFT")}
                      size="icon"
                      title="Clear schedule and set to Draft"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    The post will be automatically published at this time
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blog Image Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Featured Image
            </CardTitle>
            <CardDescription>
              Upload or change the main image for your blog post
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImagePreviewWithControls
              preview={preview}
              onRemove={() => removeImage("blog")}
              onChange={handleImage}
              type="blog"
              imageRef={blogImgRef}
              label="Blog Image *"
            />
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Blog Content
                </CardTitle>
                <CardDescription>
                  Write your blog content in multiple sections. Add or remove content blocks as needed.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addContentBlock}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {form.content.map((block, index) => (
              <div key={block.id} className="space-y-4 border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">
                    Section {index + 1}
                  </Label>
                  {form.content.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeContentBlock(block.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
                <Textarea
                  value={block.text}
                  onChange={(e) => updateContentBlock(block.id, e.target.value)}
                  placeholder={`Write section ${index + 1} content here...`}
                  rows={8}
                  className="font-mono"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {block.text.split(/\n+/).filter(line => line.trim()).length} line(s)
                  </span>
                  <span>
                    {block.text.length} characters
                  </span>
                </div>
              </div>
            ))}
            
            {form.content.length === 0 && (
              <div className="text-center py-8 border rounded-lg">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No content sections added yet</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={addContentBlock}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Section
                </Button>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              Total content sections: {form.content.length} | 
              Total characters: {form.content.reduce((total, block) => total + block.text.length, 0)}
            </div>
          </CardContent>
        </Card>

        {/* Categories Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>
              Manage categories for your blog post. Add new categories or remove existing ones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Selected Categories */}
              <div className="space-y-2">
                <Label>Current Categories</Label>
                {selectedCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map((category) => (
                      <CategoryChip
                        key={category.id}
                        category={category}
                        onRemove={handleRemoveCategory}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No categories selected. Please add at least one category.
                  </p>
                )}
              </div>

              {/* Add New Category */}
              <div className="space-y-2">
                <Label htmlFor="new-category">Add New Category</Label>
                <div className="flex gap-2">
                  <Input
                    id="new-category"
                    placeholder="Enter new category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={!newCategory.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Author Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Author Information
            </CardTitle>
            <CardDescription>
              Update author details and profile image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Author Name */}
            <div className="space-y-2">
              <Label htmlFor="author-name">Author Name *</Label>
              <Input
                id="author-name"
                placeholder="Enter author name"
                value={form.author.name}
                onChange={(e) => updateAuthor("name", e.target.value)}
                required
              />
            </div>

            {/* Author Bio */}
            <div className="space-y-2">
              <Label htmlFor="author-bio">Author Bio</Label>
              <Textarea
                id="author-bio"
                rows={3}
                placeholder="Enter author biography"
                value={form.author.bio}
                onChange={(e) => updateAuthor("bio", e.target.value)}
              />
            </div>

            {/* Author Image */}
            <ImagePreviewWithControls
              preview={preview}
              onRemove={() => removeImage("author")}
              onChange={handleImage}
              type="author"
              imageRef={authorImgRef}
              label="Author Profile Image *"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t">
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/blog")}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
            <p className="text-xs text-muted-foreground">
              All unsaved changes will be lost
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditBlogForm;

