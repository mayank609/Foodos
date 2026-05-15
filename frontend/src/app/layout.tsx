import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Foodos — Compare Food Delivery Prices',
  description: 'Find the cheapest food delivery option across Swiggy, Zomato, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <footer className="mt-16 border-t border-gray-100 bg-white py-8 text-center text-xs text-gray-400">
            Foodos — Google Flights for food delivery · Prices updated every 15 min
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
