'use client'

import React, { useEffect, useState } from 'react'
import Bill from '@public/assets/icons/btn-bill.webp'
import Search from '@public/assets/icons/search-icon.webp'
import Next from '@public/assets/icons/dt-next.webp'
import End from '@public/assets/icons/dt-end.webp'
import Start from '@public/assets/icons/dt-start.webp'
import Previous from '@public/assets/icons/dt-previous.webp'
import Deselect from '@public/assets/icons/btn-deselect.webp'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from '@node_modules/axios'

const page = () => {

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Datatable */

  const [data, setData] = useState([])

  const [currentPage, setCurrentPage] = useState(1)

  const [currentType, setCurrentType] = useState(1)

  const [totalPages, setTotalPages] = useState(1)

  const [totalData, setTotalData] = useState(0)

  const [totalData2, setTotalData2] = useState(0)

  const [totalData3, setTotalData3] = useState(0)

  const [totalData4, setTotalData4] = useState(0)

  const fetchData = async (type = 1, page = 1, term = '') => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/billing/sales?type=${type}&page=${page}&term=${term}`)
      const data = (res.data)
      setData(data.data)
      setCurrentPage(data.currentPage)
      setTotalPages(data.totalPages)
      setTotalData(data.totalSales)
      setTotalData2(data.totalSalesPending)
      setTotalData3(data.totalSalesToDeliver)
      setTotalData4(data.totalSalesComplete)
    } catch (e) {
      console.log('Something went wrong:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    setCurrentPage(prevPage => prevPage + 1)
  }

  const handlePrevPage = () => {
    setCurrentPage(prevPage => (prevPage > 1 ? prevPage - 1 : prevPage))
  }

  const handleFirstPage = () => {
    setCurrentPage(1);
  }

  const handleLastPage = () => {
    setCurrentPage(totalPages)
  }

  /* Select Row */

  const [selRow, setSelRow] = useState({
    _id: 0
  })

  /* Facture Row */

  const handleFacture = (id = null) => {
    if(id !== null){
      if(selRow.status === 'Pendiente'){
        router.push(`/billing/sales/${selRow._id}`)
      }
    }
  }

  const [searchVal, setSearchVal] = useState('')

  const handleSearchVal = (e) => {
    const value = e.target.value
    const regex = /^[a-zA-Z0-9]*$/

    if (regex.test(value)) {
      setSearchVal(value);
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setLoading(true)
    setCurrentPage(1)
    fetchData(1, 1, searchVal)
    setLoading(false)
  }, [searchVal])

  useEffect(() => {
    setLoading(true)
    fetchData(currentType, currentPage, '')
    setLoading(false)
  }, [currentType, currentPage])

  return (
    <>
      <div className='pagename'>
        <span>
          Facturar
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className={`container w1 hble ${currentType === 1 ? ('active') : ('')}`} onClick={() => setCurrentType(1)}>
            <div className="row">
              <div className="title-container">
                <span><b>Todas</b></span>
              </div>
              <div className="title-container">
                <span><b>{totalData}</b></span>
              </div>
            </div>
          </div>
          <div className={`container w1 secondary hble ${currentType === 2 ? ('active') : ('')}`} onClick={() => setCurrentType(2)}>
            <div className="row">
              <div className="title-container">
                <span><b>Pendientes</b></span>
              </div>
              <div className="title-container">
                <span><b>{totalData2}</b></span>
              </div>
            </div>
          </div>
          <div className={`container w1 primary hble ${currentType === 3 ? ('active') : ('')}`} onClick={() => setCurrentType(3)}>
            <div className="row">
              <div className="title-container">
                <span><b>Por entregar</b></span>
              </div>
              <div className="title-container">
                <span><b>{totalData3}</b></span>
              </div>
            </div>
          </div>
          <div className={`container w1 black hble ${currentType === 4 ? ('active') : ('')}`} onClick={() => setCurrentType(4)}>
            <div className="row">
              <div className="title-container">
                <span><b>Completas</b></span>
              </div>
              <div className="title-container">
                <span><b>{totalData4}</b></span>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="warp">
          </div>
          <div className={"warp"}>
            <div className={`btn-base-div secondary ${selRow._id !== 0 && selRow.status === 'Pendiente' ? '' : 'dis'}`} onClick={() => handleFacture(selRow._id)}>
              <div className="btn-icon">
                <Image src={Bill} width={'auto'} height={13} alt='Complete' />
              </div>
              <div className="btn-name">
                Facturar
              </div>
            </div>
          </div>
        </div>
        <div className="container">
          <div className="search-bar">
            <div className="search-icon">
              <Image src={Search} width={'auto'} height={20} alt='Search' />
            </div>
            <input type="text" placeholder='Buscar' value={searchVal} onChange={handleSearchVal} />
            <div className={selRow._id === 0 ? "deselect-icon hide" : "deselect-icon"} onClick={() => setSelRow({ _id: 0 })}>
              <Image src={Deselect} width={'auto'} height={20} alt='Search' />
            </div>
          </div>
          {
            data.length > 0 ? (
              <div className="datatable-container">
                <table>
                  <thead>
                    <tr className='table-08 nb'>
                      <th>
                        Cod
                      </th>
                      <th>
                        Cliente
                      </th>
                      <th>
                        Total
                      </th>
                      <th>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      data.map((dat, i) => (
                        <tr className={selRow._id === dat._id ? 'table-08 active' : 'table-08'} key={i}
                          onClick={() => setSelRow(dat)}
                          onDoubleClick={() => handleFacture(dat._id)}>
                          <td>
                            {dat.cod}
                          </td>
                          <td>
                            {dat.name}
                          </td>
                          <td>
                            $<b>{dat.total}</b>
                          </td>
                          <td>
                            {
                              (() => {
                                switch (dat.status) {
                                  case 'Pendiente':
                                    return <div className="status secondary">Pendiente</div>;
                                  case 'Por Entregar':
                                    return <div className="status primary">Por Entregar</div>;
                                  case 'Completa':
                                    return <div className="status black">Completa</div>;
                                  default:
                                    return <div className="status">Desconocido</div>
                                }
                              })()
                            }
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
        {
          data.length > 0 && (
            <div className="dt-footer">
              <div className="warp">
                <Image className={`arrow ${currentPage === 1 ? 'dis' : ''}`} src={Start} width={'auto'} height={18} alt='Start' onClick={handleFirstPage} />
                <Image className={`arrow ${currentPage === 1 ? 'dis' : ''}`} src={Previous} width={'auto'} height={18} alt='Previous' onClick={handlePrevPage} />
                <span>
                  <b>{currentPage} de {totalPages}</b>
                </span>
                <Image className={`arrow ${currentPage === totalPages ? 'dis' : ''}`} src={Next} width={'auto'} height={18} alt='Next' onClick={handleNextPage} />
                <Image className={`arrow ${currentPage === totalPages ? 'dis' : ''}`} src={End} width={'auto'} height={18} alt='End' onClick={handleLastPage} />
              </div>
            </div>
          )
        }
      </div>
    </>
  )
}

export default page