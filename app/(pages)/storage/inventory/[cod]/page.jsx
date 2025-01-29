'use client'

import React, { useEffect, useState } from 'react'
import BtnAdd from '@public/assets/icons/btn-add.webp'
import BtnOut from '@public/assets/icons/btn-out.webp'
import BtnDelete from '@public/assets/icons/btn-delete.webp'
import Next from '@public/assets/icons/dt-next.webp'
import End from '@public/assets/icons/dt-end.webp'
import Start from '@public/assets/icons/dt-start.webp'
import Previous from '@public/assets/icons/dt-previous.webp'
import Deselect from '@public/assets/icons/btn-deselect.webp'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { jwtDecode } from '@node_modules/jwt-decode/build/cjs'

const Page = ({ params }) => {

  const { cod } = React.use(params)

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Product */

  const [product, setProduct] = useState({
    cod: '00000',
    name: 'Material',
    stock: 0,
    price: 0,
    und: '',
    cat: ''
  })

  const [data, setData] = useState([])

  const [currentPage, setCurrentPage] = useState(1)

  const [totalPages, setTotalPages] = useState(1)

  const fetchOneData = async (cod) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/storage/products/single?cod=${cod}&action=${'one'}`)
      const prod = res.data.data
      setProduct({
        cod: prod.cod,
        name: prod.name,
        stock: prod.stock,
        price: prod.price,
        und: prod.und,
        cat: prod.cat
      })
    } catch (e) {
      console.log(e)
    }
  }

  const fetchData = async (page = 1) => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/storage/products/single?cod=${cod}&page=${page}`)
      setData(res.data.data)
      setCurrentPage(res.data.currentPage)
      setTotalPages(res.data.totalPages)
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

  /* Form Handler */

  const [isAdd, setAdd] = useState(false)

  const [method, setMethod] = useState('')

  const handleAdd = (method) => {
    setMethod(method)
    setAdd(current => !current)
  }

  /* New Data */

  const [newData, setNewData] = useState({
    amount: '',
    reason: '',
  })

  const [errIncomplete, setErrIncomplete] = useState(false)

  const handleNewData = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;

    if (name === "amount") {
      sanitizedValue = value.replace(/[^0-9.]/g, "")
      const parts = sanitizedValue.split(".")
      if (parts.length > 2) {
        sanitizedValue = parts[0] + "." + parts.slice(1).join("")
      }
      if (parts[1]?.length > 2) {
        sanitizedValue = `${parts[0]}.${parts[1].slice(0, 2)}`
      }
    }

    setNewData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleIncomplete = () => {
    setErrIncomplete(true)

    setTimeout(() => {
      setErrIncomplete(false)
    }, 5000)
  }

  const sendData = async (e) => {
    e.preventDefault()
    if (newData.amount.length === 0 || newData.reason.length === 0) {
      handleIncomplete()
    } else {
      setErrIncomplete(false)
      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name
      const dataObject = {
        cod: cod,
        name: product.name,
        amount: newData.amount,
        method: method,
        reason: newData.reason,
        user: user
      }


      try {
        const res = await axios.post(`/api/storage/products/single`, dataObject)
        setNewData({
          amount: '',
          reason: '',
        })
        fetchOneData(cod)
        fetchData()
        handleAdd('')
      } catch (e) {
        console.log(e)
      }

    }
  }

  useEffect(() => {
    fetchOneData(cod)
    fetchData()
  }, [])

  return (
    <>
      <div className='pagename'>
        <span>
          Inventario
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className="container w2">
            <div className="row">
              <div className="title-container">
                <span><b>{product.cod}</b></span>
              </div>
              <div className="title-container">
                <span><b>{product.name}</b></span>
              </div>
            </div>
          </div>
          <div className="container w3 primary">
            <div className="row">
              <div className="title-container">
                <span><b>Stock:</b></span>
              </div>
              <div className="title-container">
                <span><b>{product.stock}</b> {product.und}</span>
              </div>
            </div>
          </div>
          <div className="container hble" onClick={() => router.push('/storage/products')}>
            <div className="inner-btn">
              <Image src={Deselect} width={10} height={'auto'} alt='Extend' />
            </div>
          </div>
        </div>
        <div className="row">
          {
            isAdd ? (
              <div className="warp">
                <div className={"btn-base-div gray"} onClick={handleAdd}>
                  <div className="btn-icon">
                    <Image src={BtnDelete} width={'auto'} height={13} alt='Add' />
                  </div>
                  <div className="btn-name">
                    Cancelar
                  </div>
                </div>
              </div>
            ) : (
              <div className={"warp"}>
                <div className={'btn-base-div secondary'} onClick={() => handleAdd('add')}>
                  <div className="btn-icon">
                    <Image src={BtnAdd} width={'auto'} height={13} alt='Edit' />
                  </div>
                  <div className="btn-name">
                    Entrada
                  </div>
                </div>
                <div className={`btn-base-div third`} onClick={() => handleAdd('subs')}>
                  <div className="btn-icon">
                    <Image src={BtnOut} width={14} height={'auto'} alt='Disable' />
                  </div>
                  <div className="btn-name">
                    Salida
                  </div>
                </div>
              </div>
            )
          }
        </div>

        {
          isAdd ? (
            <>
              <div className="container">
                <div className="title-container">
                  <b>Datos del producto</b>
                </div>
                <form className='form-container' type='submit' onSubmit={sendData}>
                  <div className="row">
                    <div className="input-form full">
                      <div className='input-name'>
                        Cantidad:
                      </div>
                      <input type="text" value={newData.amount} onChange={handleNewData} name='amount' maxLength={10} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-form full">
                      <div className='input-name'>
                        Motivo:
                      </div>
                      <input type="text" value={newData.reason} onChange={handleNewData} name='reason' maxLength={100} />
                    </div>
                  </div>
                  <div className="footer-a-sb">
                    <div className={errIncomplete ? "error-incomplete" : "error-incomplete hide"}>
                      Algunos campos estan vacios.
                    </div>
                    <div className={`btn-base secondary-btn`}>
                      <button type='submit'>Guardar</button>
                    </div>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="container">
                {
                  data.length > 0 ? (
                    <>
                      <div className="datatable-container">
                        <table>
                          <tbody>
                            {
                              data.map((dat, i) => (
                                <tr className={'table-07'} key={i}>
                                  <td>
                                    {
                                      dat.method === 'Entrada' ? (
                                        <div className="row-status secondary"></div>
                                      ) : (
                                        <div className="row-status third"></div>
                                      )
                                    }
                                  </td>
                                  <td>
                                    {dat.method}
                                  </td>
                                  <td>
                                    {
                                      dat.method === 'Entrada' ? (
                                        <b>+{dat.amount}</b>
                                      ) : (
                                        <b>{dat.amount}</b>
                                      )
                                    }
                                  </td>
                                  <td>
                                    {dat.reason}
                                  </td>
                                  <td>
                                    {dat.newStock}
                                  </td>
                                </tr>
                              ))
                            }
                          </tbody>
                        </table>
                      </div>
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
                    </>
                  ) : (
                    <div className="title-container">
                      <span>No existen <b>datos que mostrar</b></span>
                    </div>
                  )
                }
              </div>
            </>
          )
        }
      </div>
    </>
  )
}

export default Page