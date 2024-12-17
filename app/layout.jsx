import '@public/styles/globals.scss'

export const metadata = {
  title: "Dimar Group",
  description: "Bienvenido al sistema de gestion empresarial de Dimar Group",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <main>
            {children}
        </main>
      </body>
    </html>
  )
}
