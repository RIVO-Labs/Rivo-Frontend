"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RiTeamLine,
  RiAddLine,
  RiSearchLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiPlayFill,
  RiDeleteBinLine,
  RiEditLine,
  RiRobotLine,
} from "react-icons/ri";

// Dummy employee data
const employees = [
  {
    id: "EMP-001",
    name: "Sarah Johnson",
    role: "Frontend Developer",
    wallet: "0x1234...5678",
    salary: "12.000.000 IDRX",
    lastPaid: "2024-01-01",
  },
  {
    id: "EMP-002",
    name: "Ahmad Rahman",
    role: "Backend Developer",
    wallet: "0xabcd...efgh",
    salary: "13.500.000 IDRX",
    lastPaid: "2024-01-01",
  },
  {
    id: "EMP-003",
    name: "Lisa Chen",
    role: "UI/UX Designer",
    wallet: "0x5678...1234",
    salary: "10.500.000 IDRX",
    lastPaid: "2024-01-01",
  },
];

// Dummy payroll batches
const payrollBatches = [
  {
    id: "BATCH-001",
    date: "2024-01-01",
    employees: 15,
    total: "187.500.000 IDRX",
    status: "completed",
    txHash: "0x1234567890abcdef",
  },
  {
    id: "BATCH-002",
    date: "2023-12-01",
    employees: 14,
    total: "175.000.000 IDRX",
    status: "completed",
    txHash: "0xabcdef1234567890",
  },
];

export default function PayrollPage() {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [aiInput, setAiInput] = useState("");

  const handleEmployeeSelect = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId));
    }
  };

  const calculateTotal = () => {
    return selectedEmployees.reduce((total, empId) => {
      const employee = employees.find(emp => emp.id === empId);
      if (employee) {
        const amount = parseFloat(employee.salary.replace(/[^\d.]/g, ''));
        return total + amount;
      }
      return total;
    }, 0);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">
            Process batch payments for your team in IDRX
          </p>
        </div>
        <Button
          onClick={() => setShowCreateBatch(true)}
          className="mt-4 md:mt-0"
        >
          <RiAddLine className="mr-2 h-4 w-4" />
          Create Payroll Batch
        </Button>
      </motion.div>

      {/* AI Assistant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-dashed border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <RiRobotLine className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Payroll Assistant</CardTitle>
            </div>
            <CardDescription>
              Describe your payroll needs in plain language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 'Pay all developers their January salary'"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-1"
              />
              <Button>Process</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payroll Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                <p className="text-sm font-medium text-muted-foreground">Monthly Total</p>
                <p className="text-2xl font-bold">187.5M IDRX</p>
              </div>
              <RiMoneyDollarCircleLine className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Payment</p>
                <p className="text-2xl font-bold">Jan 1</p>
              </div>
              <RiCheckboxCircleLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Create Payroll Batch */}
      {showCreateBatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Create Payroll Batch</h2>
            <Button variant="ghost" onClick={() => setShowCreateBatch(false)}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select Employees</Label>
              <div className="mt-2 space-y-2">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center space-x-2 p-3 border rounded">
                    <Checkbox
                      id={employee.id}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={(checked) => 
                        handleEmployeeSelect(employee.id, checked as boolean)
                      }
                    />
                    <div className="flex-1">
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.role}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">{employee.salary}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="bg-muted/50 p-4 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    Selected: {selectedEmployees.length} employees
                  </span>
                  <span className="font-bold text-primary">
                    Total: {calculateTotal().toLocaleString('id-ID')} IDRX
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                disabled={selectedEmployees.length === 0}
                className="flex-1"
              >
                <RiPlayFill className="mr-2 h-4 w-4" />
                Execute Payroll ({selectedEmployees.length} payments)
              </Button>
              <Button variant="outline" onClick={() => setShowCreateBatch(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Employee List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Employee List</CardTitle>
            <CardDescription>
              Manage your team and their payment details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employees.map((employee, index) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 border rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                    <p className="text-xs text-muted-foreground">{employee.wallet}</p>
                  </div>
                  
                  <div className="text-right mr-4">
                    <p className="font-medium text-primary">{employee.salary}</p>
                    <p className="text-sm text-muted-foreground">
                      Last paid: {employee.lastPaid}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm">
                      <RiEditLine className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Payroll History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Payroll History</CardTitle>
            <CardDescription>
              Previous payroll batch executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payrollBatches.map((batch, index) => (
                <div key={batch.id} className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <p className="font-medium">{batch.id}</p>
                    <p className="text-sm text-muted-foreground">{batch.date}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="font-medium">{batch.employees} employees</p>
                    <p className="text-sm text-muted-foreground">Total: {batch.total}</p>
                  </div>
                  
                  <div className="text-right">
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                      {batch.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tx: {batch.txHash.slice(0, 10)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}