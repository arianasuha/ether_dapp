import "@/styles/globals.css";
import { Web3Provider } from "@/context/Web3Context";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
