import StorageBar from "@public/components/sidebars/StorageBar";

export default function RootLayout({ children }) {
  return (
    <>
        <StorageBar/>
        <div className="page">
            {children}
        </div>
    </>
  )
}
