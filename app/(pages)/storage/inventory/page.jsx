'use client'

import React, { useState } from 'react'
import BtnAdd from '@public/assets/icons/btn-add.webp'
import Trash from '@public/assets/icons/btn-trash.webp'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from '@node_modules/axios'
import { jwtDecode } from '@node_modules/jwt-decode/build/cjs'

const Page = () => {

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Motive */

  const [reason, setReason] = useState('')

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

  const handleCartChange = (cod, field, value) => {
    setProCart((prev) => {
      const updatedCart = prev.map((product) => {
        if (product.cod === cod) {
          const updatedProduct = { ...product };

          if (field === "amount") {
            let sanitizedValue = value.replace(/[^0-9.-]/g, ""); // Permite números, puntos y guiones
            const parts = sanitizedValue.split(".");

            // Asegurar que haya solo un signo negativo al principio
            if (
              sanitizedValue.indexOf("-") > 0 || // Si el guion no está al inicio
              (sanitizedValue.match(/-/g) || []).length > 1 // O si hay más de un guion
            ) {
              sanitizedValue = sanitizedValue.replace(/-/g, ""); // Eliminar todos los guiones
              sanitizedValue = "-" + sanitizedValue; // Asegurar que el guion esté al inicio
            }

            // Asegurar que haya solo un punto decimal
            if (parts.length > 2) {
              sanitizedValue = parts[0] + "." + parts.slice(1).join("");
            }

            // Limitar a dos decimales si hay un valor decimal
            if (parts[1]?.length > 2) {
              sanitizedValue = `${parts[0]}.${parts[1].slice(0, 2)}`;
            }

            // Permitir guion o valor vacío como entrada parcial
            if (sanitizedValue === "-" || sanitizedValue === "") {
              updatedProduct.amount = sanitizedValue; // Mantén la entrada parcial
            } else {
              // Validar que sea un número válido
              updatedProduct.amount = isNaN(Number(sanitizedValue))
                ? 0
                : Number(sanitizedValue); // Convertir a número
            }
          }

          // Calcular el total solo si los valores son válidos
          const stock = isNaN(Number(updatedProduct.stock))
            ? 0
            : Number(updatedProduct.stock);
          const amount = isNaN(Number(updatedProduct.amount))
            ? 0
            : Number(updatedProduct.amount);

          updatedProduct.total = stock + amount;
          return updatedProduct;
        }
        return product;
      });

      return updatedCart;
    });

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
            (Number(updatedCart[existingProductIndex].amount)) + updatedCart[existingProductIndex].stock
        }
        return updatedCart
      }

      const newCart = [
        ...prev,
        {
          cod: selPro.cod,
          name: selPro.name,
          stock: selPro.stock,
          amount: 1,
          total: selPro.stock + 1,
        },
      ]
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

  const [errIncomplete, setErrIncomplete] = useState(false)

  const handleIncomplete = () => {
    setErrIncomplete(true)

    setTimeout(() => {
      setErrIncomplete(false)
    }, 5000)
  }

  const sendData = async () => {
    if (!reason || proCart.length === 0) {
      handleIncomplete()
    } else {
      setLoading(true)
      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name
      const dataObject = {
        reason: reason,
        cart: proCart,
        user: user
      }

      try {
        const res = await axios.post('/api/storage/inventory', dataObject)
        setReason('')
        setProCart([])
        router.push('/storage')
      } catch (e) {
        console.log(e)
      }
      setLoading(false)
    }
  }

  return (
    <>
      <div className='pagename'>
        <span>
          Inventario
        </span>
      </div>
      <div className="workspace">
        <div className="container">
          <div className="row">
            <div className="title-container">
              <span><b>Razón:</b></span>
            </div>
            <input className="input-st full" placeholder='Importacion N#00000' value={reason} onChange={(e) => setReason(e.target.value)} maxLength={100} />
          </div>
        </div>
        <div className="container">
          <div className="title-container">
            <b>Productos</b>
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
                      Stock
                    </div>
                    <div className="item">
                      Cantidad
                    </div>
                    <div className="item end">
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
                            <b>{pro.stock}</b>
                          </div>
                          <div className="item">
                            <input
                              className="input-st"
                              value={pro.amount}
                              onChange={(e) => handleCartChange(pro.cod, "amount", e.target.value)}
                            />u
                          </div>
                          <div className="item read end">
                            <b>{pro.total}</b>
                          </div>
                        </div>
                      ))
                    }

                  </div>
                </div>
                <div className="footer-a-sb">
                  <div className={errIncomplete ? "error-incomplete" : "error-incomplete hide"}>
                    Algunos campos están vacios.
                  </div>
                  <div className={`btn-base secondary-btn`}>
                    <button type='button' onClick={() => sendData()}>Guardar</button>
                  </div>
                </div>
              </>
            )
          }
        </div>
      </div>
    </>
  )
}

export default Page