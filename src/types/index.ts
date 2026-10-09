export interface UserProfile {
  id?: string | number;
  name: string;
  email: string;
  mobile: string;
  secondaryMobile?: string;
  role?: string | { roleCode?: string; roleName?: string };
  companyName?: string;
  education?: string;
  machineName?: string;
  machineModel?: string;
  registrationNo?: string;
  gstin?: string;
  city?: string;
  address?: string;
  profileImage?: string | null;
}

export interface OwnerDocument {
  id: number;
  title: string;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSize?: string | null;
  fileType?: string | null;
  createdAt: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  message?: string;
  token: string;
  user: UserProfile;
}

export interface Bill {
  id: number;
  date: string;
  place: string;
  customerName: string;
  contactNumber: string;
  timeHours: number;
  totalAmount: number;
  advance: number;
  balance: number;
  remarks: string | null;
  status: number; // 0 = PENDING, 1 = COMPLETED
}

export interface BillPayment {
  id: number;
  billId: number;
  amount: number;
  paymentDate: string;
  remarks: string | null;
}

export interface PendingBill {
  id: string;
  dbId: number;
  date: string;
  place: string;
  customerName: string;
  contactNumber: string;
  timeHours: number;
  totalAmount: number;
  advance: number;
  balanceAmount: number;
  remarks: string | null;
  machineType: 'CLASS' | 'KARTAR';
}

export interface Operator {
  id: number;
  operatorName: string;
  mobile: string;
  presentDays: number;
  absentDays: number;
  totalSalaryPaid: number;
  earnedSalary: number;
  attendances?: { id: number; date: string; status: string; dailyWage: number | null }[];
}

export interface AttendanceLog {
  id: number;
  operatorId: number;
  date: string;
  status: string; // PRESENT or ABSENT
  farmerName: string | null;
  dailyWage: number | null;
}

export interface OperatorPaymentHistory {
  id: number;
  operatorId?: number;
  amount: number;
  paymentDate: string;
  remarks: string | null;
}

export interface PurchaseItem {
  id: string;
  amount: number;
  time: string;
}

export interface PaymentItem {
  id: string;
  amount: number;
  time: string;
  remarks?: string;
}

export interface FuelRecord {
  id: number;
  date: string;
  fuelAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: 'PAID' | 'PENDING';
  purchasesJson?: string | null;
  paymentsJson?: string | null;
}

export interface DashboardStats {
  user?: UserProfile | null;
  totalBills: number;
  classBillsCount: number;
  kartarBillsCount: number;
  totalAdvance: number;
  totalBalance: number;
  totalPendingBillsCount: number;
  totalPendingBalance: number;
  totalOperators: number;
  totalOperatorSalaryPaid: number;
  totalFuelPurchases: number;
  totalFuelAmount: number;
  totalFuelPaid: number;
  totalFuelPending: number;
  totalBilledRevenue: number;
  totalExpenses: number;
  netProfit: number;
  recentActivity?: {
    classBills?: any[];
    kartarBills?: any[];
    bunkDetails?: any[];
  };
}
