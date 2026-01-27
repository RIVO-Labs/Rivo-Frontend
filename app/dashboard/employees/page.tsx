"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "react-icons/ri";

// Dummy employee data
const employees = [
  {
    id: "EMP-001",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    role: "Frontend Developer",
    department: "Engineering",
    location: "Jakarta, Indonesia",
    joinDate: "2023-03-15",
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    salary: "12.000.000 IDRX",
    paymentStatus: "paid",
    lastPaid: "2024-01-01",
    avatar: "SJ",
  },
  {
    id: "EMP-002",
    name: "Ahmad Rahman",
    email: "ahmad@company.com", 
    role: "Backend Developer",
    department: "Engineering",
    location: "Bandung, Indonesia",
    joinDate: "2023-01-10",
    wallet: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    salary: "13.500.000 IDRX",
    paymentStatus: "paid",
    lastPaid: "2024-01-01",
    avatar: "AR",
  },
  {
    id: "EMP-003", 
    name: "Lisa Chen",
    email: "lisa@company.com",
    role: "UI/UX Designer",
    department: "Design",
    location: "Surabaya, Indonesia",
    joinDate: "2023-05-20",
    wallet: "0x567890567890567890567890567890567890567",
    salary: "10.500.000 IDRX",
    paymentStatus: "pending",
    lastPaid: "2023-12-01",
    avatar: "LC",
  },
  {
    id: "EMP-004",
    name: "Michael Torres",
    email: "michael@company.com",
    role: "DevOps Engineer", 
    department: "Engineering",
    location: "Yogyakarta, Indonesia",
    joinDate: "2023-08-01",
    wallet: "0x123456123456123456123456123456123456123",
    salary: "14.000.000 IDRX",
    paymentStatus: "paid",
    lastPaid: "2024-01-01",
    avatar: "MT",
  },
];

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

  const departments = ["all", ...Array.from(new Set(employees.map(e => e.department)))];

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const totalSalary = employees.reduce((total, emp) => {
    return total + parseFloat(emp.salary.replace(/[^\d.]/g, ''));
  }, 0);

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
            Manage your team members and their payroll information
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="mt-4 md:mt-0"
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Enter employee name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="employee@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" placeholder="e.g., Frontend Developer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" placeholder="e.g., Engineering" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g., Jakarta, Indonesia" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Monthly Salary (IDRX)</Label>
              <Input id="salary" placeholder="0.00" type="number" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input id="wallet" placeholder="0x..." />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button>
              <RiTeamLine className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
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
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
              <RiTeamLine className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Payroll</p>
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
                <p className="text-2xl font-bold">{employees.filter(e => e.paymentStatus === 'paid').length}</p>
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
                <p className="text-2xl font-bold">{employees.filter(e => e.paymentStatus === 'pending').length}</p>
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
        {filteredEmployees.map((employee, index) => (
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
                      {employee.salary}
                    </p>
                    
                    <div className="flex gap-2">
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
        ))}
      </motion.div>
    </div>
  );
}