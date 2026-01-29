"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRivoHub } from "@/hooks/useRivoHub";
import { useIDRXBalance, useIDRXAllowance, useApproveIDRX, hasSufficientAllowance, formatIDRX } from "@/hooks/useIDRXApproval";
import { useUserPayrollEvents } from "@/hooks/useRivoHubEvents";
import { useEmployeesList } from "@/hooks/usePinataList";
import { useFetchFromIPFS } from "@/hooks/useFetchFromIPFS";
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
  RiWalletLine,
  RiCheckLine,
  RiLoader4Line,
  RiEyeLine,
} from "react-icons/ri";
import { isAddress } from "viem";

interface Employee {
  id: string;
  name: string;
  role: string;
  wallet: string;
  salary: string;
}

export default function PayrollPage() {
  const { address } = useAccount();
  const { toast } = useToast();

  // Hooks for smart contract interactions
  const { payPayroll, isPending, isConfirming, isSuccess, hash } = useRivoHub();
  const { balance, balanceFormatted, refetch: refetchBalance } = useIDRXBalance(address);
  const { allowance, refetch: refetchAllowance } = useIDRXAllowance(address);
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveIDRX();
  const { events: payrollEvents, isLoading: isLoadingEvents } = useUserPayrollEvents(address);

  // Fetch employee list from Pinata API (replaces localStorage)
  const { items: employeesList, isLoading: isLoadingEmployees, error: employeesError, refetch: refetchEmployees } = useEmployeesList(address);

  // Map Pinata employees to Employee interface for payroll
  const employees: Employee[] = useMemo(() => {
    return employeesList.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      role: emp.role || 'Employee',
      wallet: emp.wallet || emp.walletAddress || '',
      salary: emp.salary?.toString() || '0',
    }));
  }, [employeesList]);

  // State management
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [showCreateBatch, setShowCreateBatch] = useState(false);

  // Check if total amount is approved
  const totalAmount = useMemo(() => {
    return selectedEmployees.reduce((total, empId) => {
      const employee = employees.find((emp) => emp.id === empId);
      if (employee) {
        return total + parseFloat(employee.salary);
      }
      return total;
    }, 0);
  }, [selectedEmployees, employees]);

  const isApproved = useMemo(() => {
    if (!allowance || totalAmount === 0) return false;
    return hasSufficientAllowance(allowance, totalAmount.toString());
  }, [allowance, totalAmount]);

  // Refresh allowance when approval is successful
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      toast({
        title: "Approval Successful",
        description: "You can now execute payroll with IDRX",
      });
    }
  }, [isApproveSuccess]);

  // Refresh events and balance when payment is successful
  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      toast({
        title: "Payroll Executed",
        description: `Successfully paid ${selectedEmployees.length} employees`,
      });
      setSelectedEmployees([]);
      setShowCreateBatch(false);
    }
  }, [isSuccess]);

  // Handle employee selection
  const handleEmployeeSelect = (employeeId: string, selected: boolean) => {
    if (selected) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    }
  };

  // Handle approve IDRX
  const handleApprove = () => {
    approve(); // Approve unlimited
  };

  // Handle execute payroll
  const handleExecutePayroll = () => {
    if (selectedEmployees.length === 0) {
      toast({
        title: "No Employees Selected",
        description: "Please select at least one employee",
        variant: "destructive",
      });
      return;
    }

    if (!isApproved) {
      toast({
        title: "Approval Required",
        description: "Please approve IDRX spending first",
        variant: "destructive",
      });
      return;
    }

    // Check balance
    if (balance && totalAmount) {
      const totalAmountBigInt = BigInt(Math.floor(totalAmount * 10 ** 18));
      if (totalAmountBigInt > balance) {
        toast({
          title: "Insufficient Balance",
          description: "Your IDRX balance is insufficient",
          variant: "destructive",
        });
        return;
      }
    }

    // Prepare arrays for payPayroll
    const recipients = selectedEmployees.map((empId) => {
      const employee = employees.find((emp) => emp.id === empId);
      return employee?.wallet as `0x${string}`;
    });

    const amounts = selectedEmployees.map((empId) => {
      const employee = employees.find((emp) => emp.id === empId);
      return employee?.salary || "0";
    });

    payPayroll(recipients, amounts);
  };

  // Calculate statistics from events
  const stats = useMemo(() => {
    if (!address || payrollEvents.length === 0) {
      return {
        totalPaid: "0",
        batchCount: 0,
        lastPayment: "Never",
      };
    }

    const totalPaid = payrollEvents.reduce((sum, event) => {
      return sum + parseFloat(event.totalAmountFormatted);
    }, 0);

    const lastEvent = payrollEvents[0]; // Events are sorted by timestamp desc
    const lastPayment = new Date(lastEvent.timestamp * 1000).toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
    });

    return {
      totalPaid: totalPaid.toLocaleString("id-ID", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }),
      batchCount: payrollEvents.length,
      lastPayment,
    };
  }, [payrollEvents, address]);

  // Format timestamp to readable date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        <Button onClick={() => setShowCreateBatch(true)} disabled={!address || employees.length === 0}>
          <RiPlayFill className="mr-2 h-4 w-4" />
          Execute Payroll
        </Button>
      </motion.div>

      {/* Wallet Status */}
      {address && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <RiWalletLine className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">IDRX Balance</p>
                    <p className="text-2xl font-bold">{formatIDRX(balance)} IDRX</p>
                  </div>
                </div>
                {!isApproved && (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isApprovingConfirming}
                    variant="outline"
                  >
                    {isApproving || isApprovingConfirming ? (
                      <>
                        <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <RiCheckLine className="mr-2 h-4 w-4" />
                        Approve IDRX
                      </>
                    )}
                  </Button>
                )}
                {isApproved && (
                  <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                    <RiCheckboxCircleLine className="mr-1 h-4 w-4" />
                    IDRX Approved
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold">{stats.totalPaid} IDRX</p>
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
                <p className="text-2xl font-bold">{stats.lastPayment}</p>
              </div>
              <RiCheckboxCircleLine className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Execute Payroll Batch */}
      {showCreateBatch && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Execute Payroll Batch</h2>
            <Button variant="ghost" onClick={() => setShowCreateBatch(false)}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select Employees</Label>
              <div className="mt-2 space-y-2 max-h-96 overflow-y-auto">
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
                      <p className="text-xs text-muted-foreground">
                        {employee.wallet.slice(0, 6)}...{employee.wallet.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">
                        {parseFloat(employee.salary).toLocaleString("id-ID")} IDRX
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEmployees.length > 0 && (
              <div className="bg-muted/50 p-4 rounded border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Selected: {selectedEmployees.length} employees</span>
                  <span className="font-bold text-primary">
                    Total: {totalAmount.toLocaleString("id-ID")} IDRX
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleExecutePayroll}
                disabled={selectedEmployees.length === 0 || isPending || isConfirming || !isApproved}
                className="flex-1"
              >
                {isPending || isConfirming ? (
                  <>
                    <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RiPlayFill className="mr-2 h-4 w-4" />
                    Execute Payroll ({selectedEmployees.length} payments)
                  </>
                )}
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
            <CardDescription>Select employees for payroll batch payment</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEmployees ? (
              <div className="text-center py-12">
                <RiLoader4Line className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-12">
                <RiTeamLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No employees found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add employees from the Employees page first
                </p>
              </div>
            ) : (
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
                      <p className="text-xs text-muted-foreground">
                        {employee.wallet.slice(0, 6)}...{employee.wallet.slice(-4)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-medium text-primary">
                        {parseFloat(employee.salary).toLocaleString("id-ID")} IDRX
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
            <CardDescription>Previous payroll batch executions from blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingEvents && (
              <div className="text-center py-12">
                <RiLoader4Line className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Loading payroll history...</p>
              </div>
            )}

            {!isLoadingEvents && payrollEvents.length === 0 && (
              <div className="text-center py-12">
                <RiMoneyDollarCircleLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No payroll batches executed yet</p>
                {!address && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your wallet to view payroll history
                  </p>
                )}
              </div>
            )}

            {!isLoadingEvents && payrollEvents.length > 0 && (
              <div className="space-y-4">
                {payrollEvents.map((batch, index) => (
                  <div
                    key={`${batch.txHash}-${index}`}
                    className="flex items-center justify-between p-4 border rounded"
                  >
                    <div>
                      <p className="font-medium">{formatDate(batch.timestamp)}</p>
                      <p className="text-sm text-muted-foreground">
                        Tx: {batch.txHash.slice(0, 10)}...{batch.txHash.slice(-8)}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="font-medium">{batch.totalRecipients} employees</p>
                      <p className="text-sm text-muted-foreground">
                        Total:{" "}
                        {parseFloat(batch.totalAmountFormatted).toLocaleString("id-ID", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        IDRX
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                        Completed
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(
                            `https://sepolia-blockscout.lisk.com/tx/${batch.txHash}`,
                            "_blank"
                          );
                        }}
                      >
                        <RiEyeLine className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
