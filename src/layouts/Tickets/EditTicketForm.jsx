import React, { useState, useEffect, useRef } from 'react';
import { fetchTickets, deleteTicket, editTicket, fetchTicketLogs } from '../../Services/TicketService';
import { useParams, useNavigate } from 'react-router-dom';
import UserService from '../../Services/UserService';
import { ArrowLeft, Download, ZoomIn, ZoomOut, X, Maximize2, Minimize2, RotateCw } from 'lucide-react';

// Import shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";

// Custom component for Spinner
const Spinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const EditTicketForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    section: '',
    severity: '',
    description: '',
    status: 'unattended',
  });
  const [existingScreenshot, setExistingScreenshot] = useState(null);
  const [error, setError] = useState(null);
  const [ticketLogs, setTicketLogs] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNoAccessDialogOpen, setIsNoAccessDialogOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const imageRef = useRef(null);

  useEffect(() => {
    const loadTicket = async () => {
      setIsLoading(true);
      try {
        const fetchedTickets = await fetchTickets();
        const ticketData = fetchedTickets.find(ticket => ticket.id.toString() === id.toString());
        
        if (ticketData) {
          setTicket(ticketData);
          setFormData(ticketData);
          setExistingScreenshot(ticketData.screenshot);
        } else {
          setError('Ticket not found');
        }
      } catch (err) {
        setError('Error fetching ticket data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTicketLogs = async () => {
      try {
        const logs = await fetchTicketLogs(id);
        setTicketLogs(logs);
      } catch (err) {
        console.error('Error fetching ticket logs:', err);
      }
    };

    const getUserRole = async () => {
      try {
        const userDetails = await UserService.getUserDetails();
        setUserRole(userDetails.role);
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    loadTicket();
    loadTicketLogs();
    getUserRole();
  }, [id]);

  // Reset zoom and rotation when lightbox opens
  useEffect(() => {
    if (isLightboxOpen) {
      setZoomLevel(1);
      setRotation(0);
      setIsImageLoading(true);
    }
  }, [isLightboxOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSubmit = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key !== 'screenshot') {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      await editTicket(id, formDataToSubmit);
      
      // Use shadcn toast instead of alert in a production app
      alert('Ticket updated successfully!');
      navigate('/dashboard/tickets');
    } catch (err) {
      console.error('Error updating ticket:', err);
      setError('Error updating ticket');
    }
  };

  const openDeleteDialog = () => {
    if (userRole === 'principal') {
      setIsDeleteDialogOpen(true);
    } else {
      setIsNoAccessDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteTicket(id);
      alert('Ticket deleted successfully');
      navigate('/tickets');
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Error deleting ticket');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDownloadImage = () => {
    if (!existingScreenshot) return;

    // Create a canvas to handle image transformations if needed
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.crossOrigin = "Anonymous";  // Handle CORS if needed
    img.onload = function() {
      // Set canvas dimensions
      if (rotation % 180 !== 0) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      // Clear the canvas and apply transformations
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${id}-screenshot.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Clean up
      }, 'image/png');
    };
    
    img.src = existingScreenshot;
  };

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoomLevel(1);
  const rotateImage = () => setRotation(prev => (prev + 90) % 360);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'unattended':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">Unattended</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'low':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200">Low</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">Medium</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200">High</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200">Critical</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-md border border-red-100 shadow-md">
          <CardHeader className="bg-red-50 border-b border-red-100">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
          <CardFooter className="bg-gray-50 border-t border-gray-100">
            <Button 
              onClick={() => navigate('/dashboard/tickets')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Tickets
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Card className="w-full max-w-md border shadow-md">
          <CardContent className="pt-6 flex items-center justify-center h-32">
            <Spinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center space-x-2 text-blue-600 hover:bg-blue-50" 
          onClick={() => navigate('/dashboard/tickets')}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Reservations</span>
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">Edit Reservation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Card */}
        <Card className="lg:col-span-2 border border-gray-200 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-gray-800">Reservation Details</CardTitle>
            <CardDescription className="text-gray-500">Update the reservation information</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="edit-form" onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="full_name">Full Name</label>
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">Email</label>
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="phone_number">Phone Number</label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="section">Section</label>
                  <Select 
                    name="section" 
                    value={formData.section} 
                    onValueChange={(value) => handleSelectChange("section", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="authentication">Authentication</SelectItem>
                      <SelectItem value="reservation">Reservation Booking</SelectItem>
                      <SelectItem value="admissions">Admissions</SelectItem>
                      <SelectItem value="others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="severity">Severity</label>
                  <Select 
                    name="severity" 
                    value={formData.severity} 
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="status">Status</label>
                  <Select 
                    name="status" 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200">
                      <SelectItem value="unattended">Unattended</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700" htmlFor="description">Description</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-gray-100 pt-4 bg-gray-50">
            <div className="flex space-x-2">
              <Button 
                type="submit"
                form="edit-form"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Update Reservation
              </Button>
            </div>
            <Button 
              variant="destructive" 
              onClick={openDeleteDialog}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Reservation
            </Button>
          </CardFooter>
        </Card>

        {/* Screenshot and Status Card */}
        <Card className="border border-gray-200 shadow-md bg-white">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="text-gray-800">Reservation Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-500">Current Status</span>
                <div>{getStatusBadge(formData.status)}</div>
              </div>
              
              <div className="flex flex-col space-y-1">
                <span className="text-sm text-gray-500">Severity</span>
                <div>{getSeverityBadge(formData.severity)}</div>
              </div>
              
              <Separator className="bg-gray-200" />
              
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-700">Screenshot</span>
                {existingScreenshot ? (
                  <div className="relative overflow-hidden rounded-md border border-gray-200 shadow-sm bg-gray-100">
                    <img
                      src={existingScreenshot}
                      alt="Ticket Screenshot"
                      className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsLightboxOpen(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-3 flex justify-between items-center">
                        <Button 
                          size="sm" 
                          onClick={handleDownloadImage}
                          className="bg-white/90 hover:bg-white text-gray-800"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => setIsLightboxOpen(true)}
                          className="bg-white/90 hover:bg-white text-gray-800"
                        >
                          <Maximize2 className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 bg-gray-50 rounded-md border border-dashed border-gray-300 text-gray-500 text-sm">
                    No screenshot available
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log Card */}
      <Card className="mt-6 border border-gray-200 shadow-md bg-white">
        <CardHeader className="bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-gray-800">Activity Log</CardTitle>
          <CardDescription className="text-gray-500">History of changes to this reservation</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-700">Date</TableHead>
                  <TableHead className="text-gray-700">User</TableHead>
                  <TableHead className="text-gray-700">Changed Fields</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketLogs.length > 0 ? (
                  ticketLogs.map((log, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <TableCell className="font-medium text-gray-700">{new Date(log.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-gray-600">{log.user_email}</TableCell>
                      <TableCell className="text-gray-600">{log.changed_fields}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Lightbox Dialog */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Lightbox Header */}
          <div className="p-4 bg-black/90 flex justify-between items-center border-b border-gray-800">
            <h3 className="text-lg font-medium text-white">Screenshot Preview</h3>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomOut}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={resetZoom}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <Minimize2 className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={zoomIn}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={rotateImage}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <RotateCw className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDownloadImage}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <Download className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLightboxOpen(false)}
                className="text-white hover:bg-white/10 focus:ring-1 focus:ring-white/30"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Lightbox Content */}
          <div className="flex-1 overflow-hidden relative">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Spinner />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center overflow-auto">
              <div 
                className="transition-all duration-300 ease-in-out cursor-move"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  ref={imageRef}
                  src={existingScreenshot}
                  alt="Screenshot Fullsize"
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setIsImageLoading(false)}
                  style={{ 
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)"
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Lightbox Footer */}
          <div className="p-4 bg-black/90 text-gray-300 border-t border-gray-800 text-sm">
            <div className="flex justify-between items-center">
              <div>
                Zoom: {Math.round(zoomLevel * 100)}% • Rotation: {rotation}°
              </div>
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownloadImage}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete the reservation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-gray-100 pt-4">
            <AlertDialogCancel className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNoAccessDialogOpen} onOpenChange={setIsNoAccessDialogOpen}>
        <AlertDialogContent className="bg-white border border-gray-200 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Access Denied</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              You do not have permission to delete reservations. Only principals can perform this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-gray-100 pt-4">
            <AlertDialogAction 
              onClick={() => setIsNoAccessDialogOpen(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditTicketForm;