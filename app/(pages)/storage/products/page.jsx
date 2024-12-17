'use client'

import React, { useEffect, useState } from 'react'
import BtnAdd from '@public/assets/icons/btn-add.webp'
import BtnEdit from '@public/assets/icons/btn-edit.webp'
import BtnDisable from '@public/assets/icons/btn-disable.webp'
import BtnDelete from '@public/assets/icons/btn-delete.webp'
import Search from '@public/assets/icons/search-icon.webp'
import Next from '@public/assets/icons/dt-next.webp'
import End from '@public/assets/icons/dt-end.webp'
import Start from '@public/assets/icons/dt-start.webp'
import Previous from '@public/assets/icons/dt-previous.webp'
import Deselect from '@public/assets/icons/btn-deselect.webp'
import Check from '@public/assets/icons/btn-check.webp'
import Image from 'next/image'
import ConfirmModal from '@public/components/modals/ConfirmModal'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const page = () => {

  const router = useRouter()

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Datatable */

  const [data, setData] = useState([])

  const [currentPage, setCurrentPage] = useState(1)

  const [totalPages, setTotalPages] = useState(1)

  const [totalData, setTotalData] = useState(0)

  const fetchData = async (page = 1, term = '') => {
    try {
      setLoading(true)
      const res = await axios.get(`/api/storage/products?page=${page}&term=${term}`)
      setData(res.data.data)
      setCurrentPage(res.data.currentPage)
      setTotalPages(res.data.totalPages)
      setTotalData(res.data.totalPro)
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

  const [isEdit, setEdit] = useState(false)

  const handleAdd = () => {
    setSelRow({ _id: 0 })
    setAdd(current => !current)
    setEdit(false)
    setNewData({
      name: '',
      email: '',
      rol: '',
      password: ''
    })
  }

  const handleEdit = () => {
    setEdit(true)
    setNewData({
      cod: selRow.cod,
      name: selRow.name,
      cat: selRow.cat,
      und: selRow.und,
      price: selRow.price,
    })
    setAdd(current => !current)
  }

  /* Select Row */

  const [selRow, setSelRow] = useState({
    _id: 0
  })

  /* Disable Row */

  const handleDisable = async () => {
    const dataObject = {
      action: 'changestatus',
      id: selRow._id,
      status: !selRow.status
    }
    try {
      const res = await axios.put('/api/storage/products', dataObject)
      if (res.data.error) {
        console.log(res.data.error)
      } else {
        setSelRow({ _id: 0 })
        fetchData()
      }
    } catch (e) {
      console.log(e)
    }
  }

  /* Delete Row */

  const [delModal, setDelModal] = useState(false)

  const handleDelModal = () => {
    setDelModal(current => !current)
  }
  const handleDelete = () => {
    handleDelModal()
  }

  const handleDeleteRow = async () => {
    try {

      const res = await axios.delete('/api/storage/products', {
        data: { id: selRow._id }
      })
      fetchData()

    } catch (e) {
      console.log(e)
    }
    handleDelModal()
  }

  /* New Data */

  const [newData, setNewData] = useState({
    cod: '',
    name: '',
    cat: '',
    und: '',
    price: '',
  })

  const [errIncomplete, setErrIncomplete] = useState(false)


  const handleNewData = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;

    if (name === "cod") {
      // Allow only integer numbers
      sanitizedValue = value.replace(/[^0-9]/g, ""); // Remove non-numeric characters
    } else if (name === "price") {
      // Allow double numbers with up to two decimals
      sanitizedValue = value.replace(/[^0-9.]/g, ""); // Allow only numbers and dots
      const parts = sanitizedValue.split(".");
      if (parts.length > 2) {
        // If more than one dot exists, remove additional dots
        sanitizedValue = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1]?.length > 2) {
        // Limit to two decimal places
        sanitizedValue = `${parts[0]}.${parts[1].slice(0, 2)}`;
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
    if (newData.name.length === 0 || newData.und.length === 0 || newData.price.length === 0 || newData.cat.length === 0 ) {
      handleIncomplete()
    } else {
      setErrIncomplete(false)

      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name

      if (isEdit) {

        const dataObject = {
          action: 'changepro',
          id: selRow._id,
          cod: newData.cod,
          name: newData.name,
          cat: newData.cat,
          und: newData.und,
          price: newData.price,
        }

        try {
          const res = await axios.put('/api/storage/products', dataObject)
          setNewData({
            cod: '',
            name: '',
            cat: '',
            und: '',
            price: '',
          })
          setSelRow({ _id: 0 })
          fetchData()
          handleAdd()
        } catch (e) {
          console.log(e)
        }

      } else {

        const dataObject = {
          cod: newData.cod,
          name: newData.name,
          cat: newData.cat,
          und: newData.und,
          price: newData.price,
          user: user
        }

        try {
          const res = await axios.post('/api/storage/products', dataObject)
          setNewData({
            cod: '',
            name: '',
            cat: '',
            und: '',
            price: '',
          })
          fetchData()
          handleAdd()
        } catch (e) {
          console.log(e)
        }
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
    fetchData(currentPage, '')
  }, [])

  useEffect(() => {
    setLoading(true)
    fetchData(currentPage, '')
    setLoading(false)
  }, [currentPage])

  useEffect(() => {
    setLoading(true)
    setCurrentPage(1)
    fetchData(1, searchVal)
    setLoading(false)
  }, [searchVal])

  return (
    <>
      <ConfirmModal active={delModal} handleModal={handleDelModal} msg={'eliminar'} handleResponse={handleDeleteRow} />
      <div className='pagename'>
        <span>
          Productos
        </span>
      </div>
      <div className="workspace">
        <div className="container">
          <div className="row">
            <div className="title-container">
              <span>Total <b>productos</b></span>
            </div>
            <div className="title-container">
              <span><b>{totalData}</b></span>
            </div>
          </div>
        </div>
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
            <div className={`btn-base-div secondary ${selRow._id === 0 ? 'dis' : ''}`} onClick={handleEdit}>
              <div className="btn-icon">
                <Image src={BtnEdit} width={'auto'} height={13} alt='Edit' />
              </div>
              <div className="btn-name">
                Editar
              </div>
            </div>
            <div className={`btn-base-div gray ${selRow._id === 0 ? 'dis' : ''}`} onClick={handleDisable}>
              <div className="btn-icon">
                {
                  selRow && selRow.status !== undefined ? (
                    selRow.status ? (
                      <Image src={BtnDisable} width={'auto'} height={13} alt='Disable' />
                    ) : (
                      <Image src={Check} width={'auto'} height={13} alt='Enable' />
                    )
                  ) : (
                    <Image src={BtnDisable} width={'auto'} height={13} alt='Disable' />
                  )
                }
              </div>
              <div className="btn-name">
                {
                  selRow && selRow.status !== undefined ? (
                    selRow.status ? (
                      'Deshabilitar'
                    ) : (
                      'Habilitar'
                    )
                  ) : (
                    'Deshabilitar'
                  )
                }
              </div>
            </div>
            <div className={`btn-base-div black ${selRow._id === 0 ? 'dis' : ''}`} onClick={() => handleDelete()}>
              <div className="btn-icon">
                <Image src={BtnDelete} width={'auto'} height={13} alt='Delete' />
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
                  <b>Datos del producto</b>
                </div>
                <form className='form-container' type='submit' onSubmit={sendData}>
                  <div className="row">
                    <div className="input-form">
                      <div className='input-name'>
                        Código:
                      </div>
                      <input type="text" value={newData.cod || ''} onChange={handleNewData} name='cod' maxLength={5} disabled={isEdit}/>
                    </div>
                    <div className="input-form">
                      <div className='input-name'>
                        Nombre:
                      </div>
                      <input type="text" value={newData.name} onChange={handleNewData} name='name' />
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-form">
                      <div className='input-name'>
                        Unidad:
                      </div>
                      <select value={newData.und} onChange={handleNewData} name='und'>
                        <option value="">Seleccionar</option>
                        <option value="metros">metros</option>
                        <option value="unidad">unidad</option>
                        <option value="par">par</option>
                      </select>
                    </div>
                    <div className="input-form">
                      <div className='input-name'>
                        Categoría:
                      </div>
                      <select value={newData.cat} onChange={handleNewData} name='cat'>
                        <option value="">Seleccionar</option>
                        <option value="Textil">Textil</option>
                        <option value="Suelas">Suela</option>
                        <option value="Pegante">Pegante</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-form">
                      <div className='input-name'>
                        Precio:
                      </div>
                      <input type="text" value={newData.price || ''} onChange={handleNewData} name='price' maxLength={10} />
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
                          <tr className='table-06 nb'>
                            <th>
                            </th>
                            <th>
                              Cod
                            </th>
                            <th>
                              Nombre
                            </th>
                            <th>
                              Cat
                            </th>
                            <th>
                              Und
                            </th>
                            <th>
                              Precio
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            data.map((dat, i) => (
                              <tr key={i} className={selRow._id === dat._id ? 'table-06 active' : 'table-06'}
                                onClick={() => setSelRow(dat)}
                                onDoubleClick={() => router.push(`/storage/inventory/${dat._id}`)}>
                                <td>
                                  {
                                    dat.status ? (
                                      <div className="row-status"></div>
                                    ) : (
                                      <div className="row-status gray"></div>
                                    )
                                  }
                                </td>
                                <td>
                                  {dat.cod}
                                </td>
                                <td>
                                  {dat.name}
                                </td>
                                <td>
                                  {dat.cat}
                                </td>
                                <td>
                                  {dat.und}
                                </td>
                                <td>
                                  $<b>{dat.price}</b>
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

export default page