
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import type { ParsedReceipt, AssignmentResult, ReceiptItem } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      description: 'A list of all items found on the receipt.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'The name of the purchased item.',
          },
          price: {
            type: Type.NUMBER,
            description: 'The price of the item.',
          },
        },
        required: ['name', 'price'],
      },
    },
    subtotal: {
      type: Type.NUMBER,
      description: 'The subtotal before tax and tip.',
    },
    tax: {
      type: Type.NUMBER,
      description: 'The total tax amount.',
    },
    total: {
      type: Type.NUMBER,
      description: 'The final total amount on the receipt.',
    },
  },
  required: ['items', 'subtotal', 'tax', 'total'],
};

export const parseReceiptFromImage = async (base64Image: string): Promise<ParsedReceipt> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };

  const textPart = {
    text: 'Analyze this receipt image and extract all line items with their prices, the subtotal, tax, and total amount. Provide the output in the specified JSON format.',
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: receiptSchema,
    },
  });

  const jsonString = response.text.trim();
  return JSON.parse(jsonString) as ParsedReceipt;
};

const assignItemFunctionDeclaration: FunctionDeclaration = {
  name: 'assignItem',
  description: 'Assigns a receipt item to one or more people.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemName: {
        type: Type.STRING,
        description: 'The name of the item from the receipt to be assigned. Should be the closest possible match from the provided item list.',
      },
      people: {
        type: Type.ARRAY,
        description: 'An array of names of the people to whom the item should be assigned.',
        items: { type: Type.STRING },
      },
    },
    required: ['itemName', 'people'],
  },
};

export const updateAssignmentsFromChat = async (
  command: string,
  items: ReceiptItem[]
): Promise<AssignmentResult | null> => {
  const itemNames = items.map((item) => item.name);
  const prompt = `You are an intelligent bill-splitting assistant. Your task is to understand the user's request and assign items from a receipt to the specified people. Analyze the user's message and call the 'assignItem' function with the correct item name and list of people. The user's request is: "${command}". Here is the list of available items from the receipt: [${itemNames.join(', ')}].`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ functionDeclarations: [assignItemFunctionDeclaration] }],
    },
  });
  
  const functionCall = response.functionCalls?.[0];

  if (functionCall && functionCall.name === 'assignItem') {
    return functionCall.args as AssignmentResult;
  }

  return null;
};
