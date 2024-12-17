'use client'

import React, { useEffect, useState } from 'react'
import Deselect from '@public/assets/icons/btn-deselect.webp'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Trash from '@public/assets/icons/btn-trash.webp'
import axios from '@node_modules/axios'
import { jwtDecode } from '@node_modules/jwt-decode/build/cjs'


const Page = ({ params }) => {


  const { id } = React.use(params)

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Client Data */

  const [data, setData] = useState({
    client: '',
    cod: '000',
    notes: '',
    paymentMethod: '',
    status: '',
    saler: ''
  })

  const [cliData, setCliData] = useState({
    type: '',
    dni: '9999999999999',
    name: 'Cliente',
    email: 'dimar@dimar.com',
    phone: '0999999999',
    address: '---'
  })

  const fetchData = async (_id) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/sales/sales/single?id=${_id}`)
      setCliData(res.data.data.billData)
      setProCart(res.data.data.cart)
      setData(res.data.data)
      calculateCartValues(res.data.data.cart)
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }

  const [errEmail, setErrEmail] = useState(false)

  const handleCliData = (e) => {

    const { name, value } = e.target

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        if (value.length < 1) {
          setErrEmail(false)
        } else {
          setErrEmail(true)
        }
      } else {
        setErrEmail(false)
      }
    }

    setCliData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  /* Products Cart */

  const [proCart, setProCart] = useState([
    { cod: '00000', name: '----', price: '0.00', amount: 0, desc: 0, total: 0 }
  ])


  const [cartSubtotal, setCartSubtotal] = useState(0)

  const [cartIva, setCartIva] = useState(0)

  const [cartTotal, setCartTotal] = useState(0)

  const calculateCartValues = (cart) => {
    let subtotal = 0
    let total = 0

    cart.forEach((product) => {
      total += product.total
      subtotal += product.total / 1.12 // Assuming 12% IVA
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

  /* Pay Method */

  const [payMethod, setPayMethod] = useState('Efectivo')

  const handleBill = async () => {

    setLoading(true)
    const token = localStorage.getItem('APSOQMEU')
    const decoded = jwtDecode(token)
    const user = decoded.name
    const dataObject = {
      id: id,
      method: payMethod,
      biller: user,
      codDoc: '01',
      ptoEmi: '002'
    }
    try {

      const res = await axios.post('/api/billing/bill', dataObject)
      console.log(res.data)
      router.push('/billing/sales')
    } catch (e) {
      console.log(e)
    }
    setLoading(false)
  }


  useEffect(() => {
    fetchData(id)
  }, [])

  return (
    <>
      <div className='pagename'>
        <span>
          Venta
        </span>
      </div>
      <div className="workspace">
        <div className="container-row">
          <div className="container w5">
            <div className="row">
              <div className="title-container">
                <span><b>Venta</b></span>
              </div>
              <div className="title-container">
                <span><b>{data.cod}</b></span>
              </div>
            </div>
          </div>
          <div className="container hble" onClick={() => router.push('/billing/sales')}>
            <div className="inner-btn">
              <Image src={Deselect} width={10} height={'auto'} alt='Extend' />
            </div>
          </div>
        </div>
        <div className="container">
          <div className="title-container st">
            <span><b>Información Cliente</b></span>
          </div>
          <form className='form-container'>
            <div className="row">
              <div className="input-form">
                <div className='input-name'>
                  Tipo de DNI:
                </div>
                <select value={cliData.type} onChange={handleCliData} name='typedni'>
                  <option value="">Seleccionar</option>
                  <option value="Cédula">Cédula</option>
                  <option value="RUC">Ruc</option>
                  <option value="Pasaporte">Pasaporte</option>
                  <option value="Identificación del exterior">Identificación del exterior</option>
                </select>
              </div>
              <div className="input-form">
                <div className='input-name'>
                  DNI:
                </div>
                <input type="text" value={cliData.dni} onChange={handleCliData} name='dni' maxLength={13} />
              </div>
            </div>
            <div className="row">
              <div className="input-form">
                <div className='input-name'>
                  Razón social
                </div>
                <input type="text" value={cliData.name} onChange={handleCliData} name='name' maxLength={150} />
              </div>
              <div className="input-form">
                <div className='input-name'>
                  Email
                </div>
                <input className={errEmail ? 'err' : ''} type="text" value={cliData.email} onChange={handleCliData} name='email' maxLength={150} />
              </div>
            </div>
            <div className="row">
              <div className="input-form">
                <div className='input-name'>
                  Dirección:
                </div>
                <input type="text" value={cliData.address} onChange={handleCliData} name='address' maxLength={200} />
              </div>
              <div className="input-form">
                <div className='input-name'>
                  Teléfono:
                </div>
                <input type="text" value={cliData.phone} onChange={handleCliData} name='phone' maxLength={10} />
              </div>
            </div>
          </form>
        </div>
        <div className="container">
          <div className="title-container">
            <b>Carrito</b>
          </div>
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
        </div>
        <div className="container">
          <div className="row">
            <div className="warp">
              <div className="title-container">
                Método de pago:
              </div>
              <select value={payMethod} className="input-st full" onChange={(e) => setPayMethod(e.target.value)}>
                <option value='SIN UTILIZACION DEL SISTEMA FINANCIERO'>Sin utilizacion del sistema financiero</option>
                <option value='COMPENSACIÓN DE DEUDAS'>Compensación de deudas</option>
                <option value='TARJETA DE DÉBITO'>Tarjeta de débito</option>
                <option value='DINERO ELECTRÓNICO'>Dinero electrónico</option>
                <option value='TARJETA PREPAGO'>Tarjeta prepago</option>
                <option value='TARJETA DE CRÉDITO'>Tarjeta de crédito</option>
                <option value='OTROS CON UTILIZACIÓN DEL SISTEMA FINANCIERO'>Otros con utilización del sistema financiero</option>
                <option value='ENDOSO DE TÍTULOS'>Endoso de títulos</option>
              </select>
            </div>
            <div className="btn-base-div secondary" onClick={() => handleBill()}>
              <div className='btn-name'>
                Facturar
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page