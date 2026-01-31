"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/useRole";
import { useUnlock } from "@/hooks/useUnlock";
import { useToast } from "@/hooks/use-toast";
import { useFetchFromIPFS } from "@/hooks/useFetchFromIPFS";
import { useEmployeesList } from "@/hooks/usePinataList";
import { Permission } from "@/lib/roles";
import { encryptDataWithKey } from "@/lib/ipfs/aes-encryption";
import { uploadJSONToIPFS } from "@/lib/ipfs/upload";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RiTeamLine,
  RiAddLine,
  RiSearchLine,
  RiFilterLine,
  RiMapPinLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiEditLine,
  RiDeleteBinLine,
  RiWalletLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiLoader4Line,
  RiEyeLine,
  RiCloseLine,
} from "react-icons/ri";

// Employee data - replace with API call
const employees: any[] = [];

const departmentColors = {
  "Engineering": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "Design": "bg-purple-500/10 text-purple-700 border-purple-500/20",
  "Marketing": "bg-green-500/10 text-green-700 border-green-500/20",
  "Operations": "bg-orange-500/10 text-orange-700 border-orange-500/20",
};

const statusColors = {
  paid: "bg-green-500/10 text-green-700 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
  overdue: "bg-red-500/10 text-red-700 border-red-500/20",
};

export default function EmployeesPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  // Modal for viewing full employee details
  const [selectedEmployeeData, setSelectedEmployeeData] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCID, setSelectedCID] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    location: "",
    salary: "",
    wallet: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [permissionError, setPermissionError] = useState<string>("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  // Check role and permissions
  const { isSMEOwner, hasPermission } = useRole();
  const { getEncryptionKey, isUnlocked } = useUnlock();
  const { address } = useAccount();
  const { toast } = useToast();

  // Hook for fetching from IPFS
  const { data: decryptedEmployee, isLoading: isFetchingDetails, error: fetchError, fetch: fetchEmployeeDetails } = useFetchFromIPFS(
    selectedCID,
    isUnlocked ? getEncryptionKey() : null
  );

  // Fetch employee list from Pinata API (replaces localStorage)
  const { items: employeesList, isLoading: isLoadingList, error: listError, refetch: refetchEmployees } = useEmployeesList(address);

  const departments = ["all", ...Array.from(new Set(employeesList.map(e => e.department)))];

  const filteredEmployees = employeesList.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const totalSalary = employeesList.reduce((total, emp) => {
    return total + parseFloat(emp.salary.replace(/[^\d.]/g, ''));
  }, 0);

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    if (!formData.role.trim()) {
      errors.role = "Role is required";
    }
    if (!formData.department.trim()) {
      errors.department = "Department is required";
    }
    if (!formData.location.trim()) {
      errors.location = "Location is required";
    }
    if (!formData.salary.trim()) {
      errors.salary = "Salary is required";
    } else if (parseFloat(formData.salary) <= 0) {
      errors.salary = "Salary must be greater than 0";
    }
    if (!formData.wallet.trim()) {
      errors.wallet = "Wallet address is required";
    } else if (!formData.wallet.startsWith("0x") || formData.wallet.length !== 42) {
      errors.wallet = "Invalid wallet address";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add employee
  const handleAddEmployee = async () => {
    if (!validateForm()) return;

    // Check permission
    if (!hasPermission(Permission.ADD_EMPLOYEE)) {
      setPermissionError("Anda tidak memiliki izin untuk menambahkan employee. Hanya SME Owner yang dapat melakukan ini.");
      return;
    }

    // Check if encryption key is available
    const encryptionKey = getEncryptionKey();
    if (!encryptionKey) {
      toast({
        title: "Encryption Key Not Available",
        description: "Please unlock your data storage first by clicking the Unlock button in the navbar.",
        variant: "destructive",
      });
      return;
    }

    setIsEncrypting(true);
    try {
      const newEmployee = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        location: formData.location,
        salary: formData.salary,
        wallet: formData.wallet,
        avatar: formData.name.split(' ').map(n => n[0]).join(''),
        paymentStatus: 'pending',
        joinDate: new Date().toLocaleDateString('id-ID'),
        lastPaid: '-',
        createdAt: new Date().toISOString(),
        createdBy: address,
      };

      // Encrypt employee data
      const encryptedData = await encryptDataWithKey(newEmployee, encryptionKey);

      // Upload encrypted data to IPFS
      const uploadResult = await uploadJSONToIPFS({
        encrypted: encryptedData,
        metadata: {
          type: 'employee',
          timestamp: Date.now(),
          walletAddress: address,
          employeeName: formData.name,
        },
      });

      const cid = uploadResult.cid || uploadResult;

      // Upload successful - metadata is stored in Pinata with walletAddress filter
      // Refetch employee list from Pinata API to get updated list
      await refetchEmployees();

      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "",
        department: "",
        location: "",
        salary: "",
        wallet: "",
      });
      setFormErrors({});
      setPermissionError("");
      setShowCreateForm(false);

      toast({
        title: "Employee Added Successfully",
        description: `Employee "${formData.name}" has been encrypted and stored to IPFS.`,
      });
    } catch (error) {
      console.error("Error adding employee:", error);
      toast({
        title: "Error",
        description: "Failed to add employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEncrypting(false);
    }
  };

  // Handle viewing employee full details from IPFS
  const handleViewEmployee = async (employee: any) => {
    // Employee from Pinata API already has CID
    try {
      if (employee.cid) {
        setSelectedCID(employee.cid);
        setShowDetailsModal(true);
      } else {
        // Fallback to show current data if no CID
        setSelectedEmployeeData(employee);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error viewing employee:", error);
      toast({
        title: "Error",
        description: "Failed to view employee details",
        variant: "destructive",
      });
    }
  };

  // Trigger fetch when modal opens with CID
  useEffect(() => {
    if (showDetailsModal && selectedCID && isUnlocked) {
      fetchEmployeeDetails();
    }
  }, [showDetailsModal, selectedCID]);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and contact details
          </p>
        </div>
        <Button
          onClick={() => {
            setPermissionError("");
            setShowCreateForm(true);
          }}
          className="mt-4 md:mt-0"
          disabled={!hasPermission(Permission.ADD_EMPLOYEE)}
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </motion.div>

      {/* Add Employee Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Add New Employee</h2>
            <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
              ×
            </Button>
          </div>

          {permissionError && (
            <div className="mb-4 p-3 bg-red-500/10 text-red-700 border border-red-500/20 rounded-md text-sm">
              {permissionError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter employee name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="e.g., Frontend Developer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              />
              {formErrors.role && (
                <p className="text-sm text-red-500">{formErrors.role}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Engineering"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
              {formErrors.department && (
                <p className="text-sm text-red-500">{formErrors.department}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Jakarta, Indonesia"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              {formErrors.location && (
                <p className="text-sm text-red-500">{formErrors.location}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary (IDRX)</Label>
              <Input
                id="salary"
                placeholder="0.00"
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
              {formErrors.salary && (
                <p className="text-sm text-red-500">{formErrors.salary}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input
                id="wallet"
                placeholder="0x..."
                value={formData.wallet}
                onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
              />
              {formErrors.wallet && (
                <p className="text-sm text-red-500">{formErrors.wallet}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddEmployee} disabled={isEncrypting}>
              {isEncrypting ? (
                <>
                  <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting & Uploading...
                </>
              ) : (
                <>
                  <RiTeamLine className="mr-2 h-4 w-4" />
                  Add Employee
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)} disabled={isEncrypting}>
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          {departments.map(department => (
            <option key={department} value={department}>
              {department === "all" ? "All Departments" : department}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Employee Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employeesList.length}</p>
              </div>
              <RiTeamLine className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Spend</p>
                <p className="text-2xl font-bold">{(totalSalary / 1000000).toFixed(1)}M IDRX</p>
              </div>
              <RiMoneyDollarCircleLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold">{employeesList.filter(e => e.paymentStatus === 'paid').length}</p>
              </div>
              <RiCheckboxCircleLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-bold">{employeesList.filter(e => e.paymentStatus === 'pending').length}</p>
              </div>
              <RiTimeLine className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{employee.avatar}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{employee.name}</h3>
                          <Badge className={departmentColors[employee.department as keyof typeof departmentColors]}>
                            {employee.department}
                          </Badge>
                          <Badge className={statusColors[employee.paymentStatus as keyof typeof statusColors]}>
                            {employee.paymentStatus}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground font-medium">{employee.role}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-2">
                            <RiMapPinLine className="h-4 w-4" />
                            {employee.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiCalendarLine className="h-4 w-4" />
                            Joined {employee.joinDate}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiWalletLine className="h-4 w-4" />
                            {employee.wallet.slice(0, 10)}...{employee.wallet.slice(-8)}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiTimeLine className="h-4 w-4" />
                            Last paid: {employee.lastPaid}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Monthly Salary</p>
                      <p className="text-2xl font-semibold text-primary mb-2">
                        {employee.salary} IDRX
                      </p>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleViewEmployee(employee)}
                          disabled={!isUnlocked}
                        >
                          <RiEyeLine className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button variant="outline" size="sm">
                          <RiEditLine className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <RiDeleteBinLine className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No employees found. Add your first employee to get started.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Employee Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Full Details</DialogTitle>
            <DialogDescription>
              {isFetchingDetails ? "Loading from IPFS..." : "Complete employee information"}
            </DialogDescription>
          </DialogHeader>

          {isFetchingDetails ? (
            <div className="flex items-center justify-center py-8">
              <RiLoader4Line className="h-8 w-8 animate-spin mr-2" />
              <span>Fetching and decrypting from IPFS...</span>
            </div>
          ) : fetchError ? (
            <div className="p-4 bg-red-500/10 text-red-700 border border-red-500/20 rounded-md">
              <p className="font-semibold">Error loading details</p>
              <p className="text-sm">{fetchError}</p>
              <p className="text-sm mt-2">Make sure you have unlocked the data storage.</p>
            </div>
          ) : decryptedEmployee || selectedEmployeeData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Name</label>
                  <p className="text-base">{decryptedEmployee?.name || selectedEmployeeData?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Email</label>
                  <p className="text-base">{decryptedEmployee?.email || selectedEmployeeData?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Role</label>
                  <p className="text-base">{decryptedEmployee?.role || selectedEmployeeData?.role}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Department</label>
                  <p className="text-base">{decryptedEmployee?.department || selectedEmployeeData?.department}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Location</label>
                  <p className="text-base">{decryptedEmployee?.location || selectedEmployeeData?.location}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Monthly Salary</label>
                  <p className="text-base text-green-600 font-semibold">{decryptedEmployee?.salary || selectedEmployeeData?.salary} IDRX</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Wallet Address</label>
                  <p className="text-base font-mono text-sm">{decryptedEmployee?.wallet || selectedEmployeeData?.wallet}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">Join Date</label>
                  <p className="text-base">{decryptedEmployee?.joinDate || selectedEmployeeData?.joinDate}</p>
                </div>
              </div>
              {decryptedEmployee && (
                <div className="p-3 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-sm">
                  <p>✅ Data decrypted from IPFS successfully</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No employee data available</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => {
              setShowDetailsModal(false);
              setSelectedCID(null);
              setSelectedEmployeeData(null);
            }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}