import BillingBar from "@public/components/sidebars/BillingBar";

export default function RootLayout({ children }) {
  return (
    <>
        <BillingBar/>
        <div className="page">
            {children}
        </div>
    </>
  )
}
