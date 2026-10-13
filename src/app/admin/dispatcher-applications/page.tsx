"use client";

import { useState, useEffect } from "react";
import { createClient, safeGetUser } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Clock, User, Phone, Car, MapPin, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dispatcher Applications</h1>
        <p className="text-sm text-slate-600 mt-1">Review background info, vehicle details, and approve driver registrations.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              filter === status
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'pending' && ` (${applications.filter(a => a.application_status === 'pending').length})`}
          </button>
        ))}
      </div>

        {/* Applications Grid: Strict 2x2 on Mobile, 3 Columns on Desktop with Full Gradients */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4.5">
          {filteredApplications.map((application) => {
            const isPending = application.application_status === 'pending';
            const isApproved = application.application_status === 'approved';
            const isRejected = application.application_status === 'rejected';

            const cardBg = isPending 
              ? "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white border-amber-400/40 shadow-amber-950/20" 
              : isApproved
                ? "bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white border-emerald-400/40 shadow-emerald-950/20"
                : "bg-gradient-to-br from-rose-700 via-red-800 to-slate-900 text-white border-rose-500/40 shadow-rose-950/20";

            return (
              <div
                key={application.id}
                className={cn(
                  "rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-lg border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden",
                  cardBg
                )}
                onClick={() => setSelectedApplication(application)}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2.5">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-white shrink-0">
                      {application.application_status}
                    </span>
                  </div>

                  <h3 className="font-black text-xs sm:text-base text-white leading-tight truncate mb-0.5">
                    {application.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-white/80 font-medium truncate mb-2.5">
                    {application.email}
                  </p>

                  {/* Inner Glass Details Box */}
                  <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl p-2 sm:p-2.5 space-y-1 text-white text-[10px] sm:text-xs mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 shrink-0 opacity-80" />
                      <span className="truncate">{application.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Car className="w-3 h-3 shrink-0 opacity-80" />
                      <span className="truncate">
                        {application.vehicle_info.year} {application.vehicle_info.make}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/20 flex flex-col gap-1.5">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedApplication(application);
                    }}
                    className="w-full py-1.5 px-2 bg-white text-slate-900 rounded-xl font-black text-[11px] sm:text-xs shadow-sm hover:bg-white/95 active:scale-95 transition-all min-h-[36px] flex items-center justify-center"
                  >
                    Review Application
                  </button>
                  <p className="text-[9px] text-white/70 text-center font-bold">
                    Applied: {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {filteredApplications.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 shadow-sm">
            No {filter !== 'all' ? filter : ''} dispatcher applications found
          </div>
        )}

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
