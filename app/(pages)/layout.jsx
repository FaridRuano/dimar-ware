'use client'
import Image from "next/image";
import DimarBtn from "@public/assets/icons/dimar-btn.webp"
import ExitBtn from "@public/assets/icons/exit-btn.webp"
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";


export default function RootLayout({ children }) {

  const router = useRouter()

  const handleHomeUser = () => {
    const token = localStorage.getItem('APSOQMEU')
    const decoded = jwtDecode(token)
    const userRole = decoded.rol
    if (userRole === 'Administrador') {
      router.push('/manager')
    } else if (userRole === 'Gerente') {
      router.push('/manager')
    } else if (userRole === 'Vendedor') {
      router.push('/sales')
    } else if (userRole === 'Bodeguero') {
      router.push('/storage')
    } else if (userRole === 'Cajero') {
      router.push('/billing')
    }
  }

  const handleEndSession = () => {
    localStorage.removeItem('APSOQMEU')
    router.push('/')
  }

  useEffect(() => {
    const token = localStorage.getItem('APSOQMEU')
    if(!token){
      router.push('/')
    }
  }, [])

  return (
    <div className="app">
      <div className="global-btn" onClick={() => handleHomeUser()}>
        <Image src={DimarBtn} width={19} height={'auto'} alt="Dimar Logo" />
      </div>
      <div className="global-btn exit" onClick={() => handleEndSession()}>
        <Image src={ExitBtn} width={16} height={'auto'} alt="Dimar Logo" />
      </div>
      {children}
    </div>
  )
}
