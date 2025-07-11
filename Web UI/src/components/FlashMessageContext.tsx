import React, { createContext, useContext, useState, ReactNode } from "react";

type FlashMessageType = "success" | "danger" | "info";

interface FlashMessage {
  type: FlashMessageType;
  message: string;
}

interface FlashMessageContextValue {
  flashMessage: FlashMessage | null;
  setFlashMessage: (msg: FlashMessage | null) => void;
}

const FlashMessageContext = createContext<FlashMessageContextValue | undefined>(
  undefined
);

export const FlashMessageProvider = ({ children }: { children: ReactNode }) => {
  const [flashMessage, setFlashMessage] = useState<FlashMessage | null>(null);

  return (
    <FlashMessageContext.Provider value={{ flashMessage, setFlashMessage }}>
      {children}
    </FlashMessageContext.Provider>
  );
};

export const useFlashMessage = () => {
  const context = useContext(FlashMessageContext);
  if (!context) {
    throw new Error("useFlashMessage must be used within FlashMessageProvider");
  }
  return context;
};
