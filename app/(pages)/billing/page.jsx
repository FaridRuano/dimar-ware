'use client'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import BtnView from '@public/assets/icons/btn-view.webp'
import BtnDownload from '@public/assets/icons/btn-download.webp'
import axios from '@node_modules/axios'


const page = () => {

  /* Current Date */

  const getCurrentDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Total Emisions */

  const [totalEmi, setTotalEmi] = useState(0)

  /* Sales */

  const [sales, setSales] = useState([])

  const [emisions, setEmisions] = useState([])

  /* Fetch Data */

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/billing')
      setTotalEmi(res.data.data.totalEmi)
      setSales(res.data.data.sales)
      setEmisions(res.data.data.emision)

    } catch (e) {
      console.log(e)
    }
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
                <span>Bienvenido a <b>Facturación</b></span>
              </div>
            </div>
            <div className="container primary">
              <div className="row">
                <div className="title-container">
                  <span><b>Total de emisiones</b></span>
                </div>
                <div className="title-container">
                  <span><b>{getCurrentDate()}</b></span>
                </div>
              </div>
              <div className="footer-container">
                <span><b>{totalEmi}</b></span>
              </div>
            </div>
            <div className="container">
              <div className="title-container">
                <span>Últimas Transacciones</span>
              </div>
              {
                sales.length > 0 ? (
                  <>
                    <div className="datatable-container">
                      <table>
                        <tbody>
                          {
                            sales.map((dat, i) => (
                              <tr className='table-05' key={i}>
                                <td>
                                  {dat.infoFactura.razonSocialComprador}
                                </td>
                                <td>
                                  $<b>{dat.infoFactura.importeTotal}</b>
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
                    <span>No hay <b>datos que mostrar.</b></span>
                  </div>
                )
              }
            </div>
          </div>
          <div className="container w3">
            <div className="title-container">
              <span>Comprobantes emitidos <b>hoy</b></span>
            </div>
            {
              emisions.length > 0 ? (
                <>
                  <div className="datatable-container">
                    <table>
                      <tbody>
                        {
                          emisions.map((dat, i) => (
                            <tr className='table-05' key={i}>
                              <td>
                                {dat.infoFactura.razonSocialComprador}
                              </td>
                              <td>
                                <div className="btns-warp">
                                  <div className="btn-row gray">
                                    <Image src={BtnView} width={'auto'} height={12} alt='View' />
                                  </div>
                                  <div className="btn-row">
                                    <Image src={BtnDownload} width={'auto'} height={14} alt='Download' />
                                  </div>
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
                  <span>No hay <b>datos que mostrar.</b></span>
                </div>
              )
            }
          </div>
        </div >
      </div >
    </>
  )
}

export default page