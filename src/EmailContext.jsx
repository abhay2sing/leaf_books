import { createContext, useContext, useState } from "react";

const EmailContext = createContext(null);

export function EmailProvider({ children }) {
  const [email, setEmail] = useState("");

  return (
    <EmailContext.Provider value={{ email, setEmail }}>
      {children}
    </EmailContext.Provider>
  );
}

export function useEmail() {
  const context = useContext(EmailContext);
  if (!context) {
    throw new Error("useEmail must be used within an EmailProvider.");
  }
  return context;
}