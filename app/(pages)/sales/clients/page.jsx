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

import Image from 'next/image'
import ConfirmModal from '@public/components/modals/ConfirmModal'
import { jwtDecode } from 'jwt-decode'
import axios from 'axios'

const Page = () => {

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
      const res = await axios.get(`/api/sales/clients?page=${page}&term=${term}`)
      setData(res.data.data)
      setCurrentPage(res.data.currentPage)
      setTotalPages(res.data.totalPages)
      setTotalData(res.data.totalCli)
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
      typedni: '',
      dni: '',
      name: '',
      email: '',
      phone: '',
      address: ''
    })
  }

  const handleEdit = () => {
    setEdit(true)
    setNewData({
      typedni: selRow.type,
      dni: selRow.dni,
      name: selRow.name,
      email: selRow.email,
      phone: selRow.phone,
      address: selRow.address
    })
    setAdd(current => !current)
  }

  /* Select Row */

  const [selRow, setSelRow] = useState({
    _id: 0
  })

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

      const res = await axios.delete('/api/sales/clients', {
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
    typedni: '',
    dni: '',
    name: '',
    email: '',
    phone: '',
    address: ''
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
    if (newData.name.length === 0 || newData.email.length === 0 || errEmail || newData.dni.length === 0 || newData.phone.length === 0 || newData.address.length === 0 || newData.typedni.length === 0) {
      handleIncomplete()
    } else {
      setErrIncomplete(false)
      const token = localStorage.getItem('APSOQMEU')
      const decoded = jwtDecode(token)
      const user = decoded.name
      if (isEdit) {

        const dataObject = {
          id: selRow._id,
          type: newData.typedni,
          dni: newData.dni,
          name: newData.name,
          email: newData.email,
          address: newData.address,
          phone: newData.phone
        }

        try {
          const res = await axios.put('/api/sales/clients', dataObject)
          setNewData({
            typedni: '',
            dni: '',
            name: '',
            email: '',
            phone: '',
            address: ''
          })
          setSelRow({ _id: 0 })
          fetchData()
          handleAdd()
        } catch (e) {
          console.log(e)
        }

      } else {

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
          setNewData({
            typedni: '',
            dni: '',
            name: '',
            email: '',
            phone: '',
            address: ''
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
          Clientes
        </span>
      </div>
      <div className="workspace">
        <div className="container">
          <div className="row">
            <div className="title-container">
              <span>Total <b>clientes</b></span>
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
                        Tipo de DNI:
                      </div>
                      <select value={newData.typedni} onChange={handleNewData} name='typedni'>
                        <option value="">Seleccionar</option>
                        <option value="Cédula">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="Pasaporte">Pasaporte</option>
                        <option value="Identificación del exterior">Identificación del exterior</option>
                      </select>
                    </div>
                    <div className="input-form">
                      <div className='input-name'>
                        DNI:
                      </div>
                      <input type="text" value={newData.dni} onChange={handleNewData} name='dni' maxLength={13} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-form">
                      <div className='input-name'>
                        Razón social
                      </div>
                      <input type="text" value={newData.name} onChange={handleNewData} name='name' />
                    </div>
                    <div className="input-form">
                      <div className='input-name'>
                        Email
                      </div>
                      <input className={errEmail ? 'err' : ''} type="text" value={newData.email} onChange={handleNewData} name='email' maxLength={150} />
                    </div>
                  </div>
                  <div className="row">
                    <div className="input-form">
                      <div className='input-name'>
                        Dirección:
                      </div>
                      <input type="text" value={newData.address} onChange={handleNewData} name='address' maxLength={200} />
                    </div>
                    <div className="input-form">
                      <div className='input-name'>
                        Teléfono:
                      </div>
                      <input type="text" value={newData.phone} onChange={handleNewData} name='phone' maxLength={10} />
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
                          <tr className='table-09 nb'>
                            <th>
                              DNI
                            </th>
                            <th>
                              Razón Social
                            </th>
                            <th>
                              Email
                            </th>
                            <th>
                              Teléfono
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {
                            data.map((dat, i) => (
                          <tr key={i} className={selRow._id === dat._id ? 'table-09 active' : 'table-09'}
                          onClick={() => setSelRow(dat)}>
                            <td>
                              {dat.dni}
                            </td>
                            <td>
                              {dat.name}
                            </td>
                            <td>
                              {dat.email}
                            </td>
                            <td>
                              {dat.phone}
                            </td>
                          </tr>
                          ))}
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