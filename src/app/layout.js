import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "sonner"; // Importamos el componente de notificaciones

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MariVama - CDF Web",
  description: "Sistema de control de fiados para Empanadas y Fritos MariVama",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col transition-colors duration-300">
        <ThemeProvider>
          {children}
          
          {/* Configuración de Notificaciones MariVama:
            - position: Arriba al centro para que ella lo vea fácil.
            - richColors: Colores vivos para éxito/error.
            - toastOptions: Estilo con bordes muy redondeados como el resto de la app.
          */}
          <Toaster 
            position="top-center" 
            expand={false} 
            richColors 
            closeButton
            toastOptions={{
              style: { 
                borderRadius: '1.5rem', 
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: '2px solid #ea580c' // Borde naranja MariVama
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}