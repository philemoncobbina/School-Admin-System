import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Copy, Users, Mail, Plus, Loader2 } from 'lucide-react';
import { getSubscriptions, deleteSubscription, getEmailList, updateEmailList } from '../../Services/SubscriptionService';

const Subscription = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newEmails, setNewEmails] = useState('');
  const [emailList, setEmailList] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchEmailList();
  }, []);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (error) {
      setError("Failed to fetch subscriptions.");
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmailList = async () => {
    try {
      const data = await getEmailList();
      if (data && data.length > 0 && data[0].emails) {
        setEmailList(data[0].emails);
      } else {
        setEmailList('No emails available');
      }
    } catch (error) {
      console.error("Failed to fetch email list:", error);
      setError("Failed to load email list.");
    }
  };

  const handleDeleteSubscription = async (id) => {
    setDeleting(id);
    setError(null);
    try {
      await deleteSubscription(id);
      setSuccess("Subscription deleted successfully.");
      fetchSubscriptions();
    } catch (error) {
      setError("Failed to delete subscription.");
      console.error("Failed to delete subscription:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdateEmailList = async () => {
    if (!newEmails.trim()) {
      setError("Please enter one or more email addresses.");
      return;
    }
    setUpdating(true);
    try {
      const emailsArray = newEmails.split(';').map(email => email.trim());
      await updateEmailList(emailsArray);
      setSuccess("Email list updated successfully.");
      setNewEmails('');
      fetchEmailList();
    } catch (error) {
      setError("Failed to update email list.");
      console.error("Failed to update email list:", error);
    } finally {
      setUpdating(false);
    }
  };

  const copyEmailList = async () => {
    try {
      await navigator.clipboard.writeText(emailList);
      setSuccess("Email list copied to clipboard!");
    } catch (err) {
      setError("Failed to copy to clipboard.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Subscription Management
            </h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Manage your subscriber database with ease. View, delete, and update email lists in one centralized dashboard.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Subscriptions Table */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl flex items-center space-x-2">
                      <Users className="h-6 w-6 text-blue-600" />
                      <span>Active Subscriptions</span>
                    </CardTitle>
                    <CardDescription>
                      Manage your subscriber list and remove inactive users
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {subscriptions.length} subscribers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-slate-600">Loading subscriptions...</span>
                  </div>
                ) : (
                  <>
                    {subscriptions.length > 0 ? (
                      <div className="rounded-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-50/50 border-b border-slate-200">
                                
                                <th className="text-left py-4 px-6 font-semibold text-slate-700">Full Name</th>
                                <th className="text-left py-4 px-6 font-semibold text-slate-700">Email Address</th>
                                <th className="text-center py-4 px-6 font-semibold text-slate-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {subscriptions.map((sub) => (
                                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-b-0">
                                  
                                  <td className="py-4 px-6 font-medium">
                                    {sub.full_name}
                                  </td>
                                  <td className="py-4 px-6 text-slate-600">
                                    {sub.email}
                                  </td>
                                  <td className="py-4 px-6 text-center">
                                    <Button
                                      onClick={() => handleDeleteSubscription(sub.id)}
                                      disabled={deleting === sub.id}
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      {deleting === sub.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg">No subscriptions found</p>
                        <p className="text-slate-400 text-sm">New subscribers will appear here</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Email List Management */}
          <div className="space-y-6">
            {/* Current Email List */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <span>Email List</span>
                </CardTitle>
                <CardDescription>
                  Current subscriber email addresses
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                      {emailList}
                    </pre>
                  </div>
                  <Button
                    onClick={copyEmailList}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 p-2 h-8 w-8"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Update Email List */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  <span>Update Email List</span>
                </CardTitle>
                <CardDescription>
                  Add new email addresses to your list
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newEmails" className="text-sm font-medium">
                    Email Addresses
                  </Label>
                  <Input
                    id="newEmails"
                    type="email"
                    value={newEmails}
                    onChange={(e) => setNewEmails(e.target.value)}
                    placeholder="Enter emails separated by semicolons"
                    className="min-h-[80px] resize-none"
                    multiple
                  />
                  <p className="text-xs text-slate-500">
                    Separate multiple emails with semicolons (;)
                  </p>
                </div>
                
                <Separator />
                
                <Button
                  onClick={handleUpdateEmailList}
                  disabled={updating || !newEmails.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {updating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Update Email List
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;