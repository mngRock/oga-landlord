import { Toaster } from 'react-hot-toast';
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

// The broken import statements for lightgallery have been removed.

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'] 
});

export const metadata: Metadata = {
  title: "Oga Landlord",
  description: "Nigeria's Premier Rental Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={poppins.className}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}

