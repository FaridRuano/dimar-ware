import SalesBar from "@public/components/sidebars/SalesBar";

export default function RootLayout({ children }) {
  return (
    <>
        <SalesBar/>
        <div className="page">
            {children}
        </div>
    </>
  )
}
