
export interface ReceiptItem {
  name: string;
  price: number;
}

export interface ParsedReceipt {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export interface Assignments {
  [itemName: string]: string[];
}

export interface PersonTotals {
  [personName: string]: number;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface AssignmentResult {
    itemName: string;
    people: string[];
}
