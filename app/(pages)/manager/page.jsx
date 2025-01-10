'use client'

import React, { act, useEffect, useState } from 'react'
import DtProduct from '@public/assets/icons/table-product.webp'
import DtUser from '@public/assets/icons/sidebar-users.webp'
import ArrowOut from '@public/assets/icons/arrow-out.webp'
import Image from 'next/image'
import axios from '@node_modules/axios'

const Page = () => {

  /* Totales */

  const [totalClients, setTotalClients] = useState(0)

  const [totalProducts, setTotalProducts] = useState(0)

  const [totalStock, setTotalStock] = useState(0)

  /* Entries and Exits */

  const [entries, setEntries] = useState(0)

  const [exits, setExits] = useState(0)

  const [totalMovements, setTotalMovements] = useState(0)

  /* Top 5 Products */

  const [top5Prod, setTop5Prod] = useState([])

  /* Monthly Sales */

  const [monthlySales, setMonthlySales] = useState('0.00')

  const [activeMonth, setActiveMonth] = useState({
    id: new Date().getMonth(),
    month: '',
    year: new Date().getFullYear()
  })

  const [topSellers, setTopSellers] = useState([])

  const getLast6Months = () => {
    const months = [
      { id: 0, month: 'ene' },
      { id: 1, month: 'feb' },
      { id: 2, month: 'mar' },
      { id: 3, month: 'abr' },
      { id: 4, month: 'may' },
      { id: 5, month: 'jun' },
      { id: 6, month: 'jul' },
      { id: 7, month: 'ago' },
      { id: 8, month: 'sep' },
      { id: 9, month: 'oct' },
      { id: 10, month: 'nov' },
      { id: 11, month: 'dic' },
    ]

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const last6Months = []

    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - i + 12) % 12
      const year = currentYear - (currentMonth - i < 0 ? 1 : 0)
      last6Months.push({
        id: months[monthIndex].id,
        month: months[monthIndex].month,
        year,
      })
    }
    return last6Months.reverse()
  }

  const handleMonthClick = (mth) => {
    setActiveMonth(mth)
  }

  const currentYear = new Date().getFullYear()

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ]

  /* Data Fetch */

  const fetchData = async () => {
    const dataObject = {
      month: activeMonth.id,
      year: activeMonth.year
    }
    try {
      const res = await axios.post('/api/manager', dataObject)
      setMonthlySales(res.data.data.totalSales)
      setTop5Prod(res.data.data.top5Products)
      setEntries(res.data.data.totalEntries)
      setExits(res.data.data.totalExits)
      setTotalMovements(res.data.data.totalEntries + res.data.data.totalExits)
      setTopSellers(res.data.data.topSellers)
      setTotalClients(res.data.data.totalClients)
      setTotalProducts(res.data.data.totalProducts)
      setTotalStock(res.data.data.totalStock)
    } catch (e) {
      console.log(e)
    }
  }

  useEffect(() => {
    setActiveMonth({
      id: new Date().getMonth(),
      month: '',
      year: new Date().getFullYear()
    })
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeMonth])

  return (
    <>
      <div className="pagename">
        <span>
          Inicio
        </span>
      </div>
      <div className='workspace'>
        <div className="container-row h2">
          <div className="container w2">
            <div className="title-container">
              <span>Total ventas <b>mensuales</b></span>
            </div>
            <div className="content-warp bottom h5">
              <div className="options-container">
                {getLast6Months().map((month, index) => (
                  <button
                    key={index}
                    className={`option ${activeMonth.id === month.id ? 'active' : ''}`}
                    onClick={() => handleMonthClick(month)}
                  >
                    {month.month}
                  </button>
                ))}
              </div>
            </div>
            <div className="footer-container">
              <p>
                Este mes tu empresa ha vendido
              </p>
              <span>$<b>{monthlySales}</b></span>
            </div>
          </div>
          <div className="container w3">
            <div className="extend-btn">
              <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
            </div>
            <div className="title-container">
              <span>Productos <b>más vendidos</b></span>
            </div>
            {
              top5Prod.length > 0 ? (
                <div className="datatable-container">
                  <table>
                    <tbody>
                      {
                        top5Prod.map((dat, i) => (
                          <tr className='table-01' key={i}>
                            <td>
                              <div className="dt-icon">
                                <Image src={DtProduct} width={9} height={'auto'} alt='Product' />
                              </div>
                            </td>
                            <td>
                              <div className="no-icon">
                                {i + 1}
                              </div>
                            </td>
                            <td>
                              {dat.name}
                            </td>
                            <td>
                              <div className="number">
                                {dat.quantity} <span>unidades</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="title-container">
                  <span>No existen <b>datos que mostrar</b></span>
                </div>
              )
            }
          </div>
        </div>
        <div className="container-row h3">
          <div className="container-col w3">
            <div className="container h1">
              <div className="extend-btn">
                <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
              </div>
              <div className="title-container">
                <span>Movimientos del <b>inventario</b></span>
              </div>
              <div className="inventory-bar">
                <div className="entrance-bar"
                  style={{
                    width: `${totalMovements > 0 ? (entries / totalMovements) * 100 : 50}%`,
                  }}
                >
                  <p>
                    {entries} <span>u</span>
                  </p>
                </div>
                <div className="outs-bar"
                  style={{
                    width: `${totalMovements > 0 ? (exits / totalMovements) * 100 : 50}%`,
                  }}
                >
                  <p>
                    {exits} <span>u</span>
                  </p>
                </div>
              </div>
              <div className="footer-inventory">
                <span>Entradas</span>
                <span>Salidas</span>
              </div>
            </div>
            <div className="container h3">
              <div className="title-container">
                <div className="extend-btn">
                  <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
                </div>
                <span>Tabla de <b>vendedores</b></span>
              </div>
              {
                topSellers.length > 0 ? (
                  <div className="datatable-container">
                    <table>
                      <tbody>
                        {
                          topSellers.map((dat, i) => (
                            <tr className='table-01' key={i}>
                              <td>
                                <div className="dt-icon">
                                  <Image src={DtUser} width={9} height={'auto'} alt='Product' />
                                </div>
                              </td>
                              <td>
                                <div className="no-icon">
                                  {i + 1}
                                </div>
                              </td>
                              <td>
                                {dat.name}
                              </td>
                              <td>
                                <div className="money">
                                  $<b>{dat.total.toFixed(2)}</b>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="title-container">
                    <span>No existen <b>datos que mostrar</b></span>
                  </div>
                )
              }
              <div className="footer-end">
                {months[activeMonth]} {currentYear}
              </div>
            </div>
          </div>
          <div className="container-col w2">
            <div className="container h1 black">
              <div className="extend-btn">
                <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
              </div>
              <div className="title-container">
                <span>Clientes</span>
              </div>
              <div className="footer-container">
                <b className='white'>{totalClients}</b>
              </div>
            </div>
            <div className="container h1 primary">
              <div className="extend-btn">
                <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
              </div>
              <div className="title-container">
                <span>Productos</span>
              </div>
              <div className="footer-container">
                <b className='white'>{totalProducts}</b>
              </div>
            </div>
            <div className="container h1 primary">
              <div className="extend-btn">
                <Image src={ArrowOut} width={10} height={'auto'} alt='Extend' />
              </div>
              <div className="title-container">
                <span>Inventario</span>
              </div>
              <div className="footer-container">
                <b className='white'>{totalStock}</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page