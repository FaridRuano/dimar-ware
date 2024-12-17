import ManagerBar from "@public/components/sidebars/ManagerBar";

export default function RootLayout({ children }) {
  return (
    <>
        <ManagerBar/>
        <div className="page">
            {children}
        </div>
    </>
  )
}
