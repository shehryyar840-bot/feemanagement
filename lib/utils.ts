// Currency formatter
export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// Date formatter
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Status badge colors
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Get month names
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Get current year
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

// Get current month name
export function getCurrentMonth(): string {
  const monthIndex = new Date().getMonth();
  return MONTHS[monthIndex];
}

// Validate phone number (simple validation)
export function isValidPhone(phone: string): boolean {
  return /^[0-9]{10,11}$/.test(phone.replace(/[\s-]/g, ''));
}
