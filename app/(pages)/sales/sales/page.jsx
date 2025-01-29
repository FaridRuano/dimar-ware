'use client'

import React, { useEffect, useState } from 'react'
import BtnAdd from '@public/assets/icons/btn-add.webp'
import BtnCheck from '@public/assets/icons/btn-check.webp'
import BtnDelete from '@public/assets/icons/btn-delete.webp'
import Search from '@public/assets/icons/search-icon.webp'
import Next from '@public/assets/icons/dt-next.webp'
import End from '@public/assets/icons/dt-end.webp'
import Start from '@public/assets/icons/dt-start.webp'
import Previous from '@public/assets/icons/dt-previous.webp'
import Deselect from '@public/assets/icons/btn-deselect.webp'
import Trash from '@public/assets/icons/btn-trash.webp'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import NewClientModal from '@public/components/modals/NewClientModal'
import axios from 'axios'
import { jwtDecode } from '@node_modules/jwt-decode/build/cjs'
import ConfirmModal from '@public/components/modals/ConfirmModal'

const mongoClientData = async (type, page, term, user, signal) => {
  try {
    const uri = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${uri}/api/sales/sales?type=${type}&page=${page}&term=${term}&user=${user}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      signal: signal
    })

    if (!res.ok) {
      throw new Error("Failed")
    }
    const ponse = await res.json()
    return {
      data: ponse.data,
      currentPage: ponse.currentPage,
      totalPages: ponse.totalPages,
      totalSales: ponse.totalSales,
      totalSalesPending: ponse.totalSalesPending,
      totalSalesToDeliver: ponse.totalSalesToDeliver,
      totalSalesComplete: ponse.totalSalesComplete
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      /* console.log('Fetch aborted'); */
    } else {
      console.error('Fetch error:', error);
    }
    return {
      data: null,
      currentPage: 1,
      totalPages: 1,
      totalSales: 0,
      totalSalesPending: 0,
      totalSalesToDeliver: 0,
      totalSalesComplete: 0
    }
  }
}

const Page = () => {

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


  const fetchData = async (type = 1, page = 1, term = '', signal = undefined) => {
    try {
      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name
      const { data, currentPage, totalPages, totalSales, totalSalesPending, totalSalesToDeliver, totalSalesComplete } = await mongoClientData(type, page, term, user, signal)
      if (data === null) {
        return
      }
      setData(data)
      setCurrentPage(currentPage)
      setTotalPages(totalPages)
      setTotalData(totalSales)
      setTotalData2(totalSalesPending)
      setTotalData3(totalSalesToDeliver)
      setTotalData4(totalSalesComplete)
    } catch (e) {
      console.log('Something went wrong:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleNextPage = () => {
    setSelRow({ _id: 0 })
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    setSelRow({ _id: 0 })
    setCurrentPage(prevPage => (prevPage > 1 ? prevPage - 1 : prevPage))
  }

  const handleFirstPage = () => {
    setSelRow({ _id: 0 })
    setCurrentPage(1);
  }

  const handleLastPage = () => {
    setSelRow({ _id: 0 })
    setCurrentPage(totalPages)
  }

  /* Form Handler */

  const [isAdd, setAdd] = useState(false)

  const handleAdd = () => {
    setSelRow({ _id: 0 })
    setAdd(current => !current)
  }

  /* Select Row */

  const [selRow, setSelRow] = useState({
    _id: 0
  })

  /* Complete Row */

  const handleComplete = async () => {
    setLoading(true)
    const token = localStorage.getItem('APSOQMEU')
    const decoded = jwtDecode(token)
    const user = decoded.name
    const dataObject = {
      id: selRow._id,
      user: user
    }
    try {
      const res = await axios.put('/api/sales/sales', dataObject)
      fetchData(currentType, currentPage, searchVal)
      setSelPro({ _id: 0 })
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const [delModal, setDelModal] = useState(false)

  const handleDelModal = () => {
    setDelModal(current => !current)
  }
  const handleDelete = () => {
    handleDelModal()
  }

  const handleDeleteRow = async () => {
    try {

      const res = await axios.delete('/api/sales/sales', {
        data: { id: selRow._id }
      })
      fetchData()

    } catch (e) {
      console.log(e)
    }
    handleDelModal()
  }

  const [errIncomplete, setErrIncomplete] = useState(false)

  const handleIncomplete = () => {
    setErrIncomplete(true)

    setTimeout(() => {
      setErrIncomplete(false)
    }, 5000)
  }

  /* Product Search */

  const [proName, setProName] = useState("")
  const [proCod, setProCod] = useState("")
  const [filteredProducts, setFilteredProducts] = useState([])
  const [productSelected, setProductSelected] = useState(false)

  const handleProNameChange = async (e) => {
    const value = e.target.value
    setProCod('')
    setProductSelected(false)
    setProName(value)
    const res = await axios.get(`/api/sales/sales/products?name=${value}`);

    setFilteredProducts(res.data.data)
  }

  const handleProCodChange = async (e) => {
    const value = e.target.value
    let sanitizedValue = value;
    sanitizedValue = value.replace(/[^0-9]/g, "")
    setProName("")
    setProductSelected(false)
    setProCod(sanitizedValue)

    const res = await axios.get(`/api/sales/sales/products?cod=${sanitizedValue}`);

    setFilteredProducts(res.data.data)
  }

  const [selPro, setSelPro] = useState()

  const handleSelPro = (product) => {
    setProName(product.name)
    setProCod(product.cod)
    setProductSelected(true)
    setFilteredProducts([])
    setSelPro(product)
  }

  const isProductsInput = () => {
    if (!proCod && !proName) return false
    if (productSelected) return false
    return true
  }

  const closeProSearchResult = () => {
    setProCod('')
    setProName('')
    setProductSelected(false)
  }

  /* Product Cart */

  const [proCart, setProCart] = useState([])

  const [cartSubtotal, setCartSubtotal] = useState(0)

  const [cartIva, setCartIva] = useState(0)

  const [cartTotal, setCartTotal] = useState(0)

  const calculateCartValues = (cart) => {
    let subtotal = 0
    let total = 0

    cart.forEach((product) => {
      total += product.total
      subtotal += product.total / 1.15 // Assuming 15% IVA
    })

    const iva = total - subtotal

    setCartSubtotal(subtotal)
    setCartIva(iva)
    setCartTotal(total)
  }

  const handleCartChange = (cod, field, value) => {
    setProCart((prev) => {
      const updatedCart = prev.map((product) => {
        if (product.cod === cod) {
          const updatedProduct = { ...product }

          if (field === "amount") {
            const sanitizedValue = value.replace(/[^0-9.]/g, "")
            const parts = sanitizedValue.split(".")
            if (parts.length > 2) {
              sanitizedValue = parts[0] + "." + parts.slice(1).join("")
            }
            if (parts[1]?.length > 2) {
              sanitizedValue = `${parts[0]}.${parts[1].slice(0, 2)}`
            }
            updatedProduct.amount = isNaN(sanitizedValue) || sanitizedValue < 0 ? 0 : sanitizedValue
          }

          if (field === "desc") {
            const discount = parseInt(value, 10)
            updatedProduct.desc = isNaN(discount) || discount < 0 ? 0 : discount > 100 ? 100 : discount
          }

          updatedProduct.total =
            updatedProduct.price * updatedProduct.amount * (1 - updatedProduct.desc / 100)
          return updatedProduct
        }
        return product
      })

      calculateCartValues(updatedCart) // Calculate with the updated cart
      return updatedCart
    })
  }

  const addToCart = () => {
    if (!productSelected) return
    setProCart((prev) => {
      const existingProductIndex = prev.findIndex((product) => product.cod === selPro.cod)

      if (existingProductIndex !== -1) {
        const updatedCart = [...prev]
        updatedCart[existingProductIndex] = {
          ...updatedCart[existingProductIndex],
          amount: Number(updatedCart[existingProductIndex].amount) + 1,
          total:
            (Number(updatedCart[existingProductIndex].amount) + 1) *
            updatedCart[existingProductIndex].price *
            (1 - updatedCart[existingProductIndex].desc / 100),
        }
        calculateCartValues(updatedCart)
        return updatedCart
      }

      const newCart = [
        ...prev,
        {
          cod: selPro.cod,
          name: selPro.name,
          price: selPro.price,
          amount: 1,
          desc: 0,
          total: selPro.price,
        },
      ]
      calculateCartValues(newCart)
      return newCart
    })

    setProCod("")
    setProName("")
    setProductSelected(false)
  }


  const delFromCart = (cod) => {
    setProCart((prev) => {
      const updatedCart = prev.filter((product) => product.cod !== cod)
      calculateCartValues(updatedCart)
      return updatedCart
    })
  }

  const saveSale = async () => {
    if (!dni || proCart.length === 0) {
      handleIncomplete()
    } else {
      setLoading(true)
      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name

      const dataObject = {
        dni: dni,
        subtotal: cartSubtotal.toFixed(2),
        iva: cartIva.toFixed(2),
        total: cartTotal.toFixed(2),
        cart: proCart,
        saler: user,
      }
      try {
        const res = await axios.post('/api/sales/sales', dataObject)
        setDni('')
        setReason('')
        setClientSelected(false)
        setProCart([])
        setCartIva(0)
        setCartSubtotal(0)
        setCartTotal(0)
        handleAdd()
        fetchData(1, 1, '')
      } catch (e) {
        console.log(e)
      }
      setLoading(false)
    }
  }

  /* Clients */

  const [dni, setDni] = useState("")
  const [reason, setReason] = useState("")
  const [filteredClients, setFilteredClients] = useState([])
  const [clientSelected, setClientSelected] = useState(false)

  const handledniChange = async (e) => {
    const value = e.target.value;
    let sanitizedValue = value.replace(/[^0-9]/g, "")
    setReason("")
    setClientSelected(false)
    setDni(sanitizedValue)

    const res = await axios.get(`/api/sales/sales/clients?dni=${sanitizedValue}`);

    setFilteredClients(res.data.data);
  }

  const handlereasonChange = async (e) => {
    const value = e.target.value
    setDni("")
    setClientSelected(false)
    setReason(value)

    const res = await axios.get(`/api/sales/sales/clients?reason=${value}`);

    setFilteredClients(res.data.data);
  }

  const handleSel = (client) => {
    setDni(client.dni)
    setReason(client.name)
    setClientSelected(true)
    setFilteredClients([])
  }

  const isInput = () => {
    if (!dni && !reason) return false
    if (clientSelected) return false
    return true
  }

  /* New Client */

  const [cliModal, setCliModal] = useState(false)

  const handleCliModal = () => {
    setCliModal(current => !current)
  }

  const handleCliModalResponse = async (newData) => {
    handleCliModal()
    setClientSelected(true)
    setDni(newData.dni)
    setReason(newData.name)
    const token = localStorage.getItem('APSOQMEU')
    const decoded = jwtDecode(token)
    const user = decoded.name
    const dataObject = {
      type: newData.typedni,
      dni: newData.dni,
      name: newData.name,
      email: newData.email,
      address: newData.address,
      phone: newData.phone,
      user: user
    }
    try {
      const res = await axios.post('/api/sales/clients', dataObject)
    } catch (e) {
      console.log(e)
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
    const controller = new AbortController()
    setCurrentPage(1)
    fetchData(1, 1, searchVal, controller.signal)
    return () => controller.abort()
  }, [searchVal])

  useEffect(() => {
    const controller = new AbortController()
    fetchData(currentType, currentPage, searchVal, controller.signal)
    return () => controller.abort()
  }, [currentType, currentPage])

  return (
    <>
      <ConfirmModal active={delModal} handleModal={handleDelModal} msg={'eliminar'} handleResponse={handleDeleteRow} />
      <NewClientModal active={cliModal} handleModal={handleCliModal} handleResponse={handleCliModalResponse} />
      <div className='pagename'>
        <span>
          Ventas
        </span>
      </div>
      <div className={`workspace ${loading ? 'loading' : ''}`}>
        {
          isAdd ? (
            <div className="container">
              <div className="row">
                <div className="title-container">
                  <span><b>Cliente</b></span>
                </div>
                <div className="clients-component">
                  <input
                    className="input-st"
                    placeholder="Cédula"
                    value={dni}
                    onChange={handledniChange}
                    maxLength={13}
                  />
                  <input
                    className="input-st full"
                    placeholder="Razón Social"
                    value={reason}
                    onChange={handlereasonChange}
                  />
                  {isInput() && (
                    <div className="results">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client, index) => (
                          <div
                            key={index}
                            className="client-item"
                            onClick={() => handleSel(client)}
                          >
                            <div className="dni">{client.dni}</div>
                            <div className="name">{client.name}</div>
                          </div>
                        ))
                      ) : (
                        <div className="client-notfound">No se encontró ningún cliente</div>
                      )}
                    </div>
                  )}
                </div>
                <div className={`btn-base secondary-btn`}>
                  <button type='button' onClick={() => handleCliModal()}>Nuevo</button>
                </div>
              </div>
            </div>
          ) : (
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
          )
        }

        <div className="row">
          <div className="warp">
            <div className={!isAdd ? "btn-base-div" : "btn-base-div gray"} onClick={handleAdd}>
              <div className="btn-icon">
                <Image src={!isAdd ? BtnAdd : BtnDelete} width={'auto'} height={13} alt='Add' />
              </div>
              <div className="btn-name">
                {
                  isAdd ? (
                    'Cancelar'
                  ) : (
                    'Agregar'
                  )
                }
              </div>
            </div>
          </div>

          <div className={isAdd ? "warp hide" : "warp"}>
            <div className={`btn-base-div black ${selRow.status === 'Por Entregar' ? '' : 'dis'}`} onClick={() => handleComplete()}>
              <div className="btn-icon">
                <Image src={BtnCheck} width={'auto'} height={13} alt='Complete' />
              </div>
              <div className="btn-name">
                Completar
              </div>
            </div>
            <div className={`btn-base-div third ${selRow.status === 'Pendiente' ? '' : 'dis'}`} onClick={() => handleDelete()}>
              <div className="btn-icon">
                <Image src={BtnDelete} width={'auto'} height={13} alt='Complete' />
              </div>
              <div className="btn-name">
                Eliminar
              </div>
            </div>
          </div>
        </div>
        {
          isAdd ? (
            <>
              <div className="container">
                <div className="title-container">
                  <b>Carrito</b>
                </div>
                <div className="search-product">
                  <div className="search-warp">
                    <span>Buscar:</span>
                    <input className='input-st' placeholder='Código' value={proCod} onChange={handleProCodChange} />
                    <input className='input-st full' placeholder='Producto' value={proName} onChange={handleProNameChange} />
                    <div className="btn-add" onClick={() => addToCart()}>
                      <Image src={BtnAdd} width={'auto'} height={13} alt='Add' />
                    </div>
                  </div>
                  {
                    isProductsInput() && (
                      <div className="results">
                        {
                          filteredProducts.length > 0 ? (
                            filteredProducts.map((pro, index) => (
                              <div className="product-item" key={index} onClick={() => handleSelPro(pro)}>
                                <div className="cod">{pro.cod}</div>
                                <div className="name">{pro.name}</div>
                              </div>
                            ))
                          ) : (
                            <div className="product-notfound" onClick={() => closeProSearchResult()}>No se encontró ningún producto</div>
                          )
                        }
                      </div>
                    )
                  }
                </div>
                {
                  proCart.length > 0 && (
                    <>
                      <div className="products-cart">
                        <div className="products-header">
                          <div className="item">

                          </div>
                          <div className="item">
                            Producto
                          </div>
                          <div className="item">
                            Precio
                          </div>
                          <div className="item">
                            Cantidad
                          </div>
                          <div className="item">
                            Desc.
                          </div>
                          <div className="item">
                            Total
                          </div>
                        </div>
                        <div className="products-body">
                          {
                            proCart.map((pro, id) => (
                              <div className="row" key={id}>
                                <div className="item">
                                  <div className="item-btn" onClick={() => delFromCart(pro.cod)}>
                                    <Image src={Trash} width={"auto"} height={17} alt="Trash" />
                                  </div>
                                </div>
                                <div className="item read">{pro.name}</div>
                                <div className="item read">
                                  $<b>{pro.price}</b>
                                </div>
                                <div className="item">
                                  <input
                                    className="input-st"
                                    value={pro.amount}
                                    onChange={(e) => handleCartChange(pro.cod, "amount", e.target.value)}
                                  />u
                                </div>
                                <div className="item input-item">
                                  <input
                                    className="input-st"
                                    value={pro.desc}
                                    onChange={(e) => handleCartChange(pro.cod, "desc", e.target.value)}
                                  />%
                                </div>
                                <div className="item read">
                                  $<b>{pro.total.toFixed(2)}</b>
                                </div>
                              </div>
                            ))
                          }

                        </div>
                        <div className="products-footer">
                          <div className="amount">
                            <div className="amount-dis">
                              <span>Subtotal</span>
                              <div className="item read">
                                $<b>{cartSubtotal.toFixed(2)}</b>
                              </div>
                            </div>
                            <div className="amount-dis">
                              <span>Iva</span>
                              <div className="item read">
                                $<b>{cartIva.toFixed(2)}</b>
                              </div>
                            </div>
                            <div className="amount-dis">
                              <span>Total</span>
                              <div className="item read">
                                $<b>{cartTotal.toFixed(2)}</b>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="footer-a-sb">
                        <div className={errIncomplete ? "error-incomplete" : "error-incomplete hide"}>
                          Algunos campos están vacios.
                        </div>
                        <div className={`btn-base secondary-btn`}>
                          <button type='button' onClick={() => saveSale()}>Guardar</button>
                        </div>
                      </div>
                    </>
                  )
                }
              </div>
            </>
          ) : (
            <>
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
                                onDoubleClick={() => router.push(`/sales/sales/${dat._id}`)}>
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
            </>
          )
        }
      </div>
    </>
  )
}

export default Page