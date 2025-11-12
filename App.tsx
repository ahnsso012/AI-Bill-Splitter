
import React, { useState, useEffect, useCallback } from 'react';
import { ReceiptPane } from './components/ReceiptPane';
import { ChatPane } from './components/ChatPane';
import {
  ParsedReceipt,
  Assignments,
  PersonTotals,
  ChatMessage,
  ReceiptItem,
} from './types';
import {
  parseReceiptFromImage,
  updateAssignmentsFromChat,
} from './services/geminiService';
import { ArrowPathIcon } from './components/Icons';

function App() {
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceipt | null>(
    null
  );
  const [tip, setTip] = useState<number>(0);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [personTotals, setPersonTotals] = useState<PersonTotals>({});
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setParsedReceipt(null);
    setAssignments({});
    setPersonTotals({});
    setTip(0);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setReceiptImage(base64String.split(',')[1]); // remove data url prefix
      try {
        const result = await parseReceiptFromImage(base64String.split(',')[1]);
        setParsedReceipt(result);
        setChatHistory([
          {
            sender: 'bot',
            text: "I've scanned the receipt! Now, tell me who had what. For example, 'Alice had the burger' or 'Bob and Carol split the fries'.",
          },
        ]);
      } catch (e) {
        console.error(e);
        setError('Sorry, I couldn\'t read that receipt. Please try another image.');
        setChatHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSendCommand = async (command: string) => {
    if (!parsedReceipt) return;

    setIsLoading(true);
    setError(null);
    setChatHistory((prev) => [...prev, { sender: 'user', text: command }]);

    try {
      const result = await updateAssignmentsFromChat(
        command,
        parsedReceipt.items
      );
      
      if (result && result.itemName && result.people.length > 0) {
        const matchedItem = parsedReceipt.items.find(item => item.name.toLowerCase().includes(result.itemName.toLowerCase()));

        if (matchedItem) {
          setAssignments((prev) => ({
            ...prev,
            [matchedItem.name]: result.people,
          }));
          const peopleStr = result.people.join(' and ');
          setChatHistory((prev) => [
            ...prev,
            { sender: 'bot', text: `Got it. Assigning ${matchedItem.name} to ${peopleStr}.` },
          ]);
        } else {
           setChatHistory((prev) => [
            ...prev,
            { sender: 'bot', text: `Sorry, I couldn't find an item called "${result.itemName}" on the receipt.` },
          ]);
        }
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: 'bot', text: "I'm not sure how to handle that. Try something like 'David had the salad'." },
        ]);
      }

    } catch (e) {
      console.error(e);
      setError('Something went wrong while processing your command.');
       setChatHistory((prev) => [
            ...prev,
            { sender: 'bot', text: "I'm having a little trouble understanding. Please try again." },
        ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateTotals = useCallback(() => {
    if (!parsedReceipt) {
      setPersonTotals({});
      return;
    }

    const newPersonTotals: PersonTotals = {};
    const personSubtotals: { [key: string]: number } = {};
    let assignedSubtotal = 0;

    // Calculate individual subtotals
    for (const item of parsedReceipt.items) {
      const assignedTo = assignments[item.name];
      if (assignedTo && assignedTo.length > 0) {
        const pricePerPerson = item.price / assignedTo.length;
        assignedSubtotal += item.price;
        for (const person of assignedTo) {
          if (!personSubtotals[person]) {
            personSubtotals[person] = 0;
          }
          personSubtotals[person] += pricePerPerson;
        }
      }
    }

    // Calculate tax and tip proportion
    const taxAndTip = (parsedReceipt.tax || 0) + tip;
    const proportion = assignedSubtotal > 0 ? taxAndTip / assignedSubtotal : 0;

    // Calculate final totals
    for (const person in personSubtotals) {
      const subtotal = personSubtotals[person];
      const personTaxAndTip = subtotal * proportion;
      newPersonTotals[person] = subtotal + personTaxAndTip;
    }

    setPersonTotals(newPersonTotals);
  }, [parsedReceipt, assignments, tip]);


  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleReset = () => {
    setReceiptImage(null);
    setParsedReceipt(null);
    setTip(0);
    setAssignments({});
    setPersonTotals({});
    setChatHistory([]);
    setIsLoading(false);
    setError(null);
  };


  return (
    <div className="min-h-screen flex flex-col font-sans">
        <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-slate-700">AI 빌 스플릿터</h1>
             <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Start Over"
            >
                <ArrowPathIcon className="h-5 w-5" />
                <span>Start Over</span>
            </button>
        </header>

        <main className="flex-grow flex flex-col md:flex-row h-[calc(100vh-68px)]">
            <div className="w-full md:w-1/2 h-1/2 md:h-full overflow-y-auto bg-white p-6 border-r border-slate-200">
                <ReceiptPane
                    onImageUpload={handleImageUpload}
                    receiptData={parsedReceipt}
                    isLoading={isLoading && !parsedReceipt}
                    tip={tip}
                    setTip={setTip}
                    assignments={assignments}
                />
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-100">
                <ChatPane
                    chatHistory={chatHistory}
                    onSendCommand={handleSendCommand}
                    personTotals={personTotals}
                    isLoading={isLoading && !!parsedReceipt}
                    error={error}
                />
            </div>
        </main>
    </div>
  );
}

export default App;
