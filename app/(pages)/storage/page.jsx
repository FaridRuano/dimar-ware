'use client'

import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import DtUser from '@public/assets/icons/sidebar-users.webp'
import axios from 'axios'

const Page = () => {

  const [loading, setLoading] = useState(true)

  /* Data */

  const [totalStock, setTotalStock] = useState(0)
  const [entries, setEntries] = useState(0)
  const [exists, setExits] = useState(0)
  const [lowStockData, setLowStockData] = useState([])
  const [dataMoves, setDataMoves] = useState([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/storage')
      const data = res.data
      setTotalStock(data.totalInventory)
      setEntries(data.entriesToday)
      setExits(data.exitsToday)
      setLowStockData(data.lowStockProducts)
      setDataMoves(data.latestEntriesExits.slice(0,15))
      console.log(data.latestEntriesExits.length)
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
                <span>Bienvenido a <b>Bodega</b></span>
              </div>
            </div>
            <div className="container primary">
              <div className="title-container">
                <span><b>Inventario</b></span>
              </div>
              <div className="footer-container">
                <span><b>{totalStock}</b></span>
              </div>
            </div>
            <div className="container-row">
              <div className="container w2 secondary">
                <div className="title-container">
                  <span>Entradas de <b>hoy</b></span>
                </div>
                <div className="footer-container">
                  <span><b>{entries}</b></span>
                </div>
              </div>
              <div className="container w2 third">
                <div className="title-container">
                  <span>Salidas de <b>hoy</b></span>
                </div>
                <div className="footer-container">
                  <span><b>{exists}</b></span>
                </div>
              </div>
            </div>
            <div className="container">
              <div className="title-container">
                <span>Productos con stock <b>bajo</b></span>
              </div>
              {
                lowStockData.length > 0 ? (
                  <>
                    <div className="datatable-container">
                      <table>
                        <tbody>
                          {
                            lowStockData.map((data, i) => (
                              <tr className='table-05' key={i}>
                                <td>
                                  {data.name}
                                </td>
                                <td>
                                  <b>{data.stock}</b>
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
              <span>Últimos <b>movimientos</b></span>
            </div>
            {
              dataMoves.length > 0 ? (
                <>
                  <div className="datatable-container">
                    <table>
                      <tbody>
                        {
                          dataMoves.map((data, i) => (
                            <tr className='table-05' key={i}>
                              <td>
                                {data.name}
                              </td>
                              <td>
                                {
                                  data.method === 'Entrada' ? (
                                    <div className="money">
                                      +<b>{data.amount}</b>
                                    </div>
                                  ) : (
                                    <div className="money negative">
                                      <b>{data.amount}</b>
                                    </div>
                                  )
                                }

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