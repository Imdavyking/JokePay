import React, { useState, useEffect, useRef } from "react";
import { AIAgent } from "../../agent/index";
import { toast } from "react-toastify";
import { FaSpinner, FaComment } from "react-icons/fa";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useConfirmationStore } from "../../agent/prompt";

const ChatWithAdminBot = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isChatboxOpen, setIsChatboxOpen] = useState(false);
  const { prompt, confirm, cancel } = useConfirmationStore();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  type Confirmation = "confirmed" | "cancelled";

  type Message = {
    sender: "user" | "bot" | "prompt";
    text: string;
    args?: any;
    click?: Confirmation;
  };

  const [messages, setMessages] = useState<Message[]>([]);

  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1]; // remove prefix
      setImageBase64(base64String);
      toast.success("✅ Image attached.");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (prompt) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "prompt",
          text: prompt.message,
          args: prompt.args,
        },
      ]);
    }
  }, [prompt]);
  const helpRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

  const toggleChatbox = () => {
    setIsChatboxOpen((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        toggleRef.current &&
        toggleRef.current.contains(event.target as Node)
      ) {
        return;
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpOpen(false);
      }
    }

    if (isHelpOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isHelpOpen]);

  const agent = new AIAgent();
  const handleConfirm = () => {
    confirm();
    updateLastPromptAsClicked("confirmed");
  };

  const handleCancel = () => {
    cancel();
    updateLastPromptAsClicked("cancelled");
  };

  const updateLastPromptAsClicked = (click: Confirmation) => {
    setMessages((prevMessages) => {
      const reversed = [...prevMessages].reverse();

      const index = reversed.findIndex(
        (msg) => msg.sender === "prompt" && !msg.click
      );

      if (index === -1) return prevMessages;

      const realIndex = prevMessages.length - 1 - index;
      const updatedMessages = [...prevMessages];
      updatedMessages[realIndex] = {
        ...updatedMessages[realIndex],
        click,
      };
      return updatedMessages;
    });
  };

  const handleSend = async () => {
    if (userInput.trim() !== "") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: userInput, sender: "user" },
      ]);
      setUserInput("");

      try {
        setIsProcessing(true);

        const { results } = await agent.solveTask(
          userInput,
          imageBase64 ?? undefined
        );

        setImageBase64(null);

        respondToUser(results);
      } catch (error: any) {
        toast.error(`Failed to perform action: ${error.message}`);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const respondToUser = (response: any) => {
    setTimeout(() => {
      response.map((res: any) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: res, sender: "bot" },
        ]);
      });
    }, 500);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div>
      {/* Chatbot Button */}
      <div className="fixed bottom-24 right-4 mb-4 mr-10 z-50 shadow-md border rounded-full">
        <button
          onClick={toggleChatbox}
          className="bg-green-600 text-white py-2 px-4 rounded-full hover:bg-green-600 transition duration-300 flex items-center h-12 cursor-pointer"
        >
          <FaComment className="w-6 h-6" />
        </button>
      </div>

      {/* Chatbox */}
      {isChatboxOpen && (
        <div className="fixed bottom-24 right-4 w-96 z-50">
          <div className="bg-white shadow-md rounded-lg max-w-lg w-full relative">
            {/* Chatbox Header */}
            <div className="p-4 border-b bg-green-600 text-white rounded-t-lg flex justify-between items-center">
              <p className="text-lg font-semibold">AI Agent</p>
              <button
                onClick={toggleChatbox}
                className="text-gray-300 hover:text-gray-400 focus:outline-none"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="p-4 h-80 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 ${
                    message.sender === "user" ? "text-right" : ""
                  }`}
                >
                  {message.sender === "prompt" ? (
                    <div className="bg-gray-100 text-gray-800 p-4 rounded-lg inline-block max-w-full">
                      <h2 className="text-md font-semibold mb-2">
                        Approve Command
                      </h2>
                      <p className="mb-2">
                        Do you want to run{" "}
                        <code className="font-mono">{message.text}</code>?
                      </p>
                      <div className="mb-2 text-sm">
                        <strong>Arguments:</strong>
                        <pre className="bg-white p-2 mt-1 rounded text-xs overflow-auto max-h-48">
                          {JSON.stringify(message.args, null, 2)}
                        </pre>
                      </div>
                      {message?.click ? (
                        <div
                          className={`text-sm mt-2 font-medium ${
                            message.click === "confirmed"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {message.click === "confirmed"
                            ? "✅ Confirmed"
                            : "❌ Cancelled"}
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={handleCancel}
                            className="bg-gray-300 cursor-pointer hover:bg-gray-400 text-gray-800 px-3 py-1 rounded"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={handleConfirm}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`${
                        message.sender === "user"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      } rounded-lg py-2 px-4 inline-block max-w-full break-words overflow-hidden`}
                    >
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </Markdown>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Chat Input */}
            {imageBase64 && (
              <div className="px-4 pt-2">
                <p className="text-xs text-gray-500 mb-1">📎 Image attached:</p>
                <img
                  src={`data:image/png;base64,${imageBase64}`}
                  alt="Preview"
                  className="max-h-32 rounded border"
                />
              </div>
            )}
            <div className="p-4 border-t flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                id="image-upload"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="image-upload"
                className="bg-gray-200 text-gray-800 px-3 py-2 rounded cursor-pointer hover:bg-gray-300"
              >
                📷
              </label>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleInputKeyPress}
                placeholder="Type a message"
                className="w-full px-3 py-2 border text-black rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleSend}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <FaSpinner className="w-5 h-5 animate-spin" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWithAdminBot;
