'use client'
import Image from 'next/image'
import React from 'react'
import Home from '@public/assets/icons/sidebar-home.webp'
import Sales from '@public/assets/icons/sidebar-sales.webp'
import Bills from '@public/assets/icons/sidebar-bills.webp'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const BillingBar = () => {

    const router = useRouter()

    const pathname = usePathname()

    const [activePage, setActivePage] = useState('')

    const handleActivePage = (id) => {

        setActivePage(id)

        router.push(id)
    }

    const isActive = (path) => {
        if (path === "/billing/sales") {
            return pathname.startsWith("/billing/sales")
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
                <div className={activePage === '/billing' ? 'sidebar-btn active' : 'sidebar-btn'} onClick={() => handleActivePage('/billing')}>
                    <Image src={Home} width={19} height={'auto'} alt='Home' />
                </div>
                <div className={isActive('/billing/sales') ? 'sidebar-btn active' : 'sidebar-btn'} onClick={() => handleActivePage('/billing/sales')}>
                    <Image src={Sales} width={16} height={'auto'} alt='Products' />
                </div>
                <div className={activePage === '/billing/bills' ? 'sidebar-btn active' : 'sidebar-btn'} onClick={() => handleActivePage('/billing/bills')}>
                    <Image src={Bills} width={21} height={'auto'} alt='Inventory' />
                </div>
            </div>
        </div>
    )
}

export default BillingBar