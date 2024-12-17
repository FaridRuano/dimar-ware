'use client'
import Image from 'next/image'
import React from 'react'
import Home from '@public/assets/icons/sidebar-home.webp'
import Products from '@public/assets/icons/sidebar-products.webp'
import Inventory from '@public/assets/icons/sidebar-inventory.webp'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const StorageBar = () => {

    const router = useRouter()

    const pathname = usePathname()

    const [activePage, setActivePage] = useState('')

    const handleActivePage = (id) => {

        setActivePage(id)

        router.push(id)
    }

    useEffect(() => {
        if (pathname) {
          setActivePage(pathname)
        }
    }, [pathname])

    const isActive = (path) => {
        if (path === "/storage/inventory") {
          return pathname.startsWith("/storage/inventory")
        }
        return activePage === path
      }

  return (
    <div className='sidebar'>
        <div className="btns-warp">
            <div className={activePage === '/storage' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/storage')}>
                <Image src={Home} width={19} height={'auto'} alt='Home'/>
            </div>
            <div className={activePage === '/storage/products' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/storage/products')}>
                <Image src={Products} width={16} height={'auto'} alt='Products'/>
            </div>
            <div className={isActive("/storage/inventory") ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/storage/inventory')}>
                <Image src={Inventory} width={21} height={'auto'} alt='Inventory'/>
            </div>
        </div>
    </div>
  )
}

export default StorageBar