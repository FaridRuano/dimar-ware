'use client'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import DtUser from '@public/assets/icons/sidebar-users.webp'
import { useRouter } from '@node_modules/next/navigation'
import axios from '@node_modules/axios'

const Page = () => {

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Global Filter */

  const [globalFilter, setGlobalFilter] = useState(false)

  /* Range Dates */

  const [typeDate, setTypeDate] = useState(1)

  const handleTypeDates = (i) => {
    setInitDate('')
    setEndDate('')
    setTypeDate(i)
  }

  const [initDate, setInitDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleRangeDates = (e) => {

    const { name, value } = e.target

    if (name === 'init') {
      setInitDate(value)
      if (endDate !== '') {
        setTypeDate(5)
      }
    } else if (name === 'end') {
      setEndDate(value)
      if (initDate !== '') {
        setTypeDate(5)
      }
    }
  }

  /* Values */

  const [val1, setVale1] = useState(0)
  const [val2, setVale2] = useState(0)

  /* Small Table */

  const [xsData, setXsData] = useState([])

  /* Big Table */

  const [data, setData] = useState([])

  /* FetchData */

  const fetchData = async () => {
    setLoading(true)
    try {
      const dataObject = {
        filter: globalFilter,
        type: typeDate,
        initDate,
        endDate
      }

      const res = await axios.post('/api/manager/statistics', dataObject)
      console.log(res.data)
      setXsData(res.data.data.xsData)
      setData(res.data.data.data)
      setVale1(res.data.data.val1)
      setVale2(res.data.data.val2)

    } catch (e) {
      console.log(e)
    }
    setLoading(false)

  }

  useEffect(() => {
    fetchData()
  }, [globalFilter, typeDate, initDate, endDate])

  return (
    <>
      <div className='pagename'>
        <span>
          Estadísticas
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className="container-col w2">
            <div className="container">
              <div className="options-container l2">
                <button className={`option ${!globalFilter ? 'active' : ''}`} onClick={() => setGlobalFilter(false)}>Ventas</button>
                <button className={`option ${!globalFilter ? '' : 'active'}`} onClick={() => setGlobalFilter(true)}>Productos</button>
              </div>
              <div className="subtitle-container">
                <p>
                  Selecciona un rango de tiempo
                </p>
              </div>
              <div className="options-container fit">
                <button className={`option ${typeDate === 1 ? 'active' : ''}`} onClick={() => handleTypeDates(1)}>hoy</button>
                <button className={`option ${typeDate === 2 ? 'active' : ''}`} onClick={() => handleTypeDates(2)}>esta semana</button>
                <button className={`option ${typeDate === 3 ? 'active' : ''}`} onClick={() => handleTypeDates(3)}>esta mes</button>
                <button className={`option ${typeDate === 4 ? 'active' : ''}`} onClick={() => handleTypeDates(4)}>año</button>
              </div>
              <div className="subtitle-container">
                <p>
                  Personalizado
                </p>
              </div>
              <div className="options-container l2 dates">
                <div className='option'>
                  <input type="date" value={initDate} name='init' onChange={handleRangeDates} />
                </div>
                <div className='option'>
                  <input type="date" value={endDate} name='end' onChange={handleRangeDates} />
                </div>
              </div>
              <div className="footer-inventory">
                <span>
                  desde
                </span>
                <span>
                  hasta
                </span>
              </div>
            </div>

            <div className="container-row">
              <div className="container w2">
                <div className="title-container">
                  <span>Total {globalFilter ? 'Salidas' : 'Ventas'}</span>
                </div>
                <div className="footer-container">
                  <span><b>{val1}</b></span>
                </div>
              </div>
              <div className="container w2">
                <div className="title-container">
                  <span>Total {globalFilter ? 'Entradas' : 'Ingresos'}</span>
                </div>
                <div className="footer-container">
                  {
                    globalFilter ? (
                      <span><b>{val2.toFixed(2)}</b></span>
                    ) : (
                      <span>$<b>{val2.toFixed(2)}</b></span>
                    )
                  }
                </div>
              </div>
            </div>
            <div className="container">
              <div className="title-container">
                <span>{globalFilter ? 'Productos más vendidos' : 'Mejores vendedores'}</span>
              </div>
              {
                xsData.length > 0 ? (
                  <>
                    <div className="datatable-container">
                      <table>
                        <tbody>
                          {
                            xsData.map((dat, i) => (
                              <tr className='table-05' key={i}>
                                <td>
                                  {
                                    globalFilter ? (
                                      <b>{dat.name}</b>
                                    ) : (
                                      <b>{dat.saler}</b>
                                    )
                                  }
                                </td>
                                <td>
                                  <div className="money">
                                    {
                                      globalFilter ? (
                                        <>
                                          <b>{dat.quantity.toFixed(2)}</b>u
                                        </>
                                      ) : (
                                        <>
                                          $<b>{dat.totalSales.toFixed(2)}</b>
                                        </>
                                      )
                                    }
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
          <div className="container w3">
            <div className="title-container">
              <span>Últimos <b>movimientos</b></span>
            </div>
            {
              data.length > 0 ? (
                <>
                  <div className="datatable-container">
                    <table>
                      <tbody>
                        {
                          data.map((dat, i) => (
                            <tr className='table-02' key={i}>
                              <td>
                                <div className="dt-icon">
                                  <Image src={DtUser} width={9} height={'auto'} alt='Product' />
                                </div>
                              </td>
                              <td>
                                <b>{dat.user}</b>
                              </td>
                              <td>
                                {dat.info}
                              </td>
                              <td>
                                <div className={`money ${dat.info === 'Salida' ? 'negative' : ''}`}>
                                  {
                                    globalFilter ? (
                                      <>
                                        <b>{dat.value}</b>
                                      </>
                                    ) : (
                                      <>
                                        $<b>{dat.value}</b>
                                      </>
                                    )
                                  }
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