'use client'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import DtUser from '@public/assets/icons/sidebar-users.webp'
import axios from '@node_modules/axios'

const Page = () => {

  const [loading, setLoading] = useState(true)

  /* Current Date */

  const getCurrentDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  const [dataSales, setDataSales] = useState([])
  const [totalSales, setTotalSales] = useState(0)
  const [latestClients, setLatestClients] = useState([])

  const fetchData = async () => {
    setLoading(false)
    try {
      const res = await axios.get('/api/sales')
      setDataSales(res.data.latestSales)
      setTotalSales(res.data.totalSales)
      setLatestClients(res.data.latestClients)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <>
      <div className='pagename'>
        <span>
          Inicio
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className="container-col w2">
            <div className="container">
              <div className="title-container">
                <span>Bienvenido a <b>Ventas</b></span>
              </div>
            </div>
            <div className="container primary">
              <div className="row">
                <div className="title-container">
                  <span><b>Total de ventas</b></span>
                </div>
                <div className="title-container">
                  <span><b>{getCurrentDate()}</b></span>
                </div>
              </div>
              <div className="footer-container">
                <span>$<b>{totalSales}</b></span>
              </div>
            </div>
            <div className="container">
              <div className="title-container">
                <span>Últimos clientes</span>
              </div>
              {
                latestClients.length > 0 ? (
                  <>
                    <div className="datatable-container">
                      <table>
                        <tbody>
                          {
                            latestClients.map((dat, i) => (
                              <tr className='table-05' key={i}>
                                <td>
                                  {dat.name}
                                </td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                    <div className="footer-a-end">
                      <div className="btn-base black">
                        <button>Ver Todos</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="title-container">
                    <span>No existen <b>datos que mostrar.</b></span>
                  </div>
                )
              }
            </div>
          </div>
          <div className="container w3">
            <div className="title-container">
              <span>Ventas <b>recientes</b></span>
            </div>
            {
              dataSales.length > 0 ? (
                <>
                  <div className="datatable-container">
                    <table>
                      <tbody>
                        {
                          dataSales.map((dat, i) => (
                            <tr className='table-05' key={i}>
                              <td>
                                {dat.name}
                              </td>
                              <td>
                                <div className="money">
                                  +<b>{dat.total}</b>
                                </div>
                              </td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                  <div className="footer-a-end">
                    <div className="btn-base black">
                      <button>Ver Todos</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="title-container">
                  <span>No existen <b>datos que mostrar.</b></span>
                </div>
              )
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default Page