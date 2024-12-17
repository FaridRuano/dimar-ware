'use client'
import Image from 'next/image'
import React from 'react'
import User from '@public/assets/icons/sidebar-users.webp'
import Sales from '@public/assets/icons/sidebar-sales.webp'
import Products from '@public/assets/icons/sidebar-products.webp'
import Statistics from '@public/assets/icons/sidebar-statistics.webp'
import Clients from '@public/assets/icons/sidebar-clients.webp'
import Bills from '@public/assets/icons/sidebar-bills.webp'
import Inventory from '@public/assets/icons/sidebar-inventory.webp'
import { useRouter } from 'next/navigation'

const page = () => {

  const router = useRouter()

  const handleRouting = (page) =>{
    router.push('/'+page)
  }

  return (
    <>
      <div className='pagename'>
        <span>
          Áreas de Trabajo
        </span>
      </div>
      <div className="workspace">
        <div className="container w3">
          <div className="workspaces-warp">
            <div className="warp-01">
              <div className="workspace01" onClick={()=>handleRouting('manager/users')}>
                <div className="workspace-icon">
                  <Image src={User} width={'auto'} height={20} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Usuarios
                </div>
              </div>
              <div className="workspace01" onClick={()=>handleRouting('sales/sales')}>
                <div className="workspace-icon">
                  <Image src={Sales} width={'auto'} height={20} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Ventas
                </div>
              </div>
              <div className="workspace01" onClick={()=>handleRouting('sales/clients')}>
                <div className="workspace-icon">
                  <Image src={Clients} width={'auto'} height={20} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Clientes
                </div>
              </div>
              <div className="workspace01" onClick={()=>handleRouting('billing/sales')}>
                <div className="workspace-icon">
                  <Image src={Bills} width={'auto'} height={17} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Facturación
                </div>
              </div>
            </div>
            <div className="warp-01">
              <div className="workspace01" onClick={()=>handleRouting('storage/products')}>
                <div className="workspace-icon">
                  <Image src={Products} width={'auto'} height={18} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Productos
                </div>
              </div>
              <div className="workspace01"  onClick={()=>handleRouting('storage/inventory')}>
                <div className="workspace-icon">
                  <Image src={Inventory} width={'auto'} height={20} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Inventario
                </div>
              </div>
              <div className="workspace01" onClick={()=>handleRouting('manager/statistics')}>
                <div className="workspace-icon">
                  <Image src={Statistics} width={'auto'} height={17} alt='Users'/>
                </div>
                <div className="workspace-name">
                  Estadísticas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default page