"use client";

import { useState, useEffect } from "react";
import { createClient, safeGetUser } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Clock, User, Phone, Car, MapPin, AlertCircle } from "lucide-react";

interface DispatcherApplication {
  id: string;
  name: string;
  phone: string;
  email: string;
  application_status: 'pending' | 'approved' | 'rejected';
  application_notes: string | null;
  vehicle_info: {
    type: string;
    make: string;
    model: string;
    year: string;
    license_plate: string;
  };
  current_location: {
    address: string;
  };
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
    created_at: string;
  };
}

export default function DispatcherApplicationsPage() {
  const [applications, setApplications] = useState<DispatcherApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApplication, setSelectedApplication] = useState<DispatcherApplication | null>(null);
  const [notes, setNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const supabase = createClient();
      let authResult;
      try {
        authResult = await safeGetUser(supabase);
      } catch (err: any) {
        setError("Authentication timeout or network failure");
        return;
      }
      const user = authResult?.data?.user;

      if (!user) {
        setError("You must be logged in to view applications");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.role !== 'admin' && profile.role !== 'employee')) {
        setError("You don't have permission to view applications");
        return;
      }

      const response = await fetch('/api/admin/dispatcher-applications');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch applications');
      }

      setApplications(data.applications || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.message || 'Failed to fetch applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;
    
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch('/api/admin/dispatcher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: 'approve',
          notes: notes || "Application approved by admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application');
      }

      setSelectedApplication(null);
      setNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error('Error approving application:', error);
      setError(error.message || 'Failed to approve application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;
    
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch('/api/admin/dispatcher-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApplication.id,
          action: 'reject',
          notes: notes || "Application rejected by admin",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application');
      }

      setSelectedApplication(null);
      setNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      setError(error.message || 'Failed to reject application');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.application_status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading applications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispatcher Applications</h1>
          <p className="text-gray-600">Review and approve dispatcher applications</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && ` (${applications.filter(a => a.application_status === 'pending').length})`}
            </button>
          ))}
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedApplication(application)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{application.name}</h3>
                    <p className="text-sm text-gray-600">{application.email}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.application_status)}`}>
                  {getStatusIcon(application.application_status)}
                  <span className="capitalize">{application.application_status}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{application.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span>
                    {application.vehicle_info.year} {application.vehicle_info.make} {application.vehicle_info.model}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{application.current_location.address}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Applied: {new Date(application.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No {filter !== 'all' ? filter : ''} applications found
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApplication.name}</h2>
                  <p className="text-gray-600">{selectedApplication.email}</p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">{selectedApplication.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{selectedApplication.email}</p>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Type</p>
                      <p className="font-medium capitalize">{selectedApplication.vehicle_info.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Make</p>
                      <p className="font-medium">{selectedApplication.vehicle_info.make}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Model</p>
                      <p className="font-medium">{selectedApplication.vehicle_info.model}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Year</p>
                      <p className="font-medium">{selectedApplication.vehicle_info.year}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">License Plate</p>
                      <p className="font-medium">{selectedApplication.vehicle_info.license_plate}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Location Information</h3>
                  <div className="text-sm">
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium">{selectedApplication.current_location.address}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedApplication.application_status !== 'pending' && selectedApplication.application_notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedApplication.application_notes}
                    </p>
                  </div>
                )}

                {/* Action Buttons for Pending Applications */}
                {selectedApplication.application_status === 'pending' && (
                  <>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Admin Notes</h3>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this decision..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        {isProcessing ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
