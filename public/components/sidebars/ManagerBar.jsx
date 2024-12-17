'use client'
import Image from 'next/image'
import React from 'react'
import Home from '@public/assets/icons/sidebar-home.webp'
import Workspaces from '@public/assets/icons/sidebar-workspaces.webp'
import Statistics from '@public/assets/icons/sidebar-statistics.webp'
import Users from '@public/assets/icons/sidebar-users.webp'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const ManagerBar = () => {

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

  return (
    <div className='sidebar'>
        <div className="btns-warp">
            <div className={activePage === '/manager' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/manager')}>
                <Image src={Home} width={19} height={'auto'} alt='Home'/>
            </div>
            <div className={activePage === '/manager/workspaces' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/manager/workspaces')}>
                <Image src={Workspaces} width={16} height={'auto'} alt='Workspaces'/>
            </div>
            <div className={activePage === '/manager/statistics' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/manager/statistics')}>
                <Image src={Statistics} width={21} height={'auto'} alt='Statistics'/>
            </div>
            <div className={activePage === '/manager/users' ? 'sidebar-btn active':'sidebar-btn'} onClick={()=>handleActivePage('/manager/users')}>
                <Image src={Users} width={15} height={'auto'} alt='Users'/>
            </div>
        </div>
    </div>
  )
}

export default ManagerBar