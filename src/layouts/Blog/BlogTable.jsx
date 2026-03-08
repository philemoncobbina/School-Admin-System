// components/Blog/BlogTable.jsx
import React, { useState, useEffect } from 'react';
import { blogApi } from '../../Services/blogApi';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination';
import { Skeleton } from '../../components/ui/skeleton';
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
} from '../../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  FileText, 
  Plus, 
  ChevronDown, 
  Search,
  EyeOff,
  Clock,
  Calendar,
  CalendarClock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const BlogTable = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
    fetchCategories();
  }, [currentPage, selectedCategory, selectedStatus, searchTerm]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    // Auto-hide message after 3 seconds
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        search: searchTerm,
        ...(selectedCategory && { 'categories__name': selectedCategory }),
        ...(selectedStatus && { 'status': selectedStatus })
      };
      
      const response = await blogApi.getAllBlogs(params);
      setBlogs(response.data.results || response.data);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      showMessage('error', 'Failed to fetch blogs');
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // Assuming you have an API endpoint to fetch categories
      // If not, you can extract categories from blogs or use a separate API
      const response = await blogApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // If there's no categories API, you can extract unique categories from blogs
      if (blogs.length > 0) {
        const uniqueCategories = [];
        blogs.forEach(blog => {
          blog.categories.forEach(cat => {
            if (!uniqueCategories.some(uc => uc.id === cat.id)) {
              uniqueCategories.push(cat);
            }
          });
        });
        setCategories(uniqueCategories);
      }
    }
  };

  const handleDelete = async (slug) => {
    try {
      await blogApi.deleteBlog(slug);
      showMessage('success', 'Blog deleted successfully');
      fetchBlogs(); // Refresh the list
    } catch (error) {
      showMessage('error', 'Failed to delete blog');
      console.error('Error deleting blog:', error);
    }
  };

  const handleEdit = (slug) => {
    navigate(`/dashboard/blog/edit-blog/${slug}`);
  };

  const handleCreate = () => {
    navigate('/dashboard/blog/create-blog');
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBlogs();
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCategoryDropdown(false);
    setCurrentPage(1);
  };

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setShowStatusDropdown(false);
    setCurrentPage(1);
  };

  const getStatusBadge = (status, scheduled_date = null) => {
    const badges = {
      DRAFT: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border border-gray-300',
        icon: <EyeOff className="h-3 w-3" />,
        label: 'Draft'
      },
      SCHEDULED: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border border-yellow-200',
        icon: <Clock className="h-3 w-3" />,
        label: 'Scheduled'
      },
      PUBLISHED: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border border-green-200',
        icon: <CheckCircle className="h-3 w-3" />,
        label: 'Published'
      }
    };
    
    return badges[status] || badges.DRAFT;
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'All Categories';
    return selectedCategory;
  };

  const getSelectedStatusName = () => {
    if (!selectedStatus) return 'All Status';
    const statusNames = {
      'DRAFT': 'Draft',
      'SCHEDULED': 'Scheduled',
      'PUBLISHED': 'Published'
    };
    return statusNames[selectedStatus] || selectedStatus;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusAction = async (blog, action) => {
    try {
      let response;
      if (action === 'publish') {
        response = await blogApi.publishBlog(blog.slug);
        showMessage('success', 'Blog published successfully!');
      } else if (action === 'schedule') {
        response = await blogApi.scheduleBlog(blog.slug, {
          scheduled_date: new Date().toISOString()
        });
        showMessage('success', 'Blog scheduled successfully!');
      }
      
      if (response) {
        fetchBlogs(); // Refresh the list
      }
    } catch (error) {
      showMessage('error', `Failed to ${action} blog`);
      console.error(`Error ${action}ing blog:`, error);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <div className="space-y-4 p-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-800 border border-red-200' 
            : 'bg-green-50 text-green-800 border border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {message.type === 'error' ? (
                <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              )}
              <span>{message.text}</span>
            </div>
            <button 
              onClick={() => setMessage({ type: '', text: '' })}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-500 mt-1">Manage your blog posts</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Blog
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4 md:space-y-0 md:flex md:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search blogs by title..."
                  className="w-full pl-10"
                />
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full md:w-48 flex items-center justify-between h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className={!selectedCategory ? 'text-muted-foreground' : ''}>
                    {getSelectedCategoryName()}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute z-50 w-full md:w-48 mt-1 bg-popover text-popover-foreground shadow-md rounded-md border">
                    <div className="max-h-48 overflow-y-auto p-1">
                      <button
                        type="button"
                        onClick={() => handleCategorySelect('')}
                        className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                          !selectedCategory ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => handleCategorySelect(category.name)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                            selectedCategory === category.name ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="w-full md:w-48 flex items-center justify-between h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <span className={!selectedStatus ? 'text-muted-foreground' : ''}>
                    {getSelectedStatusName()}
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute z-50 w-full md:w-48 mt-1 bg-popover text-popover-foreground shadow-md rounded-md border">
                    <div className="max-h-48 overflow-y-auto p-1">
                      <button
                        type="button"
                        onClick={() => handleStatusSelect('')}
                        className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                          !selectedStatus ? 'bg-accent text-accent-foreground' : ''
                        }`}
                      >
                        All Status
                      </button>
                      {['DRAFT', 'SCHEDULED', 'PUBLISHED'].map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusSelect(status)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground ${
                            selectedStatus === status ? 'bg-accent text-accent-foreground' : ''
                          }`}
                        >
                          {status === 'DRAFT' ? 'Draft' : 
                           status === 'SCHEDULED' ? 'Scheduled' : 
                           'Published'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full md:w-auto gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Blog Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogs.map((blog) => {
                  const statusBadge = getStatusBadge(blog.status, blog.scheduled_date);
                  return (
                  <TableRow key={blog.id}>
                    <TableCell>
                      <div className="flex items-center gap-4">
                        {blog.image_url && (
                          <img
                            src={blog.image_url}
                            alt={blog.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-xs">{blog.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            {blog.published_date && blog.status === 'PUBLISHED' && (
                              <>
                                <Calendar className="h-3 w-3" />
                                {formatDate(blog.published_date)}
                              </>
                            )}
                            {blog.scheduled_date && blog.status === 'SCHEDULED' && (
                              <>
                                <CalendarClock className="h-3 w-3" />
                                {formatDate(blog.scheduled_date)}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {blog.categories.map((category) => (
                          <Badge
                            key={category.id}
                            variant="secondary"
                            className="whitespace-nowrap text-xs"
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm truncate max-w-[150px]">{blog.author?.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} flex items-center gap-1 px-2 py-1`}
                        >
                          {statusBadge.icon}
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className='bg-white' align="end">
                            <DropdownMenuItem onClick={() => handleEdit(blog.slug)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete
                                    the blog post "{blog.title}".
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(blog.slug)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {blogs.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No blog posts found</h3>
              <p className="text-gray-500 mb-6">
                {selectedCategory || selectedStatus || searchTerm 
                  ? 'Try changing your filters or search term'
                  : 'Get started by creating a new blog post'}
              </p>
              <Button onClick={handleCreate}>
                Create New Blog
              </Button>
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {totalPages > 1 && blogs.length > 0 && (
          <div className="border-t px-6 py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNum)}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
};

export default BlogTable;