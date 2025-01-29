'use client'

import React, { useEffect, useState } from 'react'
import BtnAdd from '@public/assets/icons/btn-add.webp'
import BtnEdit from '@public/assets/icons/btn-edit.webp'
import BtnDisable from '@public/assets/icons/btn-disable.webp'
import BtnDelete from '@public/assets/icons/btn-delete.webp'
import Search from '@public/assets/icons/search-icon.webp'
import Check from '@public/assets/icons/btn-check.webp'
import Next from '@public/assets/icons/dt-next.webp'
import End from '@public/assets/icons/dt-end.webp'
import Start from '@public/assets/icons/dt-start.webp'
import Previous from '@public/assets/icons/dt-previous.webp'
import Deselect from '@public/assets/icons/btn-deselect.webp'

import Image from 'next/image'
import ConfirmModal from '@public/components/modals/ConfirmModal'
import axios from 'axios'

const Page = () => {

  /* Loading */

  const [loading, setLoading] = useState(true)

  /* Datatable */

  const [data, setData] = useState([])

  const [filteredData, setFilteredData] = useState([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/manager/users')
      setData(res.data.data)
      setFilteredData(res.data.data)
      setTotalPages(Math.ceil(res.data.data.length / itemsPerPage))
    } catch (e) {
      console.log('Something went wrong:', e)
    } finally {
      setLoading(false)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)

  const [totalPages, setTotalPages] = useState(1)

  const itemsPerPage = 10

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

  const [isEdit, setEdit] = useState(false)

  const handleEdit = () => {
    setEdit(true)
    setNewData({
      name: selRow.name,
      email: selRow.email,
      rol: selRow.rol,
      password: '*******'
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
      const res = await axios.put('/api/manager/users', dataObject)
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

      const res = await axios.delete('/api/manager/users', {
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
    name: '',
    email: '',
    rol: '',
    password: ''
  })

  const [errEmail, setErrEmail] = useState(false)

  const [errIncomplete, setErrIncomplete] = useState(false)


  const handleNewData = (e) => {

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

    setNewData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleIncomplete = () => {
    setErrIncomplete(true)

    setTimeout(() => {
      setErrIncomplete(false)
    }, 5000)
  }

  const sendData = async (e) => {
    e.preventDefault()
    if (newData.name.length === 0 || newData.email.length === 0 || errEmail || newData.rol.length === 0 || newData.password.length === 0) {
      handleIncomplete()
    } else {
      setErrIncomplete(false)

      //Data Uploading

      if (isEdit) {

        const dataObject = {
          action: 'changeuser',
          id: selRow._id,
          name: newData.name,
          email: newData.email,
          rol: newData.rol
        }

        try {
          const res = await axios.put('/api/manager/users', dataObject)
          if (res.data.error) {
            setErrEmail(true)
            const errTimer = setTimeout(() => {
              setErrEmail(false)
            }, 4000)

            return () => clearTimeout(errTimer)
          } else {
            console.log(res.data)
            setNewData({
              name: '',
              email: '',
              password: '',
              rol: '',
            })
            setSelRow({ _id: 0 })
            fetchData()
            handleAdd()
          }
        } catch (e) {
          console.log(e)
        }

      } else {

        const dataObject = {
          name: newData.name,
          email: newData.email,
          password: newData.password,
          rol: newData.rol
        }

        try {
          const res = await axios.post('/api/manager/users', dataObject)

          if (res.data.error) {
            setErrEmail(true)
            const errTimer = setTimeout(() => {
              setErrEmail(false)
            }, 4000)

            return () => clearTimeout(errTimer)
          } else {
            setNewData({
              name: '',
              email: '',
              password: '',
              rol: '',
            })
            fetchData()
            handleAdd()
          }
        } catch (e) {
          console.log(e)
        }
      }
    }
  }

  const totalData = () => {
    if (data) {
      return data.length
    } else {
      return 0
    }
  }

  const [searchVal, setSearchVal] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setLoading(true)
    const newFilteredData = data.filter(item =>
      item.name.toLowerCase().includes(searchVal.toLowerCase()))
    setFilteredData(newFilteredData)
    setLoading(false)
    setCurrentPage(1)
    setTotalPages(Math.ceil(newFilteredData.length / itemsPerPage))
  }, [searchVal, data])

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    setFilteredData(data.slice(indexOfFirstItem, indexOfLastItem))
  }, [currentPage, data])

  if (loading) {
    return (
      <>
        <div className='pagename'>
          <span>
            Usuarios
          </span>
        </div>
        <div className="workspace loading">
          <div className="container">
            <div className="row">
              <div className="title-container">
                <span>Total <b>usuarios</b></span>
              </div>
              <div className="title-container">
                <span><b>0</b></span>
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
          <div className="container">
            <div className="title-container">
              <span>No existen <b>datos que mostrar</b></span>
            </div>
          </div>
        </div>
      </>
    )
  } else {
    return (
      <>
        <ConfirmModal active={delModal} handleModal={handleDelModal} msg={'eliminar'} handleResponse={handleDeleteRow} />
        <div className='pagename'>
          <span>
            Usuarios
          </span>
        </div>
        <div className="workspace">
          <div className="container">
            <div className="row">
              <div className="title-container">
                <span>Total <b>usuarios</b></span>
              </div>
              <div className="title-container">
                <span><b>{totalData()}</b></span>
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
                    <b>Datos del usuario</b>
                  </div>
                  <form className='form-container' type='submit' onSubmit={sendData}>
                    <div className="row">
                      <div className="input-form">
                        <div className='input-name'>
                          Nombre:
                        </div>
                        <input type="text" value={newData.name} onChange={handleNewData} name='name' />
                      </div>
                      <div className="input-form">
                        <div className='input-name'>
                          Email:
                        </div>
                        <input className={errEmail ? 'err' : ''} type="text" value={newData.email} onChange={handleNewData} name='email' />
                      </div>
                    </div>
                    <div className="row">
                      <div className="input-form">
                        <div className='input-name'>
                          Rol:
                        </div>
                        <select value={newData.rol} onChange={handleNewData} name='rol'>
                          <option value="">Seleccionar</option>
                          <option value="Gerente">Gerente</option>
                          <option value="Vendedor">Ventas</option>
                          <option value="Bodeguero">Bodeguero</option>
                          <option value="Cajero">Cajero</option>
                        </select>
                      </div>
                      {
                        isEdit ? (
                          <div className="input-form dis">
                            <div className='input-name'>
                              Contraseña:
                            </div>
                            <input type="password" value={newData.password} onChange={handleNewData} name='password' />
                          </div>
                        ) : (
                          <div className="input-form">
                            <div className='input-name'>
                              Contraseña:
                            </div>
                            <input type="password" value={newData.password} onChange={handleNewData} name='password' />
                          </div>
                        )
                      }
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
                {
                  totalData() > 0 ? (
                    <>
                      <div className="container">
                        <div className="search-bar">
                          <div className="search-icon">
                            <Image src={Search} width={'auto'} height={20} alt='Search' />
                          </div>
                          <input type="text" placeholder='Buscar' value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
                          <div className={selRow._id === 0 ? "deselect-icon hide" : "deselect-icon"} onClick={() => setSelRow({ _id: 0 })}>
                            <Image src={Deselect} width={'auto'} height={20} alt='Search' />
                          </div>
                        </div>
                        {
                          filteredData.length > 0 ? (
                            <div className="datatable-container">
                              <table>
                                <thead>
                                  <tr className='table-04 nb'>
                                    <th>
                                    </th>
                                    <th>
                                      Nombre
                                    </th>
                                    <th>
                                      Email
                                    </th>
                                    <th>
                                      Rol
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {
                                    filteredData.map((dat, i) => (
                                      <tr key={i} className={selRow._id === dat._id ? 'table-04 active' : 'table-04'} onClick={() => setSelRow(dat)}>
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
                                          {dat.name}
                                        </td>
                                        <td>
                                          {dat.email}
                                        </td>
                                        <td>
                                          {dat.rol}
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

                    </>
                  ) : (
                    <div className="container">
                      <div className="title-container">
                        <span>No existen <b>datos que mostrar</b></span>
                      </div>
                    </div>
                  )
                }
                {
                  totalData() > 0 && (
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
}

export default Page