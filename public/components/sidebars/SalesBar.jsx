'use client'
import Image from 'next/image'
import React from 'react'
import Home from '@public/assets/icons/sidebar-home.webp'
import Sales from '@public/assets/icons/sidebar-sales.webp'
import Clients from '@public/assets/icons/sidebar-clients.webp'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const SalesBar = () => {

    const router = useRouter()

    const pathname = usePathname()

    const [activePage, setActivePage] = useState('')

    const handleActivePage = (id) => {

        setActivePage(id)

        router.push(id)
    }

    const isActive = (path) => {
        if (path === "/sales/sales") {
            return pathname.startsWith("/sales/sales")
        }
        return activePage === path
    }

    useEffect(() => {
        if (pathname) {
          setActivePage(pathname)
        }
    }, [pathname])

  return (
    <div className='sidebar'>
        <div className="btns-warp">
            <div className={activePage === '/sales' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/sales')}>
                <Image src={Home} width={19} height={'auto'} alt='Home'/>
            </div>
            <div className={isActive('/sales/sales') ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/sales/sales')}>
                <Image src={Sales} width={16} height={'auto'} alt='Products'/>
            </div>
            <div className={activePage === '/sales/clients' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/sales/clients')}>
                <Image src={Clients} width={21} height={'auto'} alt='Inventory'/>
            </div>
        </div>
    </div>
  )
}

export default SalesBar